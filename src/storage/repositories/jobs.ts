import type { JobRow, SummaryRow } from '../rows.js';
import type Database from '../sqlite.js';
import { statements } from '../statements.js';
export function jobsRepository(db: Database) {
  const statement = statements(db);
  return {
    removePlanning: (source: string, id: string) => statement("DELETE FROM feed_planning WHERE source=? AND id=?").run(source, id),
    excluded: (source: string, id: string): object | undefined => statement("SELECT 1 FROM feed_excluded WHERE source=? AND id=?").get(source, id) as object | undefined,
    find: (source: string, id: string): JobRow | undefined => statement("SELECT * FROM feed_jobs WHERE source=? AND id=?").get(source, id) as JobRow | undefined,
    plan: (source: string, id: string, key: string, data: string) => statement("INSERT OR REPLACE INTO feed_jobs VALUES (?,?,?,?, 'pending',0,'',NULL)").run(source, id, key, data),
    updateEvidence: (data: string, source: string, id: string) => statement("UPDATE feed_jobs SET data=? WHERE source=? AND id=?").run(data, source, id),
    retry: (source: string, id: string) => statement("UPDATE feed_jobs SET state='pending',attempts=0,next_at='',error=NULL WHERE source=? AND id=?").run(source, id),
    accepted: (source: string, id: string): Pick<SummaryRow, "accepted"> | undefined => statement("SELECT accepted FROM feed_summaries WHERE source=? AND id=?").get(source, id) as Pick<SummaryRow, "accepted"> | undefined,
    onlyArchived: (source: string, id: string): object | undefined => statement("SELECT 1 FROM feed_archives a WHERE source=? AND id=? AND NOT EXISTS(SELECT 1 FROM feed_summaries f WHERE f.source=a.source AND f.id=a.id)").get(source, id) as object | undefined,
    attempts: (source: string, id: string): Pick<JobRow, "attempts"> => statement("SELECT attempts FROM feed_jobs WHERE source=? AND id=?").get(source, id) as Pick<JobRow, "attempts">,
    updateAccepted: (accepted: string, source: string, id: string) => statement("UPDATE feed_summaries SET accepted=? WHERE source=? AND id=?").run(accepted, source, id),
    schedule: (dueAt: string, source: string, id: string) => statement("UPDATE feed_planning SET due_at=? WHERE source=? AND id=?").run(dueAt, source, id),
    cache: (key: string, copy: string) => statement("INSERT OR REPLACE INTO feed_cache VALUES (?,?)").run(key, copy),
    cacheTopics: (key: string, topics: string) => statement("INSERT OR REPLACE INTO feed_cache_topics VALUES (?,?)").run(key, topics),
    acceptState: (state: string, source: string, id: string, key: string) => statement("UPDATE feed_jobs SET state=?,error=NULL WHERE source=? AND id=? AND cache_key=?").run(state, source, id, key),
    acceptSummary: (source: string, id: string, key: string, accepted: string, updated: string) => statement("INSERT OR REPLACE INTO feed_summaries VALUES (?,?,?,?,?)").run(source, id, key, accepted, updated),
    exhaust: (sources: string) => statement("UPDATE feed_jobs SET state='failed',error=COALESCE(error,'Attempt limit reached after interruption') WHERE state='pending' AND attempts>=5 AND source IN (SELECT value FROM json_each(?))").run(sources),
    replanFailed: (source: string) => statement("INSERT OR REPLACE INTO feed_planning SELECT source,id,'' FROM feed_jobs WHERE source=? AND state='failed'").run(source),
    defer: (error: string, state: string, source: string, id: string) => statement("UPDATE feed_jobs SET error=?,state=? WHERE source=? AND id=?").run(error, state, source, id),
    replaceEvidence: (key: string, data: string, source: string, id: string) => statement("UPDATE feed_jobs SET cache_key=?,data=? WHERE source=? AND id=?").run(key, data, source, id),
    fail: (error: string, source: string, id: string) => statement("UPDATE feed_jobs SET state='failed',error=? WHERE source=? AND id=?").run(error, source, id),
    cachedCopy: (key: string): { copy: string } | undefined => statement("SELECT copy FROM feed_cache WHERE key=?").get(key) as { copy: string } | undefined,
    cachedTopics: (key: string): { topics: string } | undefined => statement("SELECT topics FROM feed_cache_topics WHERE key=?").get(key) as { topics: string } | undefined,
    removeCache: (key: string) => statement("DELETE FROM feed_cache WHERE key=?").run(key),
    removeCacheTopics: (key: string) => statement("DELETE FROM feed_cache_topics WHERE key=?").run(key),
    rejectArtifact: (error: string, source: string, id: string) => statement("UPDATE feed_jobs SET state=CASE WHEN attempts>=5 THEN 'failed' ELSE 'pending' END,error=? WHERE source=? AND id=?").run(error, source, id),
    countAttempt: (source: string, id: string) => statement("UPDATE feed_jobs SET attempts=attempts+1 WHERE source=? AND id=?").run(source, id),
    clearError: (source: string, id: string) => statement("UPDATE feed_jobs SET error=NULL WHERE source=? AND id=?").run(source, id),
    backoff: (state: string, nextAt: string, error: string, source: string, id: string) => statement("UPDATE feed_jobs SET state=?,next_at=?,error=? WHERE source=? AND id=?").run(state, nextAt, error, source, id),
  };
}
export type JobsRepository = ReturnType<typeof jobsRepository>;
