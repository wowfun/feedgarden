import type { TaskRow } from '../rows.js';
import type Database from '../sqlite.js';
import { statements } from '../statements.js';
export function tasksRepository(db: Database) {
  const statement = statements(db);
  return {
    find: (key: string): TaskRow | undefined => statement("SELECT * FROM feed_tasks WHERE key=?").get(key) as TaskRow | undefined,
    create: (key: string, kind: string, input: string, workspace: string, createdAt: string) => statement("INSERT INTO feed_tasks(key,kind,input,workspace,state,created_at) VALUES (?,?,?,?,'pending',?)").run(key, kind, input, workspace, createdAt),
    accept: (output: string, key: string) => statement("UPDATE feed_tasks SET output=?,state='accepted',error=NULL WHERE key=?").run(output, key),
    invalidate: (state: string, nextAt: string, error: string, key: string) => statement("UPDATE feed_tasks SET output=NULL,state=?,next_at=?,error=? WHERE key=?").run(state, nextAt, error, key),
    retry: (key: string) => statement("UPDATE feed_tasks SET attempts=0,next_at='',state='pending',error=NULL WHERE key=?").run(key),
    start: (attempts: number, workspace: string, createdAt: string, key: string) => statement("UPDATE feed_tasks SET attempts=?,workspace=?,created_at=?,state='running' WHERE key=?").run(attempts, workspace, createdAt, key),
    defer: (key: string) => statement("UPDATE feed_tasks SET state='pending' WHERE key=?").run(key),
    fail: (state: string, nextAt: string, error: string, key: string) => statement("UPDATE feed_tasks SET state=?,next_at=?,error=? WHERE key=?").run(state, nextAt, error, key),
    accepted: (key: string): Pick<TaskRow, "output"> | undefined => statement("SELECT output FROM feed_tasks WHERE key=? AND state='accepted'").get(key) as Pick<TaskRow, "output"> | undefined,
    error: (key: string): Pick<TaskRow, "error"> => statement("SELECT error FROM feed_tasks WHERE key=?").get(key) as Pick<TaskRow, "error">,
    clearWorkspace: (key: string, workspace: string) => statement("UPDATE feed_tasks SET workspace='' WHERE key=? AND workspace=?").run(key, workspace),
    list: (): TaskRow[] => statement("SELECT * FROM feed_tasks").all() as TaskRow[],
    exists: (key: string): object | undefined => statement("SELECT 1 FROM feed_tasks WHERE key=?").get(key) as object | undefined,
    rekey: (next: string, previous: string) => statement("UPDATE feed_tasks SET key=? WHERE key=?").run(next, previous),
  };
}
export type TasksRepository = ReturnType<typeof tasksRepository>;
