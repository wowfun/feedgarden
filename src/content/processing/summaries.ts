import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { configuredAgent, createAgentResolver, generateBatch, paidTask, pruneWorkspaces, recoverableAttempt, reportSkill, resolveAgent } from '../../agent/index.js';
import { type AgentResolver, type AgentResult, type AgentRuntimeConfig, type ResolvedAgent, type SummaryInput } from '../../contracts/agent.js';
import type { Source } from '../../contracts/configuration.js';
import { FdgError } from '../../contracts/errors.js';
import type { Item } from '../../contracts/items.js';
import { type Registry } from '../../contracts/registry.js';
import { ArtifactError, validateArtifact, validateRegistry } from '../../contracts/topics.mjs';
import { inItemWindow, resolveItemWindow, type ItemWindow, type WindowOptions } from '../../contracts/window.js';
import type { InstanceContext } from '../../instance/index.js';
import { agentRuntime } from '../../instance/index.js';
import { errorText } from '../../platform/errors.js';
import { hash } from '../../platform/hash.js';
import { Http } from '../../platform/http/client.js';
import { nowIso } from '../../platform/time.js';
import { safeUrl } from '../../platform/url.js';
import { enrichItem, enrichmentInterval } from '../../sources/index.js';
import type { Storage } from '../../storage/index.js';
import { importArchives } from '../archives.js';
import { admitsPublication, publicationScope } from '../publications.js';
import { reconcileSelection } from '../selection/select.js';
import { applyTopics, loadTopics } from '../topics.js';
import { transcriptStep } from './transcript.js';

