import { DateTime } from 'luxon';
import type { Config, Source } from './config.js';
import { storagePaths } from './storage-paths.js';
import { adapters, type Adapter } from './channels/index.js';
import { Http, HttpError } from './http.js';
import { Store } from './store.js';
import { errorText, nowIso, sleep, iso } from './util.js';
import type { Coverage } from './types.js';
import { importArchives } from './archives.js';
import { reconcileSelection } from './selection.js';

export type CollectionResult = { source: string; status: 'disabled'; reason: string } | { source: string; stream: string } & ({ channel: string; fetchedItems?: number; newItems?: number } & Coverage | { status: 'unavailable' | 'deferred'; reason?: string });
export async function collect(config: Config, store: Store, selected?: string, due = false, registry = adapters, sinceOverride?: string, signal?: AbortSignal): Promise<CollectionResult[]> {
  signal?.throwIfAborted();
  if (sinceOverride && !DateTime.fromISO(sinceOverride).isValid) throw new Error('Invalid --since ISO date or timestamp');
  const results: CollectionResult[] = [];
  const sources = config.sources.filter(source => source.enabled && (!selected || source.id === selected));
  if (selected && !sources.length) throw new Error(`Unknown or disabled source: ${selected}`);
  for (const source of config.sources.filter(source => !source.enabled && !selected)) results.push({ source: source.id, status: 'disabled', reason: 'Disabled in source configuration' });
  await importArchives(config, store, signal);
  const http = new Http(store, undefined, signal);
  for (const source of sources) {
    for (const stream of source.streams) {
      signal?.throwIfAborted();
      const channels = stream.channels.filter(channel => channel.enabled);
      const states = channels.flatMap(channel => { const state = store.channel(source.id, stream.id, channel.id); return state ? [state] : []; });
      const latestAttempt = states.reduce((latest, state) => state.last_attempt > latest ? state.last_attempt : latest, '');
      // A successful round sets stream cadence. After a failed round, each
      // enabled channel owns its own retry time; a fallback cannot delay a primary.
      if (due && states.some(state => state.last_attempt === latestAttempt && (state.status === 'complete' || state.status === 'partial') && Date.parse(state.next_attempt) > Date.now())) {
        results.push({ source: source.id, stream: stream.id, status: 'deferred', reason: 'Collection interval has not elapsed' }); continue;
      }
      const now = nowIso(); let accepted = false, attempted = false, coolingDown = false;
      for (const channel of channels) {
        const state = store.channel(source.id, stream.id, channel.id);
        if (state && Date.parse(state.next_attempt) > Date.now() && due) { coolingDown = true; continue; }
        attempted = true;
        http.raw.length = 0;
        const since = sinceOverride ? iso(DateTime.fromISO(sinceOverride, { zone: source.timezone }).toUTC(), '--since') : iso(DateTime.fromISO(state?.last_success ?? now).minus({ days: state?.last_success ? 1 : config.collection.backfillDays }).toUTC(), 'collection checkpoint');
        try {
          const result = await (registry[channel.kind] as Adapter)({ source, stream, channel, store, http, now, since, restartRange: !!sinceOverride, twitterEnvironment: storagePaths(config.storage).twitterEnvironment });
          signal?.throwIfAborted();
          store.assertLease();
          const { newItems } = store.saveCollection(source.id, stream.id, channel.id, result, next(source, now), now);
          results.push({ source: source.id, stream: stream.id, channel: channel.id, fetchedItems: result.items.length, newItems, ...result.coverage });
          if (result.coverage.status === 'complete' || result.coverage.status === 'partial') { accepted = true; break; }
        } catch (error) {
          signal?.throwIfAborted();
          store.assertLease();
          const retryAt = error instanceof HttpError && error.retryAt ? error.retryAt : next(source, now);
          const coverage = { status: 'failed' as const, to: now, notes: [errorText(error)] };
          store.saveCollection(source.id, stream.id, channel.id, { items: [], raw: http.raw, coverage }, retryAt, now);
          results.push({ source: source.id, stream: stream.id, channel: channel.id, ...coverage });
        }
      }
      if (!accepted) results.push({ source: source.id, stream: stream.id, status: !attempted && coolingDown ? 'deferred' : 'unavailable', reason: !attempted && coolingDown ? 'Channels are cooling down' : 'No enabled channel returned usable coverage' });
      // arXiv enforces one connection and at least three seconds between API requests, including category changes.
      if (source.id === 'arxiv') await sleep(3100, signal);
    }
  }
  reconcileSelection(config, store, { source: selected, signal });
  return results;
}
function next(source: Source, now: string): string { return iso(DateTime.fromISO(now).plus({ hours: source.intervalHours }), 'next collection time'); }
