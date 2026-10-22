import { readFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { z } from 'zod';
import type { Config, Source } from './config.js';
import { generateBatch, agentIdentity, configuredAgent, createAgentResolver, resolveAgent, type AgentResolver, type ResolvedAgent, type AgentResult, type SummaryInput } from './agent.js';
import { validateArtifact, validateRegistry, ArtifactError, outputSchema } from './topics-contract.mjs';
import { applyTopics, loadTopics, type Registry } from './topics.js';
import { Store, QuotaDeferred } from './store.js';
import type { Item } from './types.js';
import { atomicWrite, errorText, hash, nowIso, safeUrl } from './util.js';
import { enrichItem, enrichmentInterval } from './source-content.js';
import { Http } from './http.js';
import { reportSkill } from './report-skill.js';
import { pruneWorkspaces } from './workspaces.js';
import { importArchives } from './archives.js';
import { reconcileSelection, selectionClause } from './selection.js';
import { publicationClause, publicationScope, admitsPublication } from './publications.js';
import { inItemWindow, itemWindowSql, resolveItemWindow, type ItemWindow, type WindowOptions } from './item-window.js';
import { transcriptStep } from './podcasts.js';

export type ItemCopy = z.infer<typeof outputSchema>['items'][number];
export interface AcceptedItem { item: Item; copy: ItemCopy; firstSeen: string; date: string; dateBasis: 'published' | 'observed'; updated: string }
interface Job { source: string; id: string; cache_key: string; data: string; state: string; attempts: number; next_at: string; error: string | null }
interface FixedJob { source: string; id: string; key: string; item: Item; firstSeen: string }
interface Batch { id: string; input: string; jobs: string; workspace: string; state: string }
export type Generator = (agent: Config['agent'], input: SummaryInput, repair?: string, workspace?: string, signal?: AbortSignal) => Promise<AgentResult>;
export function summaryItem(item: Item, maxChars: number): SummaryInput['items'][number] {
  const normalize = (value: string) => value.normalize('NFKC').replace(/\s+/g, ' ').trim();
  const comments = item.discussion?.comments.slice(0, 10).map(comment => ({ ...comment, text: normalize(comment.text).slice(0, 600), author: normalize(comment.author) }));
  return { source: item.source, id: item.id, title: normalize(item.title), text: normalize(item.text).slice(0, maxChars), ...(item.author ? { author: normalize(item.author) } : {}), ...(item.media?.length ? { media: item.media.slice(0, 6) } : {}), ...(item.articleQuote ? { articleQuote: item.articleQuote } : {}), ...(comments?.length ? { discussion: { comments } } : {}) };
}
function summaryKey(item: Item, agent: Config['agent'], skillHash: string): string {
  return hash({ ...summaryItem(item, agent.maxItemChars), ...(item.metadata?.transcriptRecipe ? { transcriptRecipe: item.metadata.transcriptRecipe } : {}), ...agentIdentity(agent), skillHash, contractVersion: 2, summaryRevision: 3 });
}
export function itemPath(source: string, day: string, number: number): string {
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(source) || !/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isSafeInteger(number) || number < 1) throw new Error('Invalid item path components');
  return `${source}/${day.slice(0, 7)}/${day.slice(8)}/item-${number}.md`;
}
export function eligible(item: Item, firstSeen: string, cutoff: string, source: Source, window?: ItemWindow): boolean {
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
export function* iterateAcceptedItems(store: Store): IterableIterator<AcceptedItem & { published: boolean }> {
  const scope = publicationScope(store);
  const query = store.statement(`SELECT f.source,f.id,f.accepted,p.id IS NOT NULL AS published FROM feed_summaries f LEFT JOIN feed_excluded e ON e.source=f.source AND e.id=f.id LEFT JOIN feed_publications p ON p.source=f.source AND p.id=f.id WHERE e.id IS NULL AND ${publicationClause('f', 'p')} AND (f.source,f.id)>(?,?) ORDER BY f.source,f.id LIMIT 128`);
  let source = '', id = '';
  while (true) {
    const rows = query.all(source, id) as { source: string; id: string; accepted: string; published: number }[];
    if (!rows.length) return;
    for (const row of rows) {
      const record = JSON.parse(row.accepted) as AcceptedItem;
      if (admitsPublication(record.item, record.firstSeen, row.published === 1, scope)) yield { ...record, published: row.published === 1 };
    }
    ({ source, id } = rows.at(-1)!);
  }
}
export function acceptedItems(store: Store): AcceptedItem[] { return [...iterateAcceptedItems(store)]; }
export async function summarize(config: Config, store: Store, options: WindowOptions & { source?: string; rebuild?: boolean; refresh?: boolean; retryFailed?: boolean; signal?: AbortSignal; resolveAgent?: AgentResolver } = {}, generator: Generator = generateBatch, at = nowIso(), prepare: typeof enrichItem = enrichItem): Promise<{ generated: number; pending: number; failed: number; deferred: boolean; window: ItemWindow; eligibleCandidates: number | null; sourceErrors: { source: string; error: string }[]; jobErrors: { source: string; id: string; error: string }[] }> {
  options.signal?.throwIfAborted();
  const resolver = createAgentResolver(options.resolveAgent ?? (generator === generateBatch ? resolveAgent : configuredAgent));
  const agents = new Map<string, ResolvedAgent>();
  const sourceErrors: { source: string; error: string }[] = [];
  const window = resolveItemWindow(options, store.meta('cutoff')!, at);
  const cutoff = window.since;
  const sources = config.sources.filter(source => source.enabled && (!options.source || source.id === options.source));
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
    remove: store.statement('DELETE FROM feed_planning WHERE source=? AND id=?'),
    excluded: store.statement('SELECT 1 FROM feed_excluded WHERE source=? AND id=?'),
    job: store.statement('SELECT * FROM feed_jobs WHERE source=? AND id=?'),
    insert: store.statement("INSERT OR REPLACE INTO feed_jobs VALUES (?,?,?,?, 'pending',0,'',NULL)"),
    update: store.statement('UPDATE feed_jobs SET data=? WHERE source=? AND id=?'),
    retry: store.statement("UPDATE feed_jobs SET state='pending',attempts=0,next_at='',error=NULL WHERE source=? AND id=?"),
    accepted: store.statement('SELECT accepted FROM feed_summaries WHERE source=? AND id=?'),
    archived: store.statement('SELECT 1 FROM feed_archives a WHERE source=? AND id=? AND NOT EXISTS(SELECT 1 FROM feed_summaries f WHERE f.source=a.source AND f.id=a.id)'),
    attempts: store.statement('SELECT attempts FROM feed_jobs WHERE source=? AND id=?'),
    present: store.statement('UPDATE feed_summaries SET accepted=? WHERE source=? AND id=?'),
    schedule: store.statement('UPDATE feed_planning SET due_at=? WHERE source=? AND id=?'),
  };
  const admitted = (job: FixedJob) => {
    const source = sourceById.get(job.source);
    return !!source && !planning.excluded.get(job.source, job.id) && eligible(job.item, job.firstSeen, cutoff, source, window);
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
    store.db.transaction(() => {
      store.assertLease();
      jobs.forEach((job, i) => {
        const copy = output.items[i]! as ItemCopy;
        const accepted: AcceptedItem = { item: job.item, copy, firstSeen: job.firstSeen, date: job.item.basis === 'observed' ? job.firstSeen : job.item.publishedAt, dateBasis: job.item.basis === 'observed' ? 'observed' : 'published', updated: at };
        store.statement('INSERT OR REPLACE INTO feed_cache VALUES (?,?)').run(job.key, JSON.stringify(copy));
        store.statement('INSERT OR REPLACE INTO feed_cache_topics VALUES (?,?)').run(job.key, JSON.stringify(output.newTopics.filter(topic => copy.topics.includes(topic.id))));
        store.statement('UPDATE feed_jobs SET state=?,error=NULL WHERE source=? AND id=? AND cache_key=?').run(admittedJobs[i] ? 'ready' : 'cached', job.source, job.id, job.key);
        if (!admittedJobs[i]) return; // Complete privately; proposals travel with the cached copy.
        // A recovered artifact can outlive its selection. Complete its job;
        // first publication still requires selection, while published items stay.
        store.statement('INSERT OR REPLACE INTO feed_summaries VALUES (?,?,?,?,?)').run(job.source, job.id, job.key, JSON.stringify(accepted), at);
      });
      store.statement("UPDATE feed_batches SET state='accepted',error=NULL WHERE id=?").run(batch.id);
    })();
    generated += jobs.filter((job, i) => admittedJobs[i] && store.isSelected(job.source, job.id)).length;
  }
  const unfinished = store.statement("SELECT * FROM feed_batches WHERE state IN ('prepared','running') ORDER BY created_at,id").all() as Batch[];
  for (const batch of unfinished) {
    if (!(JSON.parse(batch.jobs) as FixedJob[]).every(job => sources.some(source => source.id === job.source))) continue;
    let artifact: unknown;
    try { artifact = JSON.parse(await readFile(join(batch.workspace, 'result.json'), 'utf8')); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error; }
    if (artifact) {
      try { await accept(batch, artifact); }
      catch (error) { if (!(error instanceof ArtifactError)) throw error; store.statement("UPDATE feed_batches SET state='interrupted',error=? WHERE id=?").run(errorText(error), batch.id); }
    }
    else store.statement("UPDATE feed_batches SET state='interrupted',error='Interrupted without valid artifact' WHERE id=?").run(batch.id);
  }
  store.statement("UPDATE feed_jobs SET state='failed',error=COALESCE(error,'Attempt limit reached after interruption') WHERE state='pending' AND attempts>=5 AND source IN (SELECT value FROM json_each(?))").run(JSON.stringify(sources.map(source => source.id)));
  await pruneWorkspaces(config.agent, store, at);
  // Probe only if potentially useful work exists. Keep selection/exclusion and
  // archived-without-summary rules aligned with the final per-row check below;
  // the policy INSERT intentionally also models refresh/unfinished-job state.
  const candidateWindow = itemWindowSql('i.data', 'i.first_seen', window, '$', 'i.published_at');
  const potential = store.statement(`SELECT i.data,i.first_seen FROM items i
    LEFT JOIN feed_excluded e ON e.source=i.source AND e.id=i.id
    WHERE i.source=? AND e.id IS NULL AND ${selectionClause('i')}
    AND ${candidateWindow.clause}
    AND (? OR NOT EXISTS(SELECT 1 FROM feed_archives a WHERE a.source=i.source AND a.id=i.id
      AND NOT EXISTS(SELECT 1 FROM feed_summaries f WHERE f.source=a.source AND f.id=a.id)))`);
  let eligibleCandidates: number | null = options.since === undefined ? null : 0;
  function hasEligibleItems(source: Source): boolean {
    let found = false;
    for (const row of potential.iterate(source.id, ...candidateWindow.parameters, options.rebuild || options.refresh ? 1 : 0) as Iterable<{ data: string; first_seen: string }>) {
      if (!eligible(JSON.parse(row.data) as Item, row.first_seen, cutoff, source, window)) continue;
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
    try { agent = await resolver({ ...config.agent, ...source.agent }, options.signal); }
    catch (error) {
      options.signal?.throwIfAborted(); store.assertLease();
      sourceErrors.push({ source: source.id, error: errorText(error) });
      continue;
    }
    options.signal?.throwIfAborted(); store.assertLease();
    agents.set(source.id, agent);
    const policy = hash({ keywords: source.includeKeywords, ...agentIdentity(agent), maxItemChars: agent.maxItemChars, skillHash, summaryRevision: 3, planningRevision: 3, enrichmentRefreshDays: config.collection.enrichmentRefreshDays });
    const windowPolicy = hash({ cutoff: store.meta('cutoff'), since: options.since, until: options.until, observedDays: options.observedDays });
    const changedPolicy = options.rebuild || options.refresh || store.meta('planning_policy:' + source.id) !== policy;
    if (changedPolicy || store.meta('planning_window:' + source.id) !== windowPolicy) {
      // This is incremental scheduling, not the full eligibility predicate:
      // the probe above is conservative; queued rows are rechecked below.
      // Policy changes revisit recent items and unfinished copies. Historical accepted
      // items require changed source facts or an explicit refresh/rebuild.
      const refreshSince = new Date(Date.parse(at) - config.collection.enrichmentRefreshDays * 86400_000).toISOString();
      store.db.transaction(() => {
        store.statement(`INSERT OR ${changedPolicy ? 'REPLACE' : 'IGNORE'} INTO feed_planning SELECT i.source,i.id,'' FROM items i LEFT JOIN feed_excluded e ON e.source=i.source AND e.id=i.id LEFT JOIN feed_summaries f ON f.source=i.source AND f.id=i.id LEFT JOIN feed_jobs j ON j.source=i.source AND j.id=i.id WHERE i.source=? AND e.id IS NULL AND ${candidateWindow.clause} AND (? OR f.id IS NULL OR j.state!='ready' OR julianday(i.first_seen)>julianday(?))`).run(source.id, ...candidateWindow.parameters, options.rebuild || options.refresh ? 1 : 0, refreshSince);
        store.setMeta('planning_policy:' + source.id, policy);
        store.setMeta('planning_window:' + source.id, windowPolicy);
      })();
    }
    if (options.retryFailed) store.statement("INSERT OR REPLACE INTO feed_planning SELECT source,id,'' FROM feed_jobs WHERE source=? AND state='failed'").run(source.id);
    const query = store.statement('SELECT i.id,i.data,i.first_seen,p.due_at FROM feed_planning p JOIN items i ON i.source=p.source AND i.id=p.id WHERE p.source=? AND p.due_at<=? ORDER BY p.due_at,p.id LIMIT 128');
    while (true) {
      options.signal?.throwIfAborted();
      const rows = query.all(source.id, at) as { id: string; data: string; first_seen: string; due_at: string }[];
      if (!rows.length) break;
      for (const row of rows) {
        options.signal?.throwIfAborted();
        if (row.due_at && Date.parse(at) >= Date.parse(row.first_seen) + config.collection.enrichmentRefreshDays * 86400_000) {
          planning.remove.run(source.id, row.id); continue;
        }
        let item = JSON.parse(row.data) as Item;
        // Final gate for both new policy scans and trigger-enqueued facts. See
        // potential/hasEligibleItems above and the eligibility matrix regression.
        if (!store.isSelected(source.id, row.id) || planning.archived.get(source.id, row.id) && !options.refresh && !options.rebuild || planning.excluded.get(source.id, row.id) || !eligible(item, row.first_seen, cutoff, source, window)) {
          planning.remove.run(source.id, row.id); continue;
        }
        safeUrl(item.url);
        item = await prepare(item, store, http, !!(options.rebuild || options.refresh));
        if (item.source === 'podcast') {
          if (options.rebuild) store.setMeta('podcast_rebuild:' + JSON.stringify([item.source, item.id]), randomUUID());
          item = (await transcriptStep(item, store, agent, false, options.signal)).item;
        }
        options.signal?.throwIfAborted();
        const key = summaryKey(item, agent, skillHash);
        const previous = planning.job.get(source.id, row.id) as Job | undefined;
        if (!previous || previous.cache_key !== key || options.rebuild) planning.insert.run(source.id, row.id, key, JSON.stringify({ item, firstSeen: row.first_seen }));
        else {
          const data = JSON.stringify({ item, firstSeen: row.first_seen });
          if (data !== previous.data) planning.update.run(data, source.id, row.id);
          if (options.retryFailed && previous.state === 'failed') planning.retry.run(source.id, row.id);
          if (previous.state === 'ready') {
            const old = planning.accepted.get(source.id, row.id) as { accepted: string };
            const accepted = JSON.parse(old.accepted) as AcceptedItem;
            accepted.item = item; // Metrics/URL/date changes update presentation without another summary.
            accepted.dateBasis = item.basis === 'observed' ? 'observed' : 'published';
            accepted.date = accepted.dateBasis === 'observed' ? accepted.firstSeen : item.publishedAt;
            const updated = JSON.stringify(accepted);
            if (updated !== old.accepted) planning.present.run(updated, source.id, row.id);
          }
        }
        const interval = enrichmentInterval(item), nextRefresh = Date.parse(at) + interval;
        if (interval && nextRefresh < Date.parse(row.first_seen) + config.collection.enrichmentRefreshDays * 86400_000) planning.schedule.run(new Date(nextRefresh).toISOString(), source.id, row.id);
        else planning.remove.run(source.id, row.id);
      }
    }
  }
  let cursor = store.meta('round_robin') ?? '';
  const blockedJobs = new Set<string>();
  // The due-time index requires sorting the entire pending queue per batch.
  // Walk the partial FIFO index instead; next_at still filters delayed retries.
  const jobWindow = itemWindowSql('j.data', "json_extract(j.data,'$.firstSeen')", window, '$.item');
  const jobGate = `${jobWindow.clause} AND NOT EXISTS(SELECT 1 FROM feed_excluded e WHERE e.source=j.source AND e.id=j.id) AND ${selectionClause('j')}`;
  const pendingJobs = store.statement(`SELECT j.* FROM feed_jobs j INDEXED BY feed_jobs_pending_order WHERE source=? AND state='pending' AND next_at<=? AND attempts<5 AND ${jobGate} AND j.source||'/'||j.id NOT IN (SELECT value FROM json_each(?)) ORDER BY json_extract(data,'$.firstSeen'),id`);
  const cachedJobs = store.statement(`SELECT j.* FROM feed_jobs j INDEXED BY feed_jobs_cached_order WHERE source=? AND state='cached' AND ${jobGate} AND j.source||'/'||j.id NOT IN (SELECT value FROM json_each(?)) ORDER BY json_extract(data,'$.firstSeen'),id`);
  const eligibleJob = (job: Job, source: Source) => {
    const data = JSON.parse(job.data) as { item: Item; firstSeen: string };
    return eligible(data.item, data.firstSeen, cutoff, source, window);
  };
  while (sources.length) {
    options.signal?.throwIfAborted();
    const start = (sources.findIndex(source => source.id === cursor) + 1) % sources.length;
    let chosen: Source | undefined, jobs: Job[] = [];
    const blocked = JSON.stringify([...blockedJobs]);
    for (let offset = 0; offset < sources.length; offset++) {
      const source = sources[(start + offset) % sources.length]!;
      if (!agents.has(source.id)) continue;
      // HN produces both article and discussion copy in two languages. Its output
      // can exceed the model's token limit even when a larger batch fits the input.
      const batchLimit = source.id === 'hackernews' ? Math.min(2, config.agent.maxBatchItems) : config.agent.maxBatchItems;
      const candidates: Job[] = [];
      for (const rows of [cachedJobs.iterate(source.id, ...jobWindow.parameters, blocked), pendingJobs.iterate(source.id, at, ...jobWindow.parameters, blocked)]) {
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
        if (step.error) store.statement('UPDATE feed_jobs SET error=?,state=? WHERE source=? AND id=?').run('Transcript: ' + step.error, step.failed ? 'failed' : 'pending', job.source, job.id);
        if (step.deferred) deferred = true;
        if (!step.performed) blockedJobs.add(job.source + '/' + job.id);
        continue;
      }
      data.item = step.item; job.data = JSON.stringify(data);
      job.cache_key = summaryKey(step.item, agent, skillHash);
      store.statement('UPDATE feed_jobs SET cache_key=?,data=? WHERE source=? AND id=?').run(job.cache_key, job.data, job.source, job.id);
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
      store.statement("UPDATE feed_jobs SET state='failed',error=? WHERE source=? AND id=?").run(`Item and topic registry use ${oversizedChars} characters, exceeding agent.maxInputChars=${agent.maxInputChars}. Increase maxInputChars or lower maxItemChars, then use --retry-failed. No ACP attempt was spent.`, jobs[0]!.source, jobs[0]!.id);
      continue;
    }
    const cached = options.rebuild ? [] : fixed.map(job => (store.statement('SELECT copy FROM feed_cache WHERE key=?').get(job.key) as { copy: string } | undefined)?.copy);
    const hasCached = cached.length === fixed.length && cached.every(Boolean);
    // A full cache can fail validation below. Quota deferral must also block
    // those rejected cached jobs rather than revisit the same batch this run.
    const blockUncached = () => fixed.forEach((job, index) => { if (!cached[index] || hasCached) blockedJobs.add(job.source + '/' + job.id); });
    if (deferred && !hasCached) { blockUncached(); continue; }
    const id = randomUUID(), workspace = resolve(agent.runtimeDirectory, 'task-' + id);
    const batch: Batch = { id, input: JSON.stringify(input), jobs: JSON.stringify(fixed), workspace, state: 'prepared' };
    await mkdir(workspace, { recursive: true, mode: 0o700 });
    await atomicWrite(join(workspace, '.feedgarden-workspace.json'), JSON.stringify({ version: 1, batch: id }));
    store.statement('INSERT INTO feed_batches VALUES (?,?,?,?,?,?,NULL)').run(id, batch.input, batch.jobs, workspace, 'prepared', at);
    if (!options.rebuild) {
      if (hasCached) {
        try {
          const proposals = new Map<string, Registry['topics'][number]>();
          for (const job of fixed) {
            const row = store.statement('SELECT topics FROM feed_cache_topics WHERE key=?').get(job.key) as {topics:string} | undefined;
            for (const topic of JSON.parse(row?.topics ?? '[]') as Registry['topics']) if (!registry.topics.some(current => current.id === topic.id)) proposals.set(topic.id, topic);
          }
          await accept(batch, { contractVersion: 2, items: cached.map(copy => JSON.parse(copy!)), newTopics: [...proposals.values()] });
          continue;
        } catch (error) {
          if (!(error instanceof ArtifactError) && !(error instanceof SyntaxError)) throw error;
          // Cached copy can outlive its topic assignments. A rejected cache is
          // a miss; paid generation still owns the attempt and backoff budget.
          store.db.transaction(() => {
            for (const job of fixed) {
              store.statement('DELETE FROM feed_cache WHERE key=?').run(job.key);
              store.statement('DELETE FROM feed_cache_topics WHERE key=?').run(job.key);
              store.statement("UPDATE feed_jobs SET state=CASE WHEN attempts>=5 THEN 'failed' ELSE 'pending' END,error=? WHERE source=? AND id=?").run(errorText(error), job.source, job.id);
            }
          })();
          if (fixed.some(job => (planning.attempts.get(job.source, job.id) as {attempts:number}).attempts >= 5)) {
            store.statement("UPDATE feed_batches SET state='failed',error=? WHERE id=?").run(errorText(error), id); continue;
          }
        }
      }
    }
    // Persisted failures cross the queue boundary unchanged; the agent owns repair wording.
    let repair = jobs.find(job => job.error)?.error ?? undefined;
    let batchDeferred = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (fixed.some(job => !store.isSelected(job.source, job.id))) { store.statement("UPDATE feed_batches SET state='interrupted',error='Selection changed before generation' WHERE id=?").run(id); break; }
      if (fixed.some(job => (planning.attempts.get(job.source, job.id) as { attempts: number }).attempts >= 5)) break;
      let call: number;
      try { call = store.startCall(id, agent.model, agent.maxDailyCalls); }
      catch (error) { if (error instanceof QuotaDeferred) { deferred = true; batchDeferred = true; break; } throw error; }
      store.db.transaction(() => {
        for (const job of fixed) store.statement('UPDATE feed_jobs SET attempts=attempts+1 WHERE source=? AND id=?').run(job.source, job.id);
        store.statement("UPDATE feed_batches SET state='running' WHERE id=?").run(id);
      })();
      let persisting = false;
      try {
        const result = await generator(agent, input, repair, workspace, options.signal);
        options.signal?.throwIfAborted();
        const validated = validateArtifact(result.output, input);
        persisting = true;
        await atomicWrite(join(workspace, 'result.json'), JSON.stringify(result.output));
        await atomicWrite(join(workspace, 'audit.json'), JSON.stringify({ inputHash: hash(input), model: agent.model, skillHash, ...result }, null, 2));
        await accept(batch, result.output, validated);
        store.finishCall(call, 'succeeded', { execution: result.execution ?? agent.execution, updates: result.usage }); runtimeFailures = 0; repair = undefined; break;
      } catch (error) {
        repair = errorText(error); store.finishCall(call, 'failed', { execution: agent.execution, error: repair });
        options.signal?.throwIfAborted();
        store.assertLease();
        if (persisting || repair.includes('MANUAL_ACTION:')) throw error;
        const artifactFailure = error instanceof ArtifactError;
        runtimeFailures = artifactFailure ? 0 : runtimeFailures + 1;
        if (!artifactFailure || attempt === 1) break;
      }
    }
    if (batchDeferred) {
      store.statement("UPDATE feed_batches SET state='deferred' WHERE id=?").run(id);
      blockUncached();
      continue;
    }
    if (repair) {
      store.db.transaction(() => {
        for (const job of fixed) {
          const row = planning.attempts.get(job.source, job.id) as { attempts: number };
          const exhausted = row.attempts >= 5;
          const next = new Date(Date.parse(at) + Math.min(6 * 3600_000, 900_000 * 2 ** (row.attempts - 1))).toISOString();
          store.statement('UPDATE feed_jobs SET state=?,next_at=?,error=? WHERE source=? AND id=?').run(exhausted ? 'failed' : 'pending', next, repair, job.source, job.id);
        }
        store.statement("UPDATE feed_batches SET state='failed',error=? WHERE id=?").run(repair, id);
      })();
    }
    if (runtimeFailures >= 3) throw new Error('Three consecutive ACP runtime/transport failures; stopping this run');
  }
  let pending = 0, failed = 0;
  const jobErrors: {source:string;id:string;error:string}[] = [];
  for (const job of store.statement(`SELECT j.* FROM feed_jobs j WHERE state IN ('pending','failed') AND ${jobGate} AND source IN (SELECT value FROM json_each(?))`).iterate(...jobWindow.parameters, JSON.stringify(sources.map(source => source.id))) as Iterable<Job>) {
    if (!eligibleJob(job, sourceById.get(job.source)!)) continue;
    if (job.state === 'pending') pending++; else failed++;
    if (job.error) jobErrors.push({source:job.source,id:job.id,error:job.error});
  }
  return { generated, pending, failed, deferred, window, eligibleCandidates, sourceErrors, jobErrors };
}
