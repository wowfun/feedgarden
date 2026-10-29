import { DateTime } from 'luxon';
import { rankItems, relate, relationRevision, summarize, writeSite } from '../content/index.js';
import { type AgentResolver } from '../contracts/agent.js';
import { sourceSchema } from '../contracts/configuration.js';
import { issue } from '../contracts/errors.js';
import type { InstanceContext } from '../instance/index.js';
import { hash } from '../platform/hash.js';
import { indexItems } from '../storage/index.js';
import type { OperationResult } from './result.js';


import type { RunContext } from '../runs/index.js';
import type { CheckpointStep } from './checkpoint.js';
export async function processContent(config: InstanceContext, selected: InstanceContext, ctx: RunContext, resolver: AgentResolver, step: CheckpointStep) {
  const { scope, store, signal } = ctx, options = scope.options;
  const text = (key: string) => typeof options[key] === 'string' ? options[key] as string : undefined;
  const subscription = text('subscription')?.split('/').at(-1);
  const result: OperationResult = {}, issues: ReturnType<typeof issue>[] = [], skipped: unknown[] = [];
  let progress = 0, deferred = false;

  result.explicitItems = await step('inbox', async () => store.inbox.accept(text('source')));
  progress += result.explicitItems;
  // Explicitly saved URL/RSS sources are processed without silently subscribing to them.
  const extra = store.sources.admittedSources(text('source') ?? null, text('source') ?? null)
    .map((row) => row.source as string)
    .filter((id) => !selected.sources.some((s) => s.id === id));
  selected = {
    ...selected,
    sources: [
      ...selected.sources,
      ...extra.map((id) =>
        sourceSchema.parse({
          id,
          name: id,
          intervalHours: 24,
          streams: [{ id: 'explicit', routes: [{ id: 'explicit', kind: 'feed', enabled: false }] }],
        }),
      ),
    ],
  };
  const admissionsOnlySources: string[] = [];
  const sources = selected.sources.filter((source) => {
    if (!source.enabled || (text('source') && source.id !== text('source'))) return false;
    if (extra.includes(source.id)) return true;
    const windowEnd = DateTime.fromISO(scope.window!.until!).setZone(config.timezone);
    const [hour, minute] = source.processAfter.split(':').map(Number),
      ready = windowEnd.startOf('day').set({ hour: hour!, minute: minute! });
    if (Date.parse(scope.at) < ready.toMillis()) {
      skipped.push({ source: source.id, reason: 'not_ready', dueAt: ready.toUTC().toISO() });
      if (
        store.sources.hasPendingAdmission(source.id)
      ) {
        admissionsOnlySources.push(source.id);
        return true;
      }
      return false;
    }
    return true;
  });
  const processing = { ...selected, sources };
  if (sources.some((s) => s.selection))
    result.rank = await step('rank', () =>
      rankItems(processing, store, { source: text('source'), signal }),
    );
  const window = scope.window!;
  result.summary = await step('process', () =>
    summarize(
      processing,
      store,
      {
        resolveAgent: resolver,
        subscription,
        admissionsOnlySources,
        runId: ctx.id,
        since: window.since,
        until: window.until,
        observedDays: Number(options['observed-days'] ?? config.observedDays),
        rebuild: !!options.rebuild,
        refresh: !!options.refresh,
        retryFailed: !!options['retry-failed'],
        signal,
      },
      undefined,
      scope.at,
    ),
  );
  store.sources.completeAdmissions(scope.at);
  progress += result.summary.generated;
  deferred ||= result.summary.deferred || result.summary.pending > 0;
  for (const error of [...result.summary.sourceErrors, ...result.summary.jobErrors])
    issues.push({
      code: 'PROCESSING_FAILED',
      message: 'One processing task failed',
      evidence: { trust: 'untrusted', text: JSON.stringify(error) },
    });
  indexItems(store);
  const acceptedRevision = hash({ content: store.meta('content_version'), windows: store.meta('publication_windows') });
  result.relations = await step(
    'relate',
    () =>
      relate(processing, store, {
        resolveAgent: resolver,
        signal,
        retryFailed: !!options['retry-failed'],
        at: scope.at,
      }),
    acceptedRevision,
  );
  await step('render', () => writeSite(processing, store, signal), hash({ acceptedRevision, relations: relationRevision(store), at: scope.at }));
  progress += result.relations.judged;
  deferred ||= result.relations.deferred || result.relations.pending > 0;
  if (result.relations.configurationError)
    issues.push({
      code: 'RELATIONS_FAILED',
      message: 'Relation configuration failed',
      evidence: { trust: 'untrusted', text: result.relations.configurationError },
    });

  return { selected, result, issues, skipped, progress, deferred };
}
