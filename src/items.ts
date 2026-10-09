import { readFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Config, Source } from './config.js';
import { generateBatch, type AgentResult, type SummaryInput } from './agent.js';
import { validateArtifact, validateRegistry, ArtifactError } from './topics-contract.mjs';
import { applyTopics, loadTopics, type Registry } from './topics.js';
import { Store, QuotaDeferred } from './store.js';
import type { Item, Translation } from './types.js';
import { atomicWrite, errorText, hash, nowIso, safeUrl } from './util.js';

export interface ItemCopy { source: string; id: string; topics: string[]; en: Translation; 'zh-CN': Translation }
export interface AcceptedItem { item: Item; copy: ItemCopy; firstSeen: string; date: string; dateBasis: 'published' | 'observed'; updated: string }
interface Job { source: string; id: string; cache_key: string; data: string; state: string; attempts: number; next_at: string; error: string | null }
interface FixedJob { source: string; id: string; key: string; item: Item; firstSeen: string }
interface Batch { id: string; input: string; jobs: string; workspace: string; state: string }
export type Generator = (agent: Config['agent'], input: SummaryInput, repair?: string, workspace?: string) => Promise<AgentResult>;
export function summaryItem(item: Item, maxChars: number): SummaryInput['items'][number] {
  const normalize = (value: string) => value.normalize('NFKC').replace(/\s+/g, ' ').trim();
  return { source: item.source, id: item.id, title: normalize(item.title), text: normalize(item.text).slice(0, maxChars), ...(item.author ? { author: normalize(item.author) } : {}) };
}
export const itemPath = (source: string, id: string): string => 'items/' + hash([source, id]) + '.md';
export function eligible(item: Item, firstSeen: string, cutoff: string, source: Source): boolean {
  if (item.source === 'x' && item.kind === 'repost') return false;
  if (item.source === 'arxiv' && source.includeKeywords.length && !source.includeKeywords.some(word => (item.title + ' ' + item.text).toLowerCase().includes(word.toLowerCase()))) return false;
  return (item.basis === 'observed' ? firstSeen : item.publishedAt) >= cutoff;
}
export function acceptedItems(store: Store): AcceptedItem[] {
  return (store.db.prepare('SELECT accepted FROM feed_summaries ORDER BY source,id').all() as { accepted: string }[]).map(row => JSON.parse(row.accepted));
}
export async function summarize(config: Config, store: Store, options: { source?: string; rebuild?: boolean; retryFailed?: boolean } = {}, generator: Generator = generateBatch, at = nowIso()): Promise<{ generated: number; pending: number; failed: number; deferred: boolean }> {
  const sources = config.sources.filter(source => source.enabled && (!options.source || source.id === options.source));
  if (options.source && !sources.length) throw new Error('Unknown or disabled source: ' + options.source);
  const skillHash = hash(await readFile('.agents/skills/feedgarden-report/SKILL.md', 'utf8'));
  const cutoff = store.meta('cutoff')!;
  let registry = await loadTopics(config.feed.topics), generated = 0, deferred = false, runtimeFailures = 0;
  // Recover a saved artifact before spending another ACP attempt.
  async function accept(batch: Batch, result: unknown): Promise<void> {
    const input = JSON.parse(batch.input) as SummaryInput;
    const { output, registry: validatedRegistry } = validateArtifact(result, input);
    const previous = await loadTopics(config.feed.topics);
    if (hash(previous) !== hash(input.topics) && hash(previous) !== hash(validatedRegistry)) throw new Error('Topic registry changed while a task was running');
    const next = validatedRegistry as Registry;
    await applyTopics(config.feed.topics, next, hash(previous));
    registry = next;
    const jobs = JSON.parse(batch.jobs) as FixedJob[];
    store.db.transaction(() => {
      jobs.forEach((job, i) => {
        const copy = output.items[i]! as ItemCopy;
        const accepted: AcceptedItem = { item: job.item, copy, firstSeen: job.firstSeen, date: job.item.basis === 'observed' ? job.firstSeen : job.item.publishedAt, dateBasis: job.item.basis === 'observed' ? 'observed' : 'published', updated: at };
        store.db.prepare('INSERT OR REPLACE INTO feed_summaries VALUES (?,?,?,?,?)').run(job.source, job.id, job.key, JSON.stringify(accepted), at);
        store.db.prepare('INSERT OR REPLACE INTO feed_cache VALUES (?,?)').run(job.key, JSON.stringify(copy));
        store.db.prepare("UPDATE feed_jobs SET state='ready',error=NULL WHERE source=? AND id=? AND cache_key=?").run(job.source, job.id, job.key);
      });
      store.db.prepare("UPDATE feed_batches SET state='accepted',error=NULL WHERE id=?").run(batch.id);
    })();
    generated += jobs.length;
  }
  const unfinished = store.db.prepare("SELECT * FROM feed_batches WHERE state IN ('prepared','running') ORDER BY created_at,id").all() as Batch[];
  for (const batch of unfinished) {
    if (!(JSON.parse(batch.jobs) as FixedJob[]).every(job => sources.some(source => source.id === job.source))) continue;
    let artifact: unknown;
    try { artifact = JSON.parse(await readFile(join(batch.workspace, 'result.json'), 'utf8')); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error; }
    if (artifact) {
      try { await accept(batch, artifact); }
      catch (error) { if (!(error instanceof ArtifactError)) throw error; store.db.prepare("UPDATE feed_batches SET state='interrupted',error=? WHERE id=?").run(errorText(error), batch.id); }
    }
    else store.db.prepare("UPDATE feed_batches SET state='interrupted',error='Interrupted without valid artifact' WHERE id=?").run(batch.id);
  }
  store.db.prepare("UPDATE feed_jobs SET state='failed',error=COALESCE(error,'Attempt limit reached after interruption') WHERE state='pending' AND attempts>=5").run();
  for (const source of sources) {
    const agent = { ...config.agent, ...source.agent };
    const rows = store.db.prepare('SELECT i.*,e.id AS excluded FROM items i LEFT JOIN feed_excluded e ON e.source=i.source AND e.id=i.id WHERE i.source=? ORDER BY i.first_seen,i.id').all(source.id) as { id: string; data: string; first_seen: string; excluded: string | null }[];
    for (const row of rows) {
      const item = JSON.parse(row.data) as Item;
      if (row.excluded !== null || !eligible(item, row.first_seen, cutoff, source)) continue;
      safeUrl(item.url);
      const key = hash({ ...summaryItem(item, agent.maxItemChars), model: agent.model, effort: agent.effort, skillHash, contractVersion: 2 });
      const previous = store.db.prepare('SELECT * FROM feed_jobs WHERE source=? AND id=?').get(source.id, row.id) as Job | undefined;
      if (!previous || previous.cache_key !== key || options.rebuild) store.db.prepare("INSERT OR REPLACE INTO feed_jobs VALUES (?,?,?,?, 'pending',0,'',NULL)").run(source.id, row.id, key, JSON.stringify({ item, firstSeen: row.first_seen }));
      else {
        store.db.prepare('UPDATE feed_jobs SET data=? WHERE source=? AND id=?').run(JSON.stringify({ item, firstSeen: row.first_seen }), source.id, row.id);
        if (options.retryFailed && previous.state === 'failed') store.db.prepare("UPDATE feed_jobs SET state='pending',attempts=0,next_at='',error=NULL WHERE source=? AND id=?").run(source.id, row.id);
        if (previous.state === 'ready') {
          const old = store.db.prepare('SELECT accepted FROM feed_summaries WHERE source=? AND id=?').get(source.id, row.id) as { accepted: string };
          const accepted = JSON.parse(old.accepted) as AcceptedItem;
          accepted.item = item; // Metrics/URL/date changes update presentation without another summary.
          accepted.dateBasis = item.basis === 'observed' ? 'observed' : 'published';
          accepted.date = accepted.dateBasis === 'observed' ? accepted.firstSeen : item.publishedAt;
          store.db.prepare('UPDATE feed_summaries SET accepted=? WHERE source=? AND id=?').run(JSON.stringify(accepted), source.id, row.id);
        }
      }
    }
  }
  let cursor = store.meta('round_robin') ?? '';
  while (sources.length) {
    const start = (sources.findIndex(source => source.id === cursor) + 1) % sources.length;
    let chosen: Source | undefined, jobs: Job[] = [];
    for (let offset = 0; offset < sources.length; offset++) {
      const source = sources[(start + offset) % sources.length]!;
      const candidates = store.db.prepare("SELECT * FROM feed_jobs WHERE source=? AND state='pending' AND next_at<=? AND attempts<5 ORDER BY json_extract(data,'$.firstSeen'),id LIMIT ?").all(source.id, at, config.agent.maxBatchItems) as Job[];
      if (candidates.length) { chosen = source; jobs = candidates; break; }
    }
    if (!chosen) break;
    cursor = chosen.id; store.setMeta('round_robin', cursor);
    const agent = { ...config.agent, ...chosen.agent };
    const fixed: FixedJob[] = [], input: SummaryInput = { contractVersion: 2, topics: registry, items: [] };
    for (const job of jobs) {
      const data = JSON.parse(job.data) as { item: Item; firstSeen: string };
      input.items.push(summaryItem(data.item, agent.maxItemChars));
      if (JSON.stringify(input).length > agent.maxInputChars) { input.items.pop(); break; }
      fixed.push({ source: job.source, id: job.id, key: job.cache_key, ...data });
    }
    if (!fixed.length) throw new Error('Topic registry and one item exceed the complete agent input budget');
    const id = randomUUID(), workspace = resolve(agent.runtimeDirectory, 'task-' + id);
    const batch: Batch = { id, input: JSON.stringify(input), jobs: JSON.stringify(fixed), workspace, state: 'prepared' };
    await mkdir(workspace, { recursive: true, mode: 0o700 });
    await atomicWrite(join(workspace, 'input.json'), batch.input);
    store.db.prepare('INSERT INTO feed_batches VALUES (?,?,?,?,?,?,NULL)').run(id, batch.input, batch.jobs, workspace, 'prepared', at);
    if (!options.rebuild) {
      const cached = fixed.map(job => (store.db.prepare('SELECT copy FROM feed_cache WHERE key=?').get(job.key) as { copy: string } | undefined)?.copy);
      if (cached.every(Boolean)) {
        await accept(batch, { contractVersion: 2, items: cached.map(copy => JSON.parse(copy!)), newTopics: [] });
        continue;
      }
    }
    let repair: string | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (fixed.some(job => (store.db.prepare('SELECT attempts FROM feed_jobs WHERE source=? AND id=?').get(job.source, job.id) as { attempts: number }).attempts >= 5)) break;
      let call: number;
      try { call = store.startCall(id, agent.model, agent.maxDailyCalls); }
      catch (error) { if (error instanceof QuotaDeferred) { deferred = true; break; } throw error; }
      store.db.transaction(() => {
        for (const job of fixed) store.db.prepare('UPDATE feed_jobs SET attempts=attempts+1 WHERE source=? AND id=?').run(job.source, job.id);
        store.db.prepare("UPDATE feed_batches SET state='running' WHERE id=?").run(id);
      })();
      let persisting = false;
      try {
        const result = await generator(agent, input, repair, workspace);
        validateArtifact(result.output, input);
        persisting = true;
        await atomicWrite(join(workspace, 'result.json'), JSON.stringify(result.output));
        await atomicWrite(join(workspace, 'audit.json'), JSON.stringify({ inputHash: hash(input), model: agent.model, skillHash, ...result }, null, 2));
        await accept(batch, result.output);
        store.finishCall(call, 'succeeded', result.usage); runtimeFailures = 0; repair = undefined; break;
      } catch (error) {
        repair = errorText(error); store.finishCall(call, 'failed', { error: repair });
        if (persisting || repair.includes('MANUAL_ACTION:')) throw error;
        const artifactFailure = error instanceof ArtifactError;
        runtimeFailures = artifactFailure ? 0 : runtimeFailures + 1;
        if (!artifactFailure || attempt === 1) break;
      }
    }
    if (deferred) { store.db.prepare("UPDATE feed_batches SET state='deferred' WHERE id=?").run(id); break; }
    if (repair) {
      store.db.transaction(() => {
        for (const job of fixed) {
          const row = store.db.prepare('SELECT attempts FROM feed_jobs WHERE source=? AND id=?').get(job.source, job.id) as { attempts: number };
          const exhausted = row.attempts >= 5;
          const next = new Date(Date.parse(at) + Math.min(6 * 3600_000, 900_000 * 2 ** (row.attempts - 1))).toISOString();
          store.db.prepare('UPDATE feed_jobs SET state=?,next_at=?,error=? WHERE source=? AND id=?').run(exhausted ? 'failed' : 'pending', next, repair, job.source, job.id);
        }
        store.db.prepare("UPDATE feed_batches SET state='failed',error=? WHERE id=?").run(repair, id);
      })();
    }
    if (runtimeFailures >= 3) throw new Error('Three consecutive ACP runtime/transport failures; stopping this run');
  }
  const states = (sources.length ? store.db.prepare("SELECT state,count(*) count FROM feed_jobs WHERE state!='ready' AND source IN (" + sources.map(() => '?').join(',') + ") GROUP BY state").all(...sources.map(source => source.id)) : []) as { state: string; count: number }[];
  return { generated, pending: states.find(row => row.state === 'pending')?.count ?? 0, failed: states.find(row => row.state === 'failed')?.count ?? 0, deferred };
}
