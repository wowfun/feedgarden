import type { ItemWindow } from '../contracts/window.js';
import type { JobRow } from './rows.js';
import { selectionClause } from './selection-sql.js';
import type Database from './sqlite.js';
import { itemWindowSql } from './window-sql.js';
export interface SummaryQueueScope { window: ItemWindow; subscription?: string; admissionsOnlySources?: string[] }
export function summaryQueue(db: Database, options: SummaryQueueScope, setMeta: (key: string, value: string) => void) {
  const window = options.window, admissionsOnly = new Set(options.admissionsOnlySources ?? []);
  const subClause = (alias: string) => {
    const subscription = options.subscription ? `EXISTS(SELECT 1 FROM fdg_subscriptions sub WHERE sub.source=${alias}.source AND sub.id=${alias}.id AND sub.subscription='${options.subscription.replaceAll("'", "''")}')` : '1';
    const pendingSources = [...admissionsOnly].map(id => "'" + id.replaceAll("'", "''") + "'").join(',');
    return `(${subscription})` + (pendingSources ? ` AND (${alias}.source NOT IN (${pendingSources}) OR EXISTS(SELECT 1 FROM fdg_admissions a WHERE a.source=${alias}.source AND a.id=${alias}.id))` : '');
  };
  const candidateWindow = itemWindowSql('i.data', 'i.first_seen', window, '$', 'i.published_at');
  const potential = db.prepare(`SELECT i.data,i.first_seen FROM items i
    LEFT JOIN feed_excluded e ON e.source=i.source AND e.id=i.id
    WHERE i.source=? AND e.id IS NULL AND ${selectionClause('i')}
    AND ${subClause('i')} AND (${candidateWindow.clause} OR EXISTS(SELECT 1 FROM fdg_admissions a WHERE a.source=i.source AND a.id=i.id))
    AND (? OR NOT EXISTS(SELECT 1 FROM feed_archives a WHERE a.source=i.source AND a.id=i.id
      AND NOT EXISTS(SELECT 1 FROM feed_summaries f WHERE f.source=a.source AND f.id=a.id)))`);
  const query = db.prepare(`SELECT i.id,i.data,i.first_seen,p.due_at FROM feed_planning p JOIN items i ON i.source=p.source AND i.id=p.id WHERE p.source=? AND p.due_at<=? AND ${subClause('i')} ORDER BY p.due_at,p.id LIMIT 128`);
  const jobWindow = itemWindowSql('j.data', "json_extract(j.data,'$.firstSeen')", window, '$.item');
  const jobGate = `${subClause('j')} AND (${jobWindow.clause} OR EXISTS(SELECT 1 FROM fdg_admissions a WHERE a.source=j.source AND a.id=j.id)) AND NOT EXISTS(SELECT 1 FROM feed_excluded e WHERE e.source=j.source AND e.id=j.id) AND ${selectionClause('j')}`;
  const pendingJobs = db.prepare(`SELECT j.* FROM feed_jobs j INDEXED BY feed_jobs_pending_order WHERE source=? AND state='pending' AND next_at<=? AND attempts<5 AND ${jobGate} AND j.source||'/'||j.id NOT IN (SELECT value FROM json_each(?)) ORDER BY json_extract(data,'$.firstSeen'),id`);
  const reusablePendingJobs = db.prepare(`SELECT j.* FROM feed_jobs j INDEXED BY feed_jobs_pending_order WHERE source=? AND state='pending' AND next_at<=? AND attempts<5 AND ${jobGate} AND EXISTS(SELECT 1 FROM feed_cache c WHERE c.key=j.cache_key) AND j.source||'/'||j.id NOT IN (SELECT value FROM json_each(?)) ORDER BY json_extract(data,'$.firstSeen'),id`);
  const cachedJobs = db.prepare(`SELECT j.* FROM feed_jobs j INDEXED BY feed_jobs_cached_order WHERE source=? AND state='cached' AND ${jobGate} AND j.source||'/'||j.id NOT IN (SELECT value FROM json_each(?)) ORDER BY json_extract(data,'$.firstSeen'),id`);
  return {
    potential: (source: string, force: boolean) => potential.iterate(source, ...candidateWindow.parameters, force ? 1 : 0) as Iterable<{ data: string; first_seen: string }>,
    plan: (source: string, changedPolicy: boolean, force: boolean, refreshSince: string, policy: string, windowPolicy: string) => {
      db.transaction(() => {
        db.prepare(`INSERT OR ${changedPolicy ? 'REPLACE' : 'IGNORE'} INTO feed_planning SELECT i.source,i.id,'' FROM items i LEFT JOIN feed_excluded e ON e.source=i.source AND e.id=i.id LEFT JOIN feed_summaries f ON f.source=i.source AND f.id=i.id LEFT JOIN feed_jobs j ON j.source=i.source AND j.id=i.id WHERE i.source=? AND e.id IS NULL AND ${candidateWindow.clause} AND (? OR f.id IS NULL OR j.state!='ready' OR julianday(i.first_seen)>julianday(?))`).run(source, ...candidateWindow.parameters, force ? 1 : 0, refreshSince);
        setMeta('planning_policy:' + source, policy);
        setMeta('planning_window:' + source, windowPolicy);
      })();
    },
    planning: (source: string, at: string) => query.all(source, at) as { id: string; data: string; first_seen: string; due_at: string }[],
    pending: (source: string, at: string, blocked: string, cachedOnly = false) => (cachedOnly ? reusablePendingJobs : pendingJobs).iterate(source, at, ...jobWindow.parameters, blocked) as Iterable<JobRow>,
    cached: (source: string, blocked: string) => cachedJobs.iterate(source, ...jobWindow.parameters, blocked) as Iterable<JobRow>,
    recordTasks: (runId: string, sources: string[]) => db.prepare(`INSERT OR REPLACE INTO fdg_run_tasks SELECT ?,j.source,j.id,j.cache_key FROM feed_jobs j WHERE ${jobGate} AND source IN (SELECT value FROM json_each(?))`).run(runId, ...jobWindow.parameters, JSON.stringify(sources)),
    unfinished: (sources: string[]) => db.prepare(`SELECT j.* FROM feed_jobs j WHERE state IN ('pending','failed') AND ${jobGate} AND source IN (SELECT value FROM json_each(?))`).iterate(...jobWindow.parameters, JSON.stringify(sources)) as Iterable<JobRow>,
  };
}
