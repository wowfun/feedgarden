import Database from './sqlite.js';
/** Minimal startup path: no schema initialization, source parsers or model SDKs. */
export function acknowledgeWorker(path: string, identity: { id: string; token: string; instanceId: string; pid: number }, alive: (pid: number) => boolean): void {
  const db = new Database(path, { fileMustExist: true });
  try {
    db.transaction(() => {
      const row = db.prepare('SELECT token,scope,pid,state FROM fdg_runs WHERE id=?').get(identity.id);
      if (row?.token !== identity.token || JSON.parse(row.scope).instanceId !== identity.instanceId) throw new Error('Worker ownership mismatch');
      if (row.pid && row.pid !== identity.pid && ['queued', 'running'].includes(row.state) && alive(row.pid)) throw new Error('Run already has a live worker');
      db.prepare('UPDATE fdg_runs SET pid=?,heartbeat=? WHERE id=? AND token=?').run(identity.pid, new Date().toISOString(), identity.id, identity.token);
    })();
  } finally { db.close(); }
}
