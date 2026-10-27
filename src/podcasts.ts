import type { AgentRuntimeConfig } from './storage-paths.js';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { array, date, plain, text, type ParseContext } from './channels/parsers.js';
import type { Item } from './types.js';
import { agentIdentity } from './agent.js';
import { mediaForUrl } from './source-content.js';
import { Http } from './http.js';
import { Store } from './store.js';
import { hash, nowIso, safeUrl, errorText } from './util.js';
import { fixedTask, taskKey, type TaskGenerator } from './fixed-tasks.js';
import { validateTask } from './task-contract.mjs';
import { ArtifactError } from './topics-contract.mjs';
import { reportTaskSkill } from './report-skill.js';

const FEED = 'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-podcasts.json';
const transcriptFeeds = new WeakMap<Http, Map<string, string | undefined>>();
const plans = new WeakMap<Store, Map<string, { id: string; text: string }[]>>();
export function parsePodcastFeed(body: string, context: ParseContext, name: string, notes: string[] = []): Item[] {
  if (/<!DOCTYPE/i.test(body) || XMLValidator.validate(body) !== true) throw new Error('Invalid podcast XML');
  const document = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', parseTagValue: false,
    processEntities: { enabled: true, maxTotalExpansions: 250_000, maxExpandedLength: 12_000_000 } }).parse(body);
  if (!document.rss?.channel) throw new Error('Podcast response is not RSS');
  const rows = array(document.rss.channel.item), result: Item[] = [];
  let failures = 0;
  for (const row of rows) {
    try {
      const title = plain(text(row.title ?? row['itunes:title']));
      const enclosure = array(row.enclosure).find((e: any) => String(e?.['@type']).startsWith('audio/')) as any;
      const audio = enclosure?.['@url'];
      const link = array(row.link).map(text).find(Boolean);
      const url = safeUrl(link || audio);
      const guid = text(row.guid) || url;
      if (!title) throw new Error('Episode has no title');
      const publishedAt = date(text(row.pubDate ?? row['dc:date']), context.timezone);
      const transcript = array(row['podcast:transcript']).find((t: any) => ['text/vtt', 'text/plain'].includes(String(t?.['@type']))) as any;
      const media = audio ? mediaForUrl('audio', audio, name + ': ' + title, url) : undefined;
      result.push({ ...context, id: context.stream + ':' + guid, title, url,
        author: plain(text(row['itunes:author'] ?? document.rss.channel['itunes:author'])) || name,
        text: plain(text(row['content:encoded'] ?? row.description ?? row['itunes:summary'])),
        publishedAt: publishedAt ?? context.observedAt, basis: publishedAt ? 'published' : 'observed', metrics: {},
        media: media ? [media] : [], metadata: { podcastName: name, podcastGuid: guid,
          ...(transcript?.['@url'] ? { transcriptUrl: safeUrl(transcript['@url']), transcriptType: String(transcript['@type']) } : {}) } });
    } catch { failures++; }
  }
  if (failures && !result.length) throw new Error('All podcast episodes failed validation');
  if (failures) notes.push(`${failures} malformed podcast episodes skipped.`);
  return result;
}

export function transcriptText(body: string, vtt = false): string {
  if (/<(?:html|!doctype)/i.test(body)) throw new Error('Transcript endpoint returned HTML');
  if (!vtt && !body.trimStart().startsWith('WEBVTT')) return body.normalize('NFKC').replace(/\r\n?/g, '\n').trim();
  if (!body.trimStart().startsWith('WEBVTT')) throw new Error('Invalid WebVTT transcript');
  const parts: string[] = [];
  for (const block of body.replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
    const lines = block.split('\n'), timing = lines.findIndex(line => line.includes('-->'));
    if (timing < 0) continue;
    const spoken = plain(lines.slice(timing + 1).join(' ').replace(/<v\s+([^>]+)>/g, '$1: '));
    if (spoken && parts.at(-1) !== spoken) parts.push(spoken);
  }
  if (!parts.length) throw new Error('Empty WebVTT transcript');
  return parts.join('\n\n').normalize('NFKC');
}

