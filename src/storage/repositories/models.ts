import type { AttemptRow } from '../rows.js';
import type Database from '../sqlite.js';
import { statements } from '../statements.js';
export function modelsRepository(db: Database) {
  const statement = statements(db);
  return {
    dailyUsage: (day: string): { model: string; used: number }[] => statement("SELECT model,count(*) used FROM agent_calls WHERE at>=? GROUP BY model").all(day) as { model: string; used: number }[],
    cooldown: (backend: string, account: string, model: string, now: string): { retry_at: string } | undefined => statement("SELECT retry_at FROM fdg_model_cooldowns WHERE backend=? AND account=? AND (model=? OR model='*') AND retry_at>? ORDER BY retry_at DESC LIMIT 1").get(backend, account, model, now) as { retry_at: string } | undefined,
    recordAttempt: (id: string, task: string, model: string, workspace: string, inputHash: string, state: string, createdAt: string) => statement("INSERT INTO fdg_attempts VALUES(?,?,?,?,?,?,?)").run(id, task, model, workspace, inputHash, state, createdAt),
    failAttempt: (id: string) => statement("UPDATE fdg_attempts SET state='failed' WHERE id=?").run(id),
    setCooldown: (backend: string, account: string, model: string, retryAt: string) => statement("INSERT OR REPLACE INTO fdg_model_cooldowns VALUES(?,?,?,?)").run(backend, account, model, retryAt),
    completeAttempt: (id: string) => statement("UPDATE fdg_attempts SET state='succeeded' WHERE id=?").run(id),
    hasAttemptWorkspace: (workspace: string): object | undefined => statement("SELECT 1 FROM fdg_attempts WHERE workspace=?").get(workspace) as object | undefined,
    ownsTaskWorkspace: (key: string, workspace: string): object | undefined => statement("SELECT 1 FROM feed_tasks WHERE key=? AND workspace=?").get(key, workspace) as object | undefined,
    ownsBatchWorkspace: (id: string, workspace: string): object | undefined => statement("SELECT 1 FROM feed_batches WHERE id=? AND workspace=?").get(id, workspace) as object | undefined,
    findAttempt: (id: string): AttemptRow | undefined => statement("SELECT * FROM fdg_attempts WHERE id=?").get(id) as AttemptRow | undefined,
  };
}
export type ModelsRepository = ReturnType<typeof modelsRepository>;
