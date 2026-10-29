import { DateTime } from 'luxon';
import type { Source } from '../contracts/configuration.js';
import type { Coverage } from '../contracts/items.js';
import { iso } from '../contracts/time.js';
import type { InstanceContext } from '../instance/index.js';
import { errorText } from '../platform/errors.js';
import { Http, sourceRetryAt } from '../platform/http/client.js';
import { nowIso, sleep } from '../platform/time.js';
import { type Storage } from '../storage/index.js';
import { adapters, type Adapter } from './channels/index.js';

export type CollectionResult =
  | { source: string; status: 'disabled'; reason: string }
  | ({ source: string; stream: string } & (
    | ({
      channel: string;
      fetchedItems?: number;
      newItems?: number;
      initialSnapshot?: boolean;
      lateOutsideWindow?: number;
    } & Coverage)
    | { status: 'unavailable' | 'deferred' | 'skipped'; reason?: string; dueAt?: string; retryAt?: string }
  ));
export async function collectSources(
  config: InstanceContext,
  store: Storage,
  selected?: string,
  due = false,
  registry = adapters,
  sinceOverride?: string,
  signal?: AbortSignal,
): Promise<CollectionResult[]> {
  signal?.throwIfAborted();
  if (sinceOverride && !DateTime.fromISO(sinceOverride).isValid)
    throw new Error('Invalid --since ISO date or timestamp');
  const results: CollectionResult[] = [];
  const sources = config.sources.filter((source) => source.enabled && (!selected || source.id === selected));
  if (selected && !sources.length) throw new Error(`Unknown or disabled source: ${selected}`);
  for (const source of config.sources.filter((source) => !source.enabled && !selected))
    results.push({ source: source.id, status: 'disabled', reason: 'Disabled in source configuration' });
  const http = new Http(store, undefined, signal);
  const publicGet = http.get.bind(http);
  http.get = (url, spacing, transport) => publicGet(url, spacing, transport, true);
  for (const source of sources) {
    for (const stream of source.streams.filter((stream) => stream.enabled)) {
      signal?.throwIfAborted();
      const channels = stream.routes.filter((channel) => channel.enabled);
      const states = channels.flatMap((channel) => {
        const state = store.channel(source.id, stream.id, channel.id);
        return state ? [state] : [];
      });
      const latestAttempt = states.reduce(
        (latest, state) => (state.last_attempt > latest ? state.last_attempt : latest),
        '',
      );
      // A successful round sets stream cadence. After a failed round, each
      // enabled channel owns its own retry time; a fallback cannot delay a primary.
      if (
        due &&
        states.some(
          (state) =>
            state.last_attempt === latestAttempt &&
            (state.status === 'complete' || state.status === 'partial') &&
            Date.parse(state.next_attempt) > Date.now(),
        )
      ) {
        results.push({
          source: source.id,
          stream: stream.id,
          status: 'skipped',
          reason: 'Collection interval has not elapsed',
          dueAt: states
            .filter((s) => s.last_attempt === latestAttempt)
            .map((s) => s.next_attempt)
            .sort()[0],
        });
        continue;
      }
      const now = nowIso();
      let accepted = false,
        hardFailure = false;
      const cooldowns: string[] = [];
      for (const channel of channels) {
        const state = store.channel(source.id, stream.id, channel.id);
        if (state && Date.parse(state.next_attempt) > Date.now() && due) {
          cooldowns.push(state.next_attempt);
          continue;
        }
        http.raw.length = 0;
        const since = sinceOverride
          ? iso(DateTime.fromISO(sinceOverride, { zone: source.timezone }).toUTC(), '--since')
          : iso(
            DateTime.fromISO(state?.last_success ?? now)
              .minus({ days: state?.last_success ? 1 : config.collection.backfillDays })
              .toUTC(),
            'collection checkpoint',
          );
        try {
          const result = await (registry[channel.kind] as Adapter)({
            source,
            stream,
            channel,
            store,
            http,
            now,
            since,
            restartRange: !!sinceOverride,
            twitterEnvironment: config.paths.twitterEnvironment,
          });
          signal?.throwIfAborted();
          store.assertLease();
          const { newItems } = store.saveCollection(
            source.id,
            stream.id,
            channel.id,
            result,
            next(source, now),
            now,
          );
          results.push({
            source: source.id,
            stream: stream.id,
            channel: channel.id,
            fetchedItems: result.items.length,
            newItems,
            initialSnapshot: !state?.last_success,
            lateOutsideWindow: sinceOverride
              ? result.items.filter(
                (item) =>
                  item.basis !== 'observed' && Date.parse(item.publishedAt) < Date.parse(sinceOverride),
              ).length
              : 0,
            ...result.coverage,
          });
          if (result.coverage.status === 'complete' || result.coverage.status === 'partial') {
            accepted = true;
            break;
          }
          hardFailure = true;
        } catch (error) {
          signal?.throwIfAborted();
          store.assertLease();
          const cooldown = sourceRetryAt(error);
          if (cooldown) cooldowns.push(cooldown);
          else hardFailure = true;
          const retryAt = cooldown ?? next(source, now);
          const coverage = { status: 'failed' as const, to: now, notes: [errorText(error)] };
          store.saveCollection(
            source.id,
            stream.id,
            channel.id,
            { items: [], raw: http.raw, coverage },
            retryAt,
            now,
          );
          results.push({ source: source.id, stream: stream.id, channel: channel.id, ...coverage });
        }
      }
      if (!accepted) {
        const deferred = !hardFailure && cooldowns.length > 0;
        results.push({
          source: source.id,
          stream: stream.id,
          status: deferred ? 'deferred' : 'unavailable',
          reason: deferred ? 'Channels are cooling down' : 'No enabled channel returned usable coverage',
          ...(deferred ? { retryAt: cooldowns.sort()[0] } : {}),
        });
      }
      // arXiv enforces one connection and at least three seconds between API requests, including category changes.
      if (source.id === 'arxiv') await sleep(3100, signal);
    }
  }
  return results;
}
function next(source: Source, now: string): string {
  return iso(DateTime.fromISO(now).plus({ hours: source.intervalHours }), 'next collection time');
}