export async function enrichPodcast(item: Item, store: Store, http: Http, refresh = false): Promise<Item> {
  const existing = store.statement('SELECT body,hash,url,updated_at FROM podcast_transcripts WHERE source=? AND id=?').get(item.source, item.id) as { body: string; hash: string; url: string; updated_at: string } | undefined;
  let snapshot = existing, failure: string | undefined;
  if (refresh || !existing || Date.now() - Date.parse(existing.updated_at) > 6 * 3600_000) {
    const start = http.raw.length;
    let body: string | undefined, url: string | undefined;
    try {
      if (typeof item.metadata?.transcriptUrl === 'string') {
        try {
          const raw = await http.page(item.metadata.transcriptUrl, 1500, true);
          body = transcriptText(raw.body, item.metadata.transcriptType === 'text/vtt'); url = item.metadata.transcriptUrl;
        } catch (e) { http.signal?.throwIfAborted(); failure = errorText(e); }
      }
      if (!body) {
        const raw = await http.shared(FEED);
        let index = transcriptFeeds.get(http);
        if (!index) {
          const feed = JSON.parse(raw.body);
          if (!Array.isArray(feed.podcasts)) throw new Error('Invalid follow-builders podcast feed');
          index = new Map();
          for (const episode of feed.podcasts) {
            if (typeof episode?.name !== 'string' || typeof episode?.guid !== 'string') continue;
            const key = JSON.stringify([episode.name, episode.guid]);
            if (!index.has(key)) index.set(key, typeof episode.transcript === 'string' ? episode.transcript : undefined);
          }
          transcriptFeeds.set(http, index);
        }
        const transcript = index.get(JSON.stringify([item.metadata?.podcastName, item.metadata?.podcastGuid]));
        if (transcript?.trim()) { body = transcriptText(transcript); url = FEED; }
      }
      if (body && url) {
        snapshot = { body, hash: hash(body), url, updated_at: nowIso() };
        store.assertLease();
        store.statement('INSERT OR REPLACE INTO podcast_transcripts VALUES (?,?,?,?,?,?)').run(item.source, item.id, body, snapshot.hash, url, snapshot.updated_at);
      }
    } catch (e) { http.signal?.throwIfAborted(); failure = errorText(e); }
    finally { for (const raw of http.raw.splice(start)) store.saveRaw(item.source, item.stream, new URL(raw.url).pathname === '/robots.txt' ? 'robots' : 'podcast-transcript', raw); }
  }
  return { ...item, metadata: { ...item.metadata, summaryBasis: snapshot ? 'transcript' : 'shownotes',
    ...(snapshot ? { transcriptHash: snapshot.hash } : {}), ...(failure ? { transcriptError: failure } : {}) } };
}

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
export async function transcriptStep(item: Item, store: Store, agent: AgentRuntimeConfig, execute: boolean, signal?: AbortSignal, retryFailed = false, generator?: TaskGenerator): Promise<{ item: Item; ready: boolean; performed: boolean; deferred?: boolean; failed?: boolean; error?: string }> {
  if (!item.metadata?.transcriptHash) return { item, ready: true, performed: false };
  const snapshot = store.statement('SELECT hash,length(body) chars FROM podcast_transcripts WHERE source=? AND id=?').get(item.source, item.id) as { chars: number; hash: string } | undefined;
  if (!snapshot || snapshot.hash !== item.metadata.transcriptHash) throw new Error('Transcript snapshot differs from queued item');
  const prefix = 'Summary evidence: complete transcript, reduced across all segments.\n';
  // Two maximally escaped reduction outputs must fit, so every level shrinks.
  const maxChars = Math.min(1500, agent.maxItemChars - prefix.length, Math.floor((agent.maxInputChars - 512) / 12));
  if (maxChars < 1) throw new Error('Transcript evidence prefix leaves no room within agent.maxItemChars or agent.maxInputChars');
  const chunkLimit = Math.min(12000, Math.floor(agent.maxInputChars / 2));
  const overBudget = () => ({ item, ready: false, performed: false, failed: true, error: `Transcript exceeds agent.maxTranscriptChunks=${agent.maxTranscriptChunks}; full evidence retained. Increase this explicit processing budget and use --retry-failed.` });
  if (snapshot.chars > chunkLimit * agent.maxTranscriptChunks) return overBudget();
  const recipe = hash({ transcript: snapshot.hash, maxChars, inputLimit: agent.maxInputChars, revision: 2,
    ...agentIdentity(agent), rebuild: store.meta('podcast_rebuild:' + JSON.stringify([item.source, item.id])) ?? '',
    skill: await reportTaskSkill('transcript') });
  item = { ...item, metadata: { ...item.metadata, transcriptRecipe: recipe } };
  const retained = plans.get(store) ?? new Map<string, { id: string; text: string }[]>();
  plans.set(store, retained);
  let nodes = retained.get(recipe);
  if (!nodes) {
    const { body } = store.statement('SELECT body FROM podcast_transcripts WHERE source=? AND id=?').get(item.source, item.id) as { body: string };
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
      const cached = store.statement("SELECT output FROM feed_tasks WHERE key=? AND state='accepted'").get(key) as { output: string } | undefined;
      let output: { facts: string } | undefined;
      if (cached) {
        try { output = validateTask('transcript', JSON.parse(cached.output), input) as { facts: string }; }
        catch (error) { if (!(error instanceof ArtifactError) && !(error instanceof SyntaxError)) throw error; }
      }
      if (!output) {
        if (!execute) return { item, ready: false, performed: false };
        const task = await fixedTask(store, agent, 'transcript', input, { signal, retryFailed, generator });
        const error = (store.statement('SELECT error FROM feed_tasks WHERE key=?').get(task.key) as { error: string | null }).error;
        return { item, ready: false, performed: task.performed || !!task.output, deferred: task.state === 'deferred', failed: task.state === 'failed', ...(error ? { error } : {}) };
      }
      next.push({ id: key, text: output.facts });
    }
    if (next.length === 1) return { item: { ...item, text: prefix + next[0]!.text }, ready: true, performed: false };
    nodes = next; level++;
  }
  throw new Error('Empty transcript plan');
}
