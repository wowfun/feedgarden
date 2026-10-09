import { DateTime } from 'luxon';
import type { Config, Source } from './config.js';
import { adapters, type Adapter } from './channels/index.js';
import { Http, HttpError } from './http.js';
import { Store } from './store.js';
import { errorText, nowIso, sleep } from './util.js';
import type { Coverage } from './types.js';

export type CollectionResult = { source: string; stream: string } & ({ channel: string; items?: number } & Coverage | { status: 'unavailable' });
export async function collect(config: Config, store: Store, selected?: string, due = false, registry = adapters, sinceOverride?: string): Promise<CollectionResult[]> {
  if (sinceOverride && !DateTime.fromISO(sinceOverride).isValid) throw new Error('Invalid --since ISO date or timestamp');
  const results: CollectionResult[] = [];
  const sources = config.sources.filter(source => source.enabled && (!selected || source.id === selected));
  if (selected && !sources.length) throw new Error(`Unknown or disabled source: ${selected}`);
  for (const source of sources) {
    const http = new Http(store);
    for (const stream of source.streams) {
      const last = store.states().filter(state => state.source === source.id && state.stream === stream.id).sort((a, b) => b.last_attempt.localeCompare(a.last_attempt))[0];
      if (due && last && Date.parse(last.next_attempt) > Date.now()) continue;
      const now = nowIso(); let accepted = false;
      for (const channel of stream.channels.filter(channel => channel.enabled)) {
        const state = store.channel(source.id, stream.id, channel.id);
        if (state?.status === 'failed' && Date.parse(state.next_attempt) > Date.now() && due) continue;
        http.raw.length = 0;
        const since = sinceOverride ? DateTime.fromISO(sinceOverride, { zone: source.timezone }).toUTC().toISO()! : DateTime.fromISO(state?.last_success ?? now).minus({ days: state?.last_success ? 1 : config.collection.backfillDays }).toUTC().toISO()!;
        try {
          const result = await (registry[channel.kind] as Adapter)({ source, stream, channel, store, http, now, since, restartRange: !!sinceOverride });
          store.saveCollection(source.id, stream.id, channel.id, result, next(source, now), now);
          results.push({ source: source.id, stream: stream.id, channel: channel.id, items: result.items.length, ...result.coverage });
          if (result.coverage.status === 'complete' || result.coverage.status === 'partial') { accepted = true; break; }
        } catch (error) {
          const retryAt = error instanceof HttpError && error.retryAt ? error.retryAt : next(source, now);
          const coverage = { status: 'failed' as const, to: now, notes: [errorText(error)] };
          store.saveCollection(source.id, stream.id, channel.id, { items: [], raw: http.raw, coverage }, retryAt, now);
          results.push({ source: source.id, stream: stream.id, channel: channel.id, ...coverage });
        }
      }
      if (!accepted) results.push({ source: source.id, stream: stream.id, status: 'unavailable' });
      // arXiv enforces one connection and at least three seconds between API requests, including category changes.
      if (source.id === 'arxiv') await sleep(3100);
    }
  }
  return results;
}
function next(source: Source, now: string): string { return DateTime.fromISO(now).plus({ hours: source.intervalHours }).toISO()!; }
