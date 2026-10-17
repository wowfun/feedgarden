import { readFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DateTime } from 'luxon';
import type { z } from 'zod';
import type { Config, Source } from './config.js';
import { generateBatch, type AgentResult, type SummaryInput } from './agent.js';
import { validateArtifact, ArtifactError, outputSchema } from './topics-contract.mjs';
import { applyTopics, loadTopics, type Registry } from './topics.js';
import { Store, QuotaDeferred } from './store.js';
import type { Item } from './types.js';
import { atomicWrite, errorText, hash, nowIso, safeUrl, iso } from './util.js';
import { enrichItem, enrichmentInterval } from './source-content.js';
import { Http } from './http.js';
import { reportSkill } from './report-skill.js';
import { pruneWorkspaces } from './workspaces.js';
import { importArchives } from './archives.js';
import { reconcileSelection, selectionClause } from './selection.js';
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
  return hash({ ...summaryItem(item, agent.maxItemChars), ...(item.metadata?.transcriptRecipe ? { transcriptRecipe: item.metadata.transcriptRecipe } : {}), model: agent.model, effort: agent.effort, skillHash, contractVersion: 2, summaryRevision: 3 });
}
export function itemPath(source: string, day: string, number: number): string {
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(source) || !/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isSafeInteger(number) || number < 1) throw new Error('Invalid item path components');
  return `${source}/${day.slice(0, 7)}/${day.slice(8)}/item-${number}.md`;
}
export function eligible(item: Item, firstSeen: string, cutoff: string, source: Source): boolean {
  if (item.source === 'x' && item.kind === 'repost') return false;
  if (item.source === 'arxiv' && source.includeKeywords.length && !source.includeKeywords.some(word => (item.title + ' ' + item.text).toLowerCase().includes(word.toLowerCase()))) return false;
  return (item.basis === 'observed' ? firstSeen : item.publishedAt) >= cutoff;
}
export function* iterateAcceptedItems(store: Store): IterableIterator<AcceptedItem> {
  const query = store.statement(`SELECT f.source,f.id,f.accepted FROM feed_summaries f LEFT JOIN feed_excluded e ON e.source=f.source AND e.id=f.id WHERE e.id IS NULL AND ${selectionClause('f', true)} AND (f.source,f.id)>(?,?) ORDER BY f.source,f.id LIMIT 128`);
  let source = '', id = '';
  while (true) {
    const rows = query.all(source, id) as { source: string; id: string; accepted: string }[];
    if (!rows.length) return;
    for (const row of rows) yield JSON.parse(row.accepted) as AcceptedItem;
    ({ source, id } = rows.at(-1)!);
  }
}
export function acceptedItems(store: Store): AcceptedItem[] { return [...iterateAcceptedItems(store)]; }
export async function summarize(config: Config, store: Store, options: { source?: string; since?: string; rebuild?: boolean; refresh?: boolean; retryFailed?: boolean; signal?: AbortSignal } = {}, generator: Generator = generateBatch, at = nowIso(), prepare: typeof enrichItem = enrichItem): Promise<{ generated: number; pending: number; failed: number; deferred: boolean }> {
  options.signal?.throwIfAborted();
  const since = options.since === undefined ? undefined : iso(DateTime.fromISO(options.since).toUTC(), '--since');
  const cutoff = since ? new Date(Math.max(Date.parse(store.meta('cutoff')!), Date.parse(since))).toISOString() : store.meta('cutoff')!;
  const sources = config.sources.filter(source => source.enabled && (!options.source || source.id === options.source));
  if (options.source && !sources.length) throw new Error('Unknown or disabled source: ' + options.source);
  await importArchives(config, store, options.signal);
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
  // Recover a saved artifact before spending another ACP attempt.
  async function accept(batch: Batch, result: unknown, validated?: ReturnType<typeof validateArtifact>): Promise<void> {
    store.assertLease();
    options.signal?.throwIfAborted();
    const input = JSON.parse(batch.input) as SummaryInput;
    const { output, registry: validatedRegistry } = validated ?? validateArtifact(result, input);
    const previous = await loadTopics(config.feed.topics);
    if (hash(previous) !== hash(input.topics) && hash(previous) !== hash(validatedRegistry)) throw new Error('Topic registry changed while a task was running');
    const next = validatedRegistry as Registry;
    store.assertLease();
    await applyTopics(config.feed.topics, next, hash(previous), options.signal);
    options.signal?.throwIfAborted();
    registry = next;
    const jobs = JSON.parse(batch.jobs) as FixedJob[];
    store.db.transaction(() => {
      store.assertLease();
      jobs.forEach((job, i) => {
        const copy = output.items[i]! as ItemCopy;
        const accepted: AcceptedItem = { item: job.item, copy, firstSeen: job.firstSeen, date: job.item.basis === 'observed' ? job.firstSeen : job.item.publishedAt, dateBasis: job.item.basis === 'observed' ? 'observed' : 'published', updated: at };
        store.statement('INSERT OR REPLACE INTO feed_cache VALUES (?,?)').run(job.key, JSON.stringify(copy));
        // A recovered artifact can outlive its selection. Complete its job and
        // keep the accepted copy privately; output queries enforce selection.
        store.statement('INSERT OR REPLACE INTO feed_summaries VALUES (?,?,?,?,?)').run(job.source, job.id, job.key, JSON.stringify(accepted), at);
        store.statement("UPDATE feed_jobs SET state='ready',error=NULL WHERE source=? AND id=? AND cache_key=?").run(job.source, job.id, job.key);
      });
      store.statement("UPDATE feed_batches SET state='accepted',error=NULL WHERE id=?").run(batch.id);
    })();
    generated += jobs.filter(job => store.isSelected(job.source, job.id)).length;
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
  store.statement("UPDATE feed_jobs SET state='failed',error=COALESCE(error,'Attempt limit reached after interruption') WHERE state='pending' AND attempts>=5").run();
  await pruneWorkspaces(config.agent, store, at);
  for (const source of sources) {
    const skillHash = skillHashes.get(source.id)!;
    const agent = { ...config.agent, ...source.agent };
    const policy = hash({ cutoff, keywords: source.includeKeywords, model: agent.model, effort: agent.effort, maxItemChars: agent.maxItemChars, skillHash, summaryRevision: 3, planningRevision: 2, enrichmentRefreshDays: config.collection.enrichmentRefreshDays });
    if (options.rebuild || options.refresh || store.meta('planning_policy:' + source.id) !== policy) {
      // Policy changes revisit recent items and unfinished copies. Historical accepted
      // items require changed source facts or an explicit refresh/rebuild.
      const refreshSince = new Date(Date.parse(at) - config.collection.enrichmentRefreshDays * 86400_000).toISOString();
      store.db.transaction(() => {
        store.statement("INSERT OR REPLACE INTO feed_planning SELECT i.source,i.id,'' FROM items i LEFT JOIN feed_excluded e ON e.source=i.source AND e.id=i.id LEFT JOIN feed_summaries f ON f.source=i.source AND f.id=i.id LEFT JOIN feed_jobs j ON j.source=i.source AND j.id=i.id WHERE i.source=? AND e.id IS NULL AND (i.first_seen>=? OR json_extract(i.data,'$.publishedAt')>=?) AND (? OR f.id IS NULL OR j.state!='ready' OR julianday(i.first_seen)>julianday(?))").run(source.id, cutoff, cutoff, options.rebuild || options.refresh ? 1 : 0, refreshSince);
        store.setMeta('planning_policy:' + source.id, policy);
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
        if (!store.isSelected(source.id, row.id) || planning.archived.get(source.id, row.id) && !options.refresh && !options.rebuild || planning.excluded.get(source.id, row.id) || !eligible(item, row.first_seen, cutoff, source)) {
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
  const pendingJobs = store.statement(`SELECT j.* FROM feed_jobs j INDEXED BY feed_jobs_pending_order WHERE source=? AND state='pending' AND next_at<=? AND attempts<5 AND julianday(CASE WHEN json_extract(data,'$.item.basis')='observed' THEN json_extract(data,'$.firstSeen') ELSE json_extract(data,'$.item.publishedAt') END)>=julianday(?) AND ${selectionClause('j')} AND j.source||'/'||j.id NOT IN (SELECT value FROM json_each(?)) ORDER BY json_extract(data,'$.firstSeen'),id LIMIT ?`);
  while (sources.length) {
    options.signal?.throwIfAborted();
    const start = (sources.findIndex(source => source.id === cursor) + 1) % sources.length;
    let chosen: Source | undefined, jobs: Job[] = [];
    const blocked = JSON.stringify([...blockedJobs]);
    for (let offset = 0; offset < sources.length; offset++) {
      const source = sources[(start + offset) % sources.length]!;
      // HN produces both article and discussion copy in two languages. Its output
      // can exceed the model's token limit even when a larger batch fits the input.
      const batchLimit = source.id === 'hackernews' ? Math.min(2, config.agent.maxBatchItems) : config.agent.maxBatchItems;
      const candidates = pendingJobs.all(source.id, at, cutoff, blocked, batchLimit) as Job[];
      if (candidates.length) { chosen = source; jobs = candidates; break; }
    }
    if (!chosen) break;
    cursor = chosen.id; store.setMeta('round_robin', cursor);
    const agent = { ...config.agent, ...chosen.agent };
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
          await accept(batch, { contractVersion: 2, items: cached.map(copy => JSON.parse(copy!)), newTopics: [] });
          continue;
        } catch (error) {
          if (!(error instanceof ArtifactError) && !(error instanceof SyntaxError)) throw error;
          // Cached copy can outlive its topic assignments. A rejected cache is
          // a miss; paid generation still owns the attempt and backoff budget.
          store.db.transaction(() => {
            for (const job of fixed) store.statement('DELETE FROM feed_cache WHERE key=?').run(job.key);
          })();
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
        store.finishCall(call, 'succeeded', result.usage); runtimeFailures = 0; repair = undefined; break;
      } catch (error) {
        repair = errorText(error); store.finishCall(call, 'failed', { error: repair });
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
  const states = (sources.length ? store.statement("SELECT state,count(*) count FROM feed_jobs j WHERE state!='ready' AND " + selectionClause('j') + " AND source IN (" + sources.map(() => '?').join(',') + ") GROUP BY state").all(...sources.map(source => source.id)) : []) as { state: string; count: number }[];
  return { generated, pending: states.find(row => row.state === 'pending')?.count ?? 0, failed: states.find(row => row.state === 'failed')?.count ?? 0, deferred };
}