import type { AcceptedItem, ItemCopy } from '../../contracts/content.js';
interface Job { source: string; id: string; cache_key: string; data: string; state: string; attempts: number; next_at: string; error: string | null }
interface FixedJob { source: string; id: string; key: string; item: Item; firstSeen: string }
interface Batch { id: string; input: string; jobs: string; workspace: string; state: string }
export type Generator = (agent: AgentRuntimeConfig, input: SummaryInput, repair?: string, workspace?: string, signal?: AbortSignal) => Promise<AgentResult>;
export function summaryItem(item: Item, maxChars: number): SummaryInput['items'][number] {
  const normalize = (value: string) => value.normalize('NFKC').replace(/\s+/g, ' ').trim();
  const comments = item.discussion?.comments.slice(0, 10).map(comment => ({ ...comment, text: normalize(comment.text).slice(0, 600), author: normalize(comment.author) }));
  return { source: item.source, id: item.id, title: normalize(item.title), text: normalize(item.text).slice(0, maxChars), ...(item.author ? { author: normalize(item.author) } : {}), ...(item.media?.length ? { media: item.media.slice(0, 6) } : {}), ...(item.articleQuote ? { articleQuote: item.articleQuote } : {}), ...(comments?.length ? { discussion: { comments } } : {}) };
}
export function summaryKey(item: Item, agent: InstanceContext['agent'], skillHash: string): string {
  return hash({ ...summaryItem(item, agent.maxItemChars), ...(item.metadata?.transcriptRecipe ? { transcriptRecipe: item.metadata.transcriptRecipe } : {}), skillHash, contractVersion: 2, summaryRevision: 3 });
}
export function itemPath(source: string, day: string, number: number): string {
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(source) || !/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isSafeInteger(number) || number < 1) throw new Error('Invalid item path components');
  return `${source}/${day.slice(0, 7)}/${day.slice(8)}/item-${number}.md`;
}
export function eligible(item: Item, firstSeen: string, cutoff: string, source: Source, window?: ItemWindow): boolean {
  if (item.metadata?.fdgExplicitAdmission === true) return true;
  // Source/date gate shared by the conservative probe scan and final planning
  // check. SQL date scans below must remain a superset of this predicate.
  if (!(window ? inItemWindow(item, firstSeen, window) : Date.parse(item.basis === 'observed' ? firstSeen : item.publishedAt) >= Date.parse(cutoff))) return false;
  if (item.source === 'x' && item.kind === 'repost') return false;
  if (item.source === 'arxiv' && source.includeKeywords.length) {
    const text = (item.title + ' ' + item.text).toLowerCase();
    return source.includeKeywords.some(word => text.includes(word.toLowerCase()));
  }
  return true;
}
export function* iterateAcceptedItems(store: Storage): IterableIterator<AcceptedItem & { published: boolean }> {
  const scope = publicationScope(store);
  const query = store.projections.acceptedPage;
  let source = '', id = '';
  while (true) {
    const rows = query(source, id) as { source: string; id: string; accepted: string; published: number }[];
    if (!rows.length) return;
    for (const row of rows) {
      const record = JSON.parse(row.accepted) as AcceptedItem;
      if (admitsPublication(record.item, record.firstSeen, row.published === 1, scope)) yield { ...record, published: row.published === 1 };
    }
    ({ source, id } = rows.at(-1)!);
  }
}
export function acceptedItems(store: Storage): AcceptedItem[] { return [...iterateAcceptedItems(store)]; }
export async function summarize(config: InstanceContext, store: Storage, options: WindowOptions & { subscription?: string; admissionsOnlySources?: string[]; runId?: string; source?: string; rebuild?: boolean; refresh?: boolean; retryFailed?: boolean; signal?: AbortSignal; resolveAgent?: AgentResolver } = {}, generator: Generator = generateBatch, at = nowIso(), prepare: typeof enrichItem = enrichItem): Promise<{ generated: number; pending: number; failed: number; deferred: boolean; window: ItemWindow; eligibleCandidates: number | null; sourceErrors: { source: string; error: string }[]; jobErrors: { source: string; id: string; error: string }[] }> {
  options.signal?.throwIfAborted();
  const resolver = createAgentResolver(options.resolveAgent ?? (generator === generateBatch ? resolveAgent : configuredAgent));
  const agents = new Map<string, ResolvedAgent>();
  const sourceErrors: { source: string; error: string }[] = [];
  const window = resolveItemWindow(options, store.meta('cutoff')!, at);
  const cutoff = window.since;
  const sources = config.sources.filter(source => source.enabled && (!options.source || source.id === options.source));
  const admissionsOnly = new Set(options.admissionsOnlySources ?? []);
  const scopeEligible = (item: Item, firstSeen: string, source: Source) =>
    (!admissionsOnly.has(source.id) || item.metadata?.fdgExplicitAdmission === true) && eligible(item, firstSeen, cutoff, source, window);

  const sourceById = new Map(sources.map(source => [source.id, source]));
  if (options.source && !sources.length) throw new Error('Unknown or disabled source: ' + options.source);
  await importArchives(config, store, options.signal);
  const windows = publicationScope(store) ?? {};
  for (const source of sources) windows[source.id] = window;
  store.setMeta('publication_windows', JSON.stringify(windows));
  reconcileSelection(config, store, { source: options.source, at, signal: options.signal });
  const skillHashes = new Map(await Promise.all(sources.map(async source => [source.id, hash(await reportSkill([source.id]))] as const)));
  const http = new Http(store, undefined, options.signal);
  let registry = await loadTopics(config.feed.topics), generated = 0, deferred = false, runtimeFailures = 0;
  function checkRegistryBudget(): void {
    const chars = JSON.stringify({ contractVersion: 2, topics: registry, items: [] }).length;
    if (chars >= config.agent.maxInputChars) throw new Error(`Topic registry uses ${chars} characters, exceeding agent.maxInputChars=${config.agent.maxInputChars} before any item. Increase maxInputChars (up to 24000) or shorten topic descriptions through topics apply, preserving IDs and aliases.`);
    if (chars >= config.agent.maxInputChars * 0.8) console.warn(`Topic registry uses ${chars}/${config.agent.maxInputChars} input characters; shorten descriptions or increase agent.maxInputChars before item headroom runs out.`);
  }
  checkRegistryBudget();
  // Prepare the planning statements once per run, not once per item.
  const planning = {
    remove: store.jobs.removePlanning,
    excluded: store.jobs.excluded,
    job: store.jobs.find,
    insert: store.jobs.plan,
    update: store.jobs.updateEvidence,
    retry: store.jobs.retry,
    accepted: store.jobs.accepted,
    archived: store.jobs.onlyArchived,
    attempts: store.jobs.attempts,
    present: store.jobs.updateAccepted,
    schedule: store.jobs.schedule,
  };
  const admitted = (job: FixedJob) => {
    const source = sourceById.get(job.source);
    return !!source && !planning.excluded(job.source, job.id) && scopeEligible(job.item, job.firstSeen, source);
  };
  // Recover a saved artifact before spending another ACP attempt.
  async function accept(batch: Batch, result: unknown, validated?: ReturnType<typeof validateArtifact>): Promise<void> {
    store.assertLease();
    options.signal?.throwIfAborted();
    const input = JSON.parse(batch.input) as SummaryInput;
    const { output, registry: validatedRegistry } = validated ?? validateArtifact(result, input);
    const jobs = JSON.parse(batch.jobs) as FixedJob[];
    const previous = await loadTopics(config.feed.topics);
    const admittedJobs = jobs.map(admitted), hasAdmitted = admittedJobs.some(Boolean);
    const usedTopics = new Set(output.items.filter((_copy, i) => admittedJobs[i]).flatMap(copy => copy.topics));
    const next = validateRegistry({ version: 1, topics: [...input.topics.topics, ...output.newTopics.filter(topic => usedTopics.has(topic.id))] }) as Registry;
    if (![input.topics, next, validatedRegistry].some(candidate => hash(previous) === hash(validateRegistry(candidate)))) throw new ArtifactError('Topic registry changed while a task was running; regenerate with the current registry');
    store.assertLease();
    // A previous acceptance may have flushed topics before its DB commit.
    // Preserve those durable IDs when recovery now admits only part of the batch.
    if (hasAdmitted) await applyTopics(config.feed.topics, { version: 1, topics: [...previous.topics, ...next.topics.filter(topic => !previous.topics.some(old => old.id === topic.id))] }, hash(previous), options.signal);
    options.signal?.throwIfAborted();
    if (hasAdmitted) registry = await loadTopics(config.feed.topics);
    store.acceptSummaries(batch.id, jobs.map((job, i) => {
      const copy = output.items[i]! as ItemCopy;
      const accepted: AcceptedItem = { item: job.item, copy, firstSeen: job.firstSeen, date: job.item.basis === 'observed' ? job.firstSeen : job.item.publishedAt, dateBasis: job.item.basis === 'observed' ? 'observed' : 'published', updated: at };
      return { source: job.source, id: job.id, key: job.key, copy: JSON.stringify(copy), topics: JSON.stringify(output.newTopics.filter(topic => copy.topics.includes(topic.id))), admitted: !!admittedJobs[i], accepted: JSON.stringify(accepted), at };
    }));
    generated += jobs.filter((job, i) => admittedJobs[i] && store.isSelected(job.source, job.id)).length;
  }
  const unfinished = store.batches.recoverable() as Batch[];
  for (const batch of unfinished) {
    if (!(JSON.parse(batch.jobs) as FixedJob[]).every(job => sources.some(source => source.id === job.source))) continue;
    let artifact: unknown;
    if (!batch.workspace || !await recoverableAttempt(store, batch.workspace, batch.id, JSON.parse(batch.input))) { store.batches.interrupt(batch.id); continue; }
    try { artifact = JSON.parse(await readFile(join(batch.workspace, 'result.json'), 'utf8')); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error; }
    if (artifact) {
      try { await accept(batch, artifact); }
      catch (error) { if (!(error instanceof ArtifactError)) throw error; store.batches.interruptWithError(errorText(error), batch.id); }
    }
    else store.batches.interruptMissingArtifact(batch.id);
  }
  store.jobs.exhaust(JSON.stringify(sources.map(source => source.id)));
  await pruneWorkspaces(agentRuntime(config), store, at);
  // Probe only if potentially useful work exists. Keep selection/exclusion and
  // archived-without-summary rules aligned with the final per-row check below;
  // the policy INSERT intentionally also models refresh/unfinished-job state.
  const queue = store.summaryQueue({ window, subscription: options.subscription, admissionsOnlySources: options.admissionsOnlySources });

  let eligibleCandidates: number | null = options.since === undefined ? null : 0;
  function hasEligibleItems(source: Source): boolean {
    let found = false;
    for (const row of queue.potential(source.id, !!(options.rebuild || options.refresh)) as Iterable<{ data: string; first_seen: string }>) {
      if (!scopeEligible(JSON.parse(row.data) as Item, row.first_seen, source)) continue;
      if (eligibleCandidates === null) return true;
      eligibleCandidates++; found = true;
    }
    return found;
  }
  for (const source of sources) {
    // An inherited identity still has to be refreshed when eligible accepted
    // copies exist, since a changed model/effort/version can invalidate them.
    if (!hasEligibleItems(source)) continue;
    const skillHash = skillHashes.get(source.id)!;
    let agent: ResolvedAgent;
    try { agent = await resolver({ ...agentRuntime(config), ...source.agent }, options.signal); }
    catch (error) {
      options.signal?.throwIfAborted(); store.assertLease();
      if (error instanceof FdgError && ['CONFIG_CHANGED', 'RUN_SUPERSEDED'].includes(error.code)) throw error;
      sourceErrors.push({ source: source.id, error: errorText(error) });
      continue;
    }
    options.signal?.throwIfAborted(); store.assertLease();
    agents.set(source.id, agent);
    const policy = hash({ keywords: source.includeKeywords, maxItemChars: agent.maxItemChars, skillHash, summaryRevision: 3, planningRevision: 3, enrichmentRefreshDays: config.collection.enrichmentRefreshDays });
    const windowPolicy = hash({ cutoff: store.meta('cutoff'), since: options.since, until: options.until, observedDays: options.observedDays });
    const changedPolicy = options.rebuild || options.refresh || store.meta('planning_policy:' + source.id) !== policy;
    if (changedPolicy || store.meta('planning_window:' + source.id) !== windowPolicy) {
      // This is incremental scheduling, not the full eligibility predicate:
      // the probe above is conservative; queued rows are rechecked below.
      // Policy changes revisit recent items and unfinished copies. Historical accepted
      // items require changed source facts or an explicit refresh/rebuild.
      const refreshSince = new Date(Date.parse(at) - config.collection.enrichmentRefreshDays * 86400_000).toISOString();
      queue.plan(source.id, !!changedPolicy, !!(options.rebuild || options.refresh), refreshSince, policy, windowPolicy);
    }
    if (options.retryFailed) store.jobs.replanFailed(source.id);

    while (true) {
      options.signal?.throwIfAborted();
      const rows = queue.planning(source.id, at) as { id: string; data: string; first_seen: string; due_at: string }[];
      if (!rows.length) break;
      for (const row of rows) {
        options.signal?.throwIfAborted();
        if (row.due_at && Date.parse(at) >= Date.parse(row.first_seen) + config.collection.enrichmentRefreshDays * 86400_000) {
          planning.remove(source.id, row.id); continue;
        }
        let item = JSON.parse(row.data) as Item;
        // Final gate for both new policy scans and trigger-enqueued facts. See
        // potential/hasEligibleItems above and the eligibility matrix regression.
        if (!store.isSelected(source.id, row.id) || planning.archived(source.id, row.id) && !options.refresh && !options.rebuild || planning.excluded(source.id, row.id) || !scopeEligible(item, row.first_seen, source)) {
          planning.remove(source.id, row.id); continue;
        }
        safeUrl(item.url);
        item = await prepare(item, store, http, !!(options.rebuild || options.refresh));
        if (item.source === 'podcast') {
          if (options.rebuild) store.setMeta('podcast_rebuild:' + JSON.stringify([item.source, item.id]), randomUUID());
          item = (await transcriptStep(item, store, agent, false, options.signal)).item;
        }
        options.signal?.throwIfAborted();
        const key = summaryKey(item, agent, skillHash);
        const previous = planning.job(source.id, row.id) as Job | undefined;
        if (!previous || previous.cache_key !== key || options.rebuild) planning.insert(source.id, row.id, key, JSON.stringify({ item, firstSeen: row.first_seen }));
        else {
          const data = JSON.stringify({ item, firstSeen: row.first_seen });
          if (data !== previous.data) planning.update(data, source.id, row.id);
          if (options.retryFailed && previous.state === 'failed') planning.retry(source.id, row.id);
          if (previous.state === 'ready') {
            const old = planning.accepted(source.id, row.id) as { accepted: string };
            const accepted = JSON.parse(old.accepted) as AcceptedItem;
            accepted.item = item; // Metrics/URL/date changes update presentation without another summary.
            accepted.dateBasis = item.basis === 'observed' ? 'observed' : 'published';
            accepted.date = accepted.dateBasis === 'observed' ? accepted.firstSeen : item.publishedAt;
            const updated = JSON.stringify(accepted);
            if (updated !== old.accepted) planning.present(updated, source.id, row.id);
          }
        }
        const interval = enrichmentInterval(item), nextRefresh = Date.parse(at) + interval;
        if (interval && nextRefresh < Date.parse(row.first_seen) + config.collection.enrichmentRefreshDays * 86400_000) planning.schedule(new Date(nextRefresh).toISOString(), source.id, row.id);
        else planning.remove(source.id, row.id);
      }
    }
  }
  let cursor = store.meta('round_robin') ?? '';
  const blockedJobs = new Set<string>();
  const deferredRoutes = new Set<string>();
  const routeKey = (agent: ResolvedAgent) => hash({ backend: agent.backend, model: agent.model, effort: agent.effort, account: agent.account, maxDailyCalls: agent.maxDailyCalls, candidates: agent.candidates, fallback: agent.fallbackEnabled });
  let blockedCount = -1, blockedJson = '[]';
  // The due-time index requires sorting the entire pending queue per batch.
  // Walk the partial FIFO index instead; next_at still filters delayed retries.




  const eligibleJob = (job: Job, source: Source) => {
    const data = JSON.parse(job.data) as { item: Item; firstSeen: string };
    return scopeEligible(data.item, data.firstSeen, source);
  };
  while (sources.length) {
    options.signal?.throwIfAborted();
    const start = (sources.findIndex(source => source.id === cursor) + 1) % sources.length;
    let chosen: Source | undefined, jobs: Job[] = [];
    if (blockedCount !== blockedJobs.size) { blockedJson = JSON.stringify([...blockedJobs]); blockedCount = blockedJobs.size; }
    const blocked = blockedJson;
    for (let offset = 0; offset < sources.length; offset++) {
      const source = sources[(start + offset) % sources.length]!;
      if (!agents.has(source.id)) continue;
      // HN produces both article and discussion copy in two languages. Its output
      // can exceed the model's token limit even when a larger batch fits the input.
      const batchLimit = source.id === 'hackernews' ? Math.min(2, config.agent.maxBatchItems) : config.agent.maxBatchItems;
      const candidates: Job[] = [];
      const routeDeferred = deferredRoutes.has(routeKey(agents.get(source.id)!));
      for (const rows of [queue.cached(source.id, blocked), ...(routeDeferred && options.rebuild ? [] : [queue.pending(source.id, at, blocked, routeDeferred)])]) {
        for (const row of rows as Iterable<Job>) {
          if (eligibleJob(row, source)) candidates.push(row);
          // Source rules are fixed for this run. Avoid decoding a rejected
          // prefix for every batch; a later run reevaluates its current policy.
          else blockedJobs.add(row.source + '/' + row.id);
          if (candidates.length === batchLimit) break;
        }
        if (candidates.length === batchLimit) break;
      }
      if (candidates.length) { chosen = source; jobs = candidates; break; }
    }
    if (!chosen) break;
    cursor = chosen.id; store.setMeta('round_robin', cursor);
    const agent = agents.get(chosen.id)!;
    const skillHash = skillHashes.get(chosen.id)!;
    if (chosen.id === 'podcast') {
      // Advance one episode node per visit, then rotate sources. Ready episodes
      // also stay single-item batches so their transcript dependencies stay fixed.
      jobs = jobs.slice(0, 1);
      const job = jobs[0]!, data = JSON.parse(job.data) as { item: Item; firstSeen: string };
      const step = await transcriptStep(data.item, store, agent, true, options.signal, options.retryFailed);
      if (!step.ready) {
        if (step.error) store.jobs.defer('Transcript: ' + step.error, step.failed ? 'failed' : 'pending', job.source, job.id);
        if (step.deferred) { deferred = true; deferredRoutes.add(routeKey(agent)); }
        if (!step.performed) blockedJobs.add(job.source + '/' + job.id);
        continue;
      }
      data.item = step.item; job.data = JSON.stringify(data);
      job.cache_key = summaryKey(step.item, agent, skillHash);
      store.jobs.replaceEvidence(job.cache_key, job.data, job.source, job.id);
    }
    checkRegistryBudget();
    const fixed: FixedJob[] = [], input: SummaryInput = { contractVersion: 2, topics: registry, items: [] };
    let oversizedChars = 0;
    for (const job of jobs) {
      const data = JSON.parse(job.data) as { item: Item; firstSeen: string };
      input.items.push(summaryItem(data.item, agent.maxItemChars));
      const chars = JSON.stringify(input).length;
      if (chars > agent.maxInputChars) { oversizedChars = chars; input.items.pop(); break; }
      fixed.push({ source: job.source, id: job.id, key: job.cache_key, ...data });
    }
    if (!fixed.length) {
      store.jobs.fail(`Item and topic registry use ${oversizedChars} characters, exceeding agent.maxInputChars=${agent.maxInputChars}. Increase maxInputChars or lower maxItemChars, then use --retry-failed. No ACP attempt was spent.`, jobs[0]!.source, jobs[0]!.id);
      continue;
    }
    const cached = options.rebuild ? [] : fixed.map(job => (store.jobs.cachedCopy(job.key) as { copy: string } | undefined)?.copy);
    const hasCached = cached.length === fixed.length && cached.every(Boolean);
    // A full cache can fail validation below. Quota deferral must also block
    // those rejected cached jobs rather than revisit the same batch this run.
    const blockUncached = () => fixed.forEach((job, index) => { if (!cached[index] || hasCached) blockedJobs.add(job.source + '/' + job.id); });
    const id = randomUUID();
    const batch: Batch = { id, input: JSON.stringify(input), jobs: JSON.stringify(fixed), workspace: '', state: 'prepared' };
    store.batches.create(id, batch.input, batch.jobs, '', 'prepared', at);
    if (!options.rebuild) {
      if (hasCached) {
        try {
          const proposals = new Map<string, Registry['topics'][number]>();
          for (const job of fixed) {
            const row = store.jobs.cachedTopics(job.key) as { topics: string } | undefined;
            for (const topic of JSON.parse(row?.topics ?? '[]') as Registry['topics']) if (!registry.topics.some(current => current.id === topic.id)) proposals.set(topic.id, topic);
          }
          await accept(batch, { contractVersion: 2, items: cached.map(copy => JSON.parse(copy!)), newTopics: [...proposals.values()] });
          continue;
        } catch (error) {
          if (!(error instanceof ArtifactError) && !(error instanceof SyntaxError)) throw error;
          // Cached copy can outlive its topic assignments. A rejected cache is
          // a miss; paid generation still owns the attempt and backoff budget.
          store.rejectCachedSummaries(fixed, errorText(error));
          if (fixed.some(job => (planning.attempts(job.source, job.id) as { attempts: number }).attempts >= 5)) {
            store.batches.fail(errorText(error), id); continue;
          }
        }
      }
    }
    // Persisted failures cross the queue boundary unchanged; the agent owns repair wording.
    let repair = jobs.find(job => job.error)?.error ?? undefined;
    let batchDeferred = false;
    if (deferredRoutes.has(routeKey(agent))) { store.batches.defer(id); blockUncached(); continue; }
    let paid;
    try {
      paid = await paidTask(store, agent, id, input, {
        signal: options.signal, resolver, owner: 'batch',
        beforeAttempt: () => {
          if (!fixed.every(job => admitted(job) && store.isSelected(job.source, job.id)))
            throw new FdgError('SELECTION_CHANGED', 'Selection changed before generation');
        },
        remaining: () => Math.min(...fixed.map(job => 5 - (planning.attempts(job.source, job.id) as { attempts: number }).attempts)),
        repair,
        begin: directory => { batch.workspace = directory; store.startSummaryAttempt(id, directory, fixed); },
        generate: (candidate, feedback, directory) => generator(candidate, input, feedback, directory, options.signal),
        validate: output => validateArtifact(output, input),
      });
    } catch (error) {
      if (!(error instanceof FdgError && error.code === 'SELECTION_CHANGED')) throw error;
      store.batches.interruptWithError(error.message, id);
      fixed.forEach(job => blockedJobs.add(job.source + '/' + job.id));
      continue;
    }
    if (paid.result) { await accept(batch, paid.result.output, validateArtifact(paid.result.output, input)); runtimeFailures = 0; repair = undefined; }
    else if (paid.deferred) { deferred = true; batchDeferred = true; deferredRoutes.add(routeKey(agent)); }
    else { repair = errorText(paid.error); runtimeFailures++; }
    if (batchDeferred) {
      // Quota/cooldown belongs to the execution route, not the content recipe.
      // A new run may choose another model without clearing content backoff.
      for (const job of fixed) store.jobs.clearError(job.source, job.id);
      store.batches.defer(id);
      blockUncached();
      continue;
    }
    if (repair) {
      store.failSummaryBatch(id, repair, fixed.map(job => {
        const row = planning.attempts(job.source, job.id)!;
        const next = new Date(Date.parse(at) + Math.min(6 * 3600_000, 900_000 * 2 ** (row.attempts - 1))).toISOString();
        return { source: job.source, id: job.id, state: row.attempts >= 5 ? 'failed' : 'pending', next };
      }));
    }
    if (runtimeFailures >= 3) throw new Error('Three consecutive ACP runtime/transport failures; stopping this run');
  }
  if (options.runId) queue.recordTasks(options.runId, sources.map(source => source.id));
  let pending = 0, failed = 0;
  const jobErrors: { source: string; id: string; error: string }[] = [];
  for (const job of queue.unfinished(sources.map(source => source.id)) as Iterable<Job>) {
    if (!eligibleJob(job, sourceById.get(job.source)!)) continue;
    if (job.state === 'pending') pending++; else failed++;
    if (job.error) jobErrors.push({ source: job.source, id: job.id, error: job.error });
  }
  return { generated, pending, failed, deferred, window, eligibleCandidates, sourceErrors, jobErrors };
}
