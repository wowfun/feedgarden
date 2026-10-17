import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import type { Config } from './config.js';
import { Store } from './store.js';
import { Http, HttpError } from './http.js';
import { importArchives } from './archives.js';
import { candidatesFor, historicalWindow, reconcileSelection, selectionRange, type SelectionReport } from './selection.js';
import { parseFeed, xml, array } from './channels/parsers.js';
import { hnScore } from './scoring.js';
import { mapLimit, nowIso, errorText } from './util.js';
import type { RawResponse, RankingObservation, Metrics } from './types.js';

export async function rankItems(config: Config, store: Store, options: { source?: string; history?: boolean; signal?: AbortSignal; at?: string } = {}, http = new Http(store, undefined, options.signal)): Promise<SelectionReport[]> {
  options.signal?.throwIfAborted();
  const sources = config.sources.filter(source => source.enabled && source.selection && (!options.source || source.id === options.source));
  if (options.source && !sources.length) throw new Error('Unknown, disabled or unranked source: ' + options.source);
  await importArchives(config, store, options.signal);
  const at = options.at ?? nowIso(), blocked = new Set<string>(), errors = new Map<string, string[]>();
  async function response(url: string, spacing: number, transport: 'fetch' | 'curl', ttl: number): Promise<RawResponse> {
    const cached = store.cache(url);
    if (cached && cached.status === 200 && Date.parse(at) >= Date.parse(cached.fetchedAt) && Date.parse(at) - Date.parse(cached.fetchedAt) < ttl) return cached;
    const key = 'ranking_retry:' + new URL(url).origin, retry = store.meta(key);
    if (retry) {
      const state = JSON.parse(retry) as { at: string; message: string; status: number };
      if (Date.parse(state.at) > Date.parse(at)) throw new HttpError(state.message, state.status, state.at);
    }
    try { return await http.get(url, spacing, transport); }
    catch (error) {
      options.signal?.throwIfAborted(); store.assertLease();
      if (error instanceof HttpError && (error.retryAt || error.status === 403)) {
        const retryAt = error.retryAt ?? new Date(Date.parse(at) + ttl).toISOString();
        store.setMeta(key, JSON.stringify({ at: retryAt, message: errorText(error), status: error.status }));
      }
      throw error;
    }
  }
  function block(key: string, error: unknown): void { blocked.add(key); const notes = errors.get(key) ?? []; notes.push(errorText(error)); errors.set(key, notes); }
  for (const source of sources) {
    const range = selectionRange(source, at);
    const candidates = candidatesFor(store, source, options.history ? undefined : range).filter(candidate => options.history || candidate.day >= range.firstDay && candidate.day <= range.lastDay);
    if (source.selection!.method === 'hn-engagement') {
      // Network requests remain outside SQLite transactions. Commit each bounded
      // batch's evidence, score and native metrics under one lease check.
      for (let offset = 0; offset < candidates.length; offset += 8) {
        const batch = candidates.slice(offset, offset + 8);
        const results = await mapLimit(batch, 8, async candidate => {
          options.signal?.throwIfAborted();
          let raw: RawResponse | undefined;
          try {
            const { item } = candidate;
            if (!/^\d+$/.test(item.id)) throw new Error('Invalid HN native ID');
            raw = await response('https://hacker-news.firebaseio.com/v0/item/' + item.id + '.json', 0, 'fetch', 3600_000);
            const story = JSON.parse(raw.body);
            if (story && String(story.id) === item.id && (story.dead || story.deleted)) return { candidate, raw, inactive: true };
            if (!story || String(story.id) !== item.id || story.type !== 'story') throw new Error('HN story unavailable: ' + item.id);
            const score = hnScore(story.score, story.descendants);
            if (score === undefined) throw new Error('HN interaction metrics unavailable: ' + item.id);
            const ranking: RankingObservation = { method: 'hn-engagement', score, observedAt: raw.fetchedAt };
            const metrics: Metrics = { score: story.score, comments: story.descendants };
            return { candidate, raw, ranking, metrics };
          } catch (error) { options.signal?.throwIfAborted(); return { candidate, raw, error }; }
        });
        try {
          store.db.transaction(() => {
            store.assertLease(); options.signal?.throwIfAborted();
            for (const result of results) {
              const { item } = result.candidate;
              if (result.raw) store.saveRaw(source.id, item.stream, 'rank-api', result.raw);
              if ('error' in result) block(source.id + '/' + result.candidate.day, result.error);
              else if (result.inactive) store.markRankingInactive(source.id, item.id, result.raw.fetchedAt);
              else if (result.ranking) store.updateRankingItem(source.id, item.id, result.ranking, result.metrics!);
            }
          })();
        } catch (error) {
          options.signal?.throwIfAborted(); store.assertLease();
          for (const result of results) block(source.id + '/' + result.candidate.day, error);
        }
      }
    } else {
      const requests = new Map<string, { stream: string; window: 'week' | 'month' | 'year' | 'all'; days: Set<string> }>();
      for (const candidate of candidates) {
        const window = options.history ? historicalWindow(candidate.day, at, source.timezone) : 'week';
        const key = candidate.item.stream + '/' + window, request = requests.get(key) ?? { stream: candidate.item.stream, window, days: new Set<string>() };
        request.days.add(candidate.day); requests.set(key, request);
      }
      for (const request of requests.values()) {
        options.signal?.throwIfAborted();
        const url = `https://www.reddit.com/r/${encodeURIComponent(request.stream)}/top.rss?t=${request.window}&limit=100`;
        const before = http.raw.length;
        const matching = new Map(candidates.filter(candidate => candidate.item.stream.toLowerCase() === request.stream.toLowerCase() && (options.history ? historicalWindow(candidate.day, at, source.timezone) : 'week') === request.window).map(candidate => [candidate.item.id, candidate]));
        try {
          const channel = source.streams.find(stream => stream.id.toLowerCase() === request.stream.toLowerCase())?.channels.find(channel => channel.kind === 'feed' && channel.enabled);
          const raw = await response(url, 60000, channel?.transport ?? 'curl', source.intervalHours * 3600_000);
          store.assertLease(); options.signal?.throwIfAborted();
          store.saveRaw(source.id, request.stream, 'rank-rss', raw);
          const notes: string[] = [];
          const items = parseFeed(raw.body, { source: source.id, stream: request.stream, channel: 'rank-rss', observedAt: raw.fetchedAt, timezone: source.timezone }, notes, request.window);
          const document = xml(raw.body), size = array(document.feed?.entry ?? document.rss?.channel?.item ?? document.RDF?.item).length;
          store.assertLease(); options.signal?.throwIfAborted();
          store.db.transaction(() => {
            store.saveRankSnapshot(source.id, request.stream, request.window, raw.fetchedAt);
            for (const row of items) if (row.ranking && matching.has(row.id)) store.updateRankingItem(source.id, row.id, row.ranking, { rank: row.ranking.rank });
          })();
          if (size === 0) for (const day of request.days) { const key = source.id + '/' + day; const messages = errors.get(key) ?? []; messages.push(`The ${request.stream}/${request.window} RSS ranking is empty; unmatched candidates have unknown rank.`); errors.set(key, messages); }
        } catch (error) {
          options.signal?.throwIfAborted();
          store.assertLease();
          for (const raw of http.raw.slice(before)) store.saveRaw(source.id, request.stream, 'rank-rss', raw);
          for (const day of request.days) block(source.id + '/' + day, error);
        }
      }
    }
  }
  const reports = reconcileSelection(config, store, { source: options.source, history: options.history, at, blocked, signal: options.signal });
  for (const report of reports) report.notes.push(...errors.get(report.source + '/' + report.day) ?? []);
  return reports;
}

// Preview uses an isolated database, including HTTP caches and imported archive
// copies. It never initializes the real database or writes the content tree.
export async function previewRank(config: Config, options: { source?: string; history?: boolean; signal?: AbortSignal } = {}): Promise<SelectionReport[]> {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-rank-preview-'));
  let store: Store | undefined;
  try {
    const database = join(root, 'data.sqlite');
    if (existsSync(config.storage.database)) {
      const original = new Database(config.storage.database, { readonly: true, fileMustExist: true });
      try { await original.backup(database); } finally { original.close(); }
    }
    store = new Store(database);
    return await rankItems({ ...config, storage: { database, directory: root } }, store, options);
  } finally {
    store?.close();
    if (dirname(resolve(root)) !== resolve(tmpdir())) throw new Error('Invalid temporary preview directory');
    await rm(root, { recursive: true, force: true });
  }
}
