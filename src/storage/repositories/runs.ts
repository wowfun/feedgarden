import { FdgError } from '../../contracts/errors.js';
import type { RunRow } from '../rows.js';
import type Database from '../sqlite.js';
import { statements } from '../statements.js';
export function runsRepository(db: Database) {
  const statement = statements(db);
  return {
    listIds: (options: { unfinished?: boolean; latest?: boolean }) => statement("SELECT id FROM fdg_runs " + (options.unfinished ? "WHERE state NOT IN ('completed') " : '') + 'ORDER BY created_at DESC LIMIT ?').all(options.latest ? 1 : 50) as { id: string }[],
    claim: (scope: { sources: string[]; generations: Record<string, number> }, row: RunRow, id: string, pid: number, at: string, resume: boolean, acquireLease: (owner: string) => void) => db.transaction(() => {
      for (const source of scope.sources) {
        const generation = statement('SELECT generation FROM fdg_generations WHERE source=?').get(source)?.generation ?? 0;
        if (scope.generations[source] !== undefined && scope.generations[source] !== generation) throw new FdgError('RUN_SUPERSEDED', 'A newer run advanced ' + source);
        if (scope.generations[source] === undefined) { scope.generations[source] = generation + 1; statement('INSERT OR REPLACE INTO fdg_generations VALUES(?,?)').run(source, generation + 1); }
      }
      if (resume) statement('DELETE FROM job_lease WHERE owner=?').run(row.token);
      acquireLease(row.token);
      statement("UPDATE fdg_runs SET state='running',pid=?,heartbeat=?,scope=?,cancel=? WHERE id=?").run(pid, at, JSON.stringify(scope), resume ? 0 : row.cancel, id);
    })(),
    find: (id: string): RunRow | undefined => statement("SELECT * FROM fdg_runs WHERE id=?").get(id) as RunRow | undefined,
    token: (id: string): Pick<RunRow, "token"> | undefined => statement("SELECT token FROM fdg_runs WHERE id=?").get(id) as Pick<RunRow, "token"> | undefined,
    updateScope: (scope: string, id: string) => statement("UPDATE fdg_runs SET scope=? WHERE id=?").run(scope, id),
    create: (id: string, command: string, scope: string, configHash: string, createdAt: string, token: string) => statement("INSERT INTO fdg_runs(id,command,state,scope,config_hash,created_at,token) VALUES(?,?,'queued',?,?,?,?)").run(id, command, scope, configHash, createdAt, token),
    cancel: (id: string) => statement("UPDATE fdg_runs SET cancel=1 WHERE id=?").run(id),
    heartbeat: (at: string, id: string, token: string) => statement("UPDATE fdg_runs SET heartbeat=? WHERE id=? AND token=?").run(at, id, token),
    cancellation: (id: string): Pick<RunRow, "cancel"> | undefined => statement("SELECT cancel FROM fdg_runs WHERE id=?").get(id) as Pick<RunRow, "cancel"> | undefined,
    checkpoint: (checkpoint: string, id: string) => statement("UPDATE fdg_runs SET checkpoint=? WHERE id=?").run(checkpoint, id),
    complete: (state: string, result: string, exitCode: number, at: string, id: string) => statement("UPDATE fdg_runs SET state=?,result=?,exit_code=?,heartbeat=? WHERE id=?").run(state, result, exitCode, at, id),
    fail: (state: string, result: string, exitCode: number, id: string) => statement("UPDATE fdg_runs SET state=?,result=?,exit_code=? WHERE id=?").run(state, result, exitCode, id),
  };
}
export type RunsRepository = ReturnType<typeof runsRepository>;
