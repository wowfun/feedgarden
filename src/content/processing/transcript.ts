import { fixedTask, reportTaskSkill, taskKey, type TaskGenerator } from '../../agent/index.js';
import type { AgentRuntimeConfig } from '../../contracts/agent.js';
import type { Item } from '../../contracts/items.js';
import { validateTask } from '../../contracts/tasks.mjs';
import { ArtifactError } from '../../contracts/topics.mjs';
import { hash } from '../../platform/hash.js';
import type { Storage } from '../../storage/index.js';
const plans = new WeakMap<Storage, Map<string, { id: string; text: string }[]>>();
export function transcriptChunks(body: string, limit: number, encodedLimit = Infinity): { start: number; end: number; text: string }[] {
  if (!Number.isSafeInteger(limit) || limit < 2 || encodedLimit < 8) throw new Error('Invalid transcript chunk budget');
  const chunks: { start: number; end: number; text: string }[] = [];
  for (let start = 0; start < body.length;) {
    let end = Math.min(start + limit, body.length);
    // The task budget measures serialized JSON, including escaped control chars.
    while (JSON.stringify(body.slice(start, end)).length > encodedLimit) {
      if (end - start <= 1) throw new Error('Transcript chunk budget cannot fit a Unicode character');
      end = start + Math.floor((end - start) / 2);
    }
    if (end < body.length) {
      const boundary = body.lastIndexOf('\n', end - 1);
      if (boundary > start + limit / 2) end = boundary + 1;
      if (/^[\uDC00-\uDFFF]$/.test(body[end]!)) end--;
    }
    if (end <= start) throw new Error('Transcript chunk budget cannot fit a Unicode character');
    chunks.push({ start, end, text: body.slice(start, end) }); start = end;
  }
  return chunks;
}

/** Advance at most one model node, permitting the source scheduler to stay fair. */
export async function transcriptStep(item: Item, store: Storage, agent: AgentRuntimeConfig, execute: boolean, signal?: AbortSignal, retryFailed = false, generator?: TaskGenerator): Promise<{ item: Item; ready: boolean; performed: boolean; deferred?: boolean; failed?: boolean; error?: string }> {
  if (!item.metadata?.transcriptHash) return { item, ready: true, performed: false };
  const snapshot = store.sources.transcriptSize(item.source, item.id);
  if (!snapshot || snapshot.hash !== item.metadata.transcriptHash) throw new Error('Transcript snapshot differs from queued item');
  const prefix = 'Summary evidence: complete transcript, reduced across all segments.\n';
  // Two maximally escaped reduction outputs must fit, so every level shrinks.
  const maxChars = Math.min(1500, agent.maxItemChars - prefix.length, Math.floor((agent.maxInputChars - 512) / 12));
  if (maxChars < 1) throw new Error('Transcript evidence prefix leaves no room within agent.maxItemChars or agent.maxInputChars');
  const chunkLimit = Math.min(12000, Math.floor(agent.maxInputChars / 2));
  const overBudget = () => ({ item, ready: false, performed: false, failed: true, error: `Transcript exceeds agent.maxTranscriptChunks=${agent.maxTranscriptChunks}; full evidence retained. Increase this explicit processing budget and use --retry-failed.` });
  // SQLite length(TEXT) stops at NUL. Byte length gives a safe coarse gate;
  // each Unicode scalar uses at most four UTF-8 bytes. Exact chunking follows.
  if (snapshot.bytes > chunkLimit * agent.maxTranscriptChunks * 4) return overBudget();
  const currentRecipe = hash({
    transcript: snapshot.hash, maxChars, inputLimit: agent.maxInputChars, revision: 2,
    rebuild: store.meta('podcast_rebuild:' + JSON.stringify([item.source, item.id])) ?? '',
    skill: await reportTaskSkill('transcript')
  });
  const recipe = store.meta('transcript_recipe:' + currentRecipe) ?? currentRecipe;
  item = { ...item, metadata: { ...item.metadata, transcriptRecipe: recipe } };
  const retained = plans.get(store) ?? new Map<string, { id: string; text: string }[]>();
  plans.set(store, retained);
  let nodes = retained.get(recipe);
  if (!nodes) {
    const { body } = store.sources.transcriptBody(item.source, item.id) as { body: string };
    nodes = transcriptChunks(body, chunkLimit, agent.maxInputChars - 512).map(chunk => ({ id: `${recipe}:${chunk.start}:${chunk.end}`, text: chunk.text }));
    if (nodes.length > agent.maxTranscriptChunks) return overBudget();
    retained.set(recipe, nodes);
    if (retained.size > 8) retained.delete(retained.keys().next().value!);
  }
  if (nodes.length > agent.maxTranscriptChunks) return overBudget();
  let level = 0;
  while (nodes.length) {
    const next: { id: string; text: string }[] = [];
    for (let i = 0; i < nodes.length;) {
      if (level > 0 && i === nodes.length - 1) { next.push(nodes[i++]!); continue; }
      const parts = [nodes[i++]!];
      if (level > 0) while (i < nodes.length && parts.length < 8 && JSON.stringify({ taskId: 'x'.repeat(64), parts: [...parts, nodes[i]], maxChars }).length <= agent.maxInputChars) parts.push(nodes[i++]!);
      const input = { taskId: hash({ recipe, level, ids: parts.map(p => p.id) }), parts, maxChars };
      const key = await taskKey(agent, 'transcript', input);
      const cached = store.tasks.accepted(key) as { output: string } | undefined;
      let output: { facts: string } | undefined;
      if (cached) {
        try { output = validateTask('transcript', JSON.parse(cached.output), input) as { facts: string }; }
        catch (error) { if (!(error instanceof ArtifactError) && !(error instanceof SyntaxError)) throw error; }
      }
      if (!output) {
        if (!execute) return { item, ready: false, performed: false };
        const task = await fixedTask(store, agent, 'transcript', input, { signal, retryFailed, generator });
        const error = (store.tasks.error(task.key) as { error: string | null }).error;
        return { item, ready: false, performed: task.performed || !!task.output, deferred: task.state === 'deferred', failed: task.state === 'failed', ...(error ? { error } : {}) };
      }
      next.push({ id: key, text: output.facts });
    }
    if (next.length === 1) return { item: { ...item, text: prefix + next[0]!.text }, ready: true, performed: false };
    nodes = next; level++;
  }
  throw new Error('Empty transcript plan');
}
