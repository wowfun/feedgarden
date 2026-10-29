import type { BatchRow } from '../rows.js';
import type Database from '../sqlite.js';
import { statements } from '../statements.js';
export function batchesRepository(db: Database) {
  const statement = statements(db);
  return {
    clearWorkspace: (id: string, workspace: string) => statement("UPDATE feed_batches SET workspace='' WHERE id=? AND workspace=?").run(id, workspace),
    owner: (id: string): Pick<BatchRow, 'workspace' | 'state' | 'created_at'> | undefined => statement('SELECT workspace,state,created_at FROM feed_batches WHERE id=?').get(id) as Pick<BatchRow, 'workspace' | 'state' | 'created_at'> | undefined,
    listJobs: (): Pick<BatchRow, "id" | "jobs">[] => statement("SELECT id,jobs FROM feed_batches").all() as Pick<BatchRow, "id" | "jobs">[],
    rewriteJobs: (jobs: string, id: string) => statement("UPDATE feed_batches SET jobs=? WHERE id=?").run(jobs, id),
    accept: (id: string) => statement("UPDATE feed_batches SET state='accepted',error=NULL WHERE id=?").run(id),
    recoverable: (): BatchRow[] => statement("SELECT * FROM feed_batches WHERE state IN ('prepared','running') ORDER BY created_at,id").all() as BatchRow[],
    interrupt: (id: string) => statement("UPDATE feed_batches SET state='interrupted' WHERE id=?").run(id),
    interruptWithError: (error: string, id: string) => statement("UPDATE feed_batches SET state='interrupted',error=? WHERE id=?").run(error, id),
    interruptMissingArtifact: (id: string) => statement("UPDATE feed_batches SET state='interrupted',error='Interrupted without valid artifact' WHERE id=?").run(id),
    create: (id: string, input: string, jobs: string, workspace: string, state: string, createdAt: string) => statement("INSERT INTO feed_batches VALUES (?,?,?,?,?,?,NULL)").run(id, input, jobs, workspace, state, createdAt),
    fail: (error: string, id: string) => statement("UPDATE feed_batches SET state='failed',error=? WHERE id=?").run(error, id),
    start: (workspace: string, id: string) => statement("UPDATE feed_batches SET state='running',workspace=? WHERE id=?").run(workspace, id),
    defer: (id: string) => statement("UPDATE feed_batches SET state='deferred' WHERE id=?").run(id),
    prunable: (batchCutoff: string, taskCutoff: string): { id: string; workspace: string; auxiliary: number }[] => statement("SELECT id,workspace,0 auxiliary FROM feed_batches WHERE state IN ('accepted','failed','interrupted','deferred') AND workspace!='' AND julianday(created_at)<julianday(?) UNION ALL SELECT key id,workspace,1 auxiliary FROM feed_tasks WHERE state IN ('accepted','failed') AND workspace!='' AND julianday(created_at)<julianday(?)").all(batchCutoff, taskCutoff) as { id: string; workspace: string; auxiliary: number }[],
  };
}
export type BatchesRepository = ReturnType<typeof batchesRepository>;
