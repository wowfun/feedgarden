import type { JobRow, RelationRow } from '../rows.js';
import type Database from '../sqlite.js';
import { statements } from '../statements.js';
export function maintenanceRepository(db: Database) {
  const statement = statements(db);
  return {
    modelCalls: (): IterableIterator<{ model: string; usage: string | null }> => statement("SELECT model,usage FROM agent_calls").iterate() as IterableIterator<{ model: string; usage: string | null }>,
    jobs: (): JobRow[] => statement("SELECT * FROM feed_jobs").all() as JobRow[],
    copySummary: (key: string, previous: string) => statement("INSERT OR IGNORE INTO feed_cache SELECT ?,copy FROM feed_cache WHERE key=?").run(key, previous),
    copyTopics: (key: string, previous: string) => statement("INSERT OR IGNORE INTO feed_cache_topics SELECT ?,topics FROM feed_cache_topics WHERE key=?").run(key, previous),
    rekeyJob: (key: string, source: string, id: string) => statement("UPDATE feed_jobs SET cache_key=? WHERE source=? AND id=?").run(key, source, id),
    rekeySummary: (key: string, source: string, id: string, previous: string) => statement("UPDATE feed_summaries SET cache_key=? WHERE source=? AND id=? AND cache_key=?").run(key, source, id, previous),
    relations: (): RelationRow[] => statement("SELECT * FROM feed_relation_pairs").all() as RelationRow[],
    preserveRelation: (key: string, leftPath: string, rightPath: string, leftHash: string, rightHash: string, output: string, expiresAt: string) => statement("INSERT OR IGNORE INTO feed_relation_pairs VALUES(?,?,?,?,?,?,?)").run(key, leftPath, rightPath, leftHash, rightHash, output, expiresAt),
    activeLease: (at: string): { expires: string } | undefined => statement("SELECT expires FROM job_lease WHERE expires>?").get(at) as { expires: string } | undefined,
    deletions: (target: string): { path: string }[] => statement("SELECT path FROM fdg_deletions WHERE target=?").all(target) as { path: string }[],
    orderedDeletions: (target: string): { path: string }[] => statement("SELECT path FROM fdg_deletions WHERE target=? ORDER BY path").all(target) as { path: string }[],
    deletePath: (target: string, path: string) => statement("INSERT OR IGNORE INTO fdg_deletions VALUES(?,?)").run(target, path),
    clearDeletion: (target: string, path: string) => statement("DELETE FROM fdg_deletions WHERE target=? AND path=?").run(target, path),
    retries: (jobsAt: string, modelsAt: string): { retryAt: string }[] => statement("SELECT next_at retryAt FROM feed_jobs WHERE state='pending' AND next_at>? UNION SELECT retry_at FROM fdg_model_cooldowns WHERE retry_at>?").all(jobsAt, modelsAt) as { retryAt: string }[],
    scheduledRun: (key: string): { id: string; state: string } | undefined => statement("SELECT id,state FROM fdg_runs WHERE json_extract(scope,'$.options.scheduledKey')=? ORDER BY created_at DESC LIMIT 1").get(key) as { id: string; state: string } | undefined,
    queuedPid: (pid: number, id: string) => statement("UPDATE fdg_runs SET pid=? WHERE id=? AND state='queued'").run(pid, id),
  };
}
export type MaintenanceRepository = ReturnType<typeof maintenanceRepository>;
