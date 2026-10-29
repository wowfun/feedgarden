import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { FdgError } from '../contracts/errors.js';
import Database from './sqlite.js';
export class Transport {
  private db?: Database;
  private closed = false;
  constructor(readonly path: string) { }
  private use<T>(fn: (db: Database) => T): T {
    if (this.closed) throw new Error('Transport is closed');
    if (!this.db) {
      mkdirSync(dirname(this.path), { recursive: true, mode: 0o700 });
      const db = new Database(this.path);
      try {
        db.pragma('journal_mode = WAL');
        db.pragma('busy_timeout = 5000');
        db.exec(
          'CREATE TABLE IF NOT EXISTS hosts(host TEXT PRIMARY KEY,next_at INTEGER NOT NULL,cooldown INTEGER NOT NULL)',
        );
        this.db = db;
      } catch (error) { db.close(); throw error; }
    }
    return fn(this.db);
  }
  close(): void { this.db?.close(); this.db = undefined; this.closed = true; }
  reserve(host: string, spacing: number): number {
    return this.use((db) =>
      db.transaction(() => {
        const row = db.prepare('SELECT * FROM hosts WHERE host=?').get(host),
          now = Date.now();
        if (row?.cooldown > now)
          throw new FdgError(
            'SOURCE_RATE_LIMITED',
            'Source is cooling down',
            new Date(row.cooldown).toISOString(),
          );
        const next = Math.max(now, row?.next_at ?? 0);
        // Do not leave an agent waiting through a long queue.
        if (next - now > 60000)
          throw new FdgError('SOURCE_RATE_LIMITED', 'Source pacing is busy', new Date(next).toISOString());
        db.prepare(
          'INSERT INTO hosts VALUES(?,?,0) ON CONFLICT(host) DO UPDATE SET next_at=excluded.next_at',
        ).run(host, next + spacing);
        return next - now;
      }).immediate(),
    );
  }
  cooldown(host: string, until: string): void {
    this.use((db) =>
      db
        .prepare(
          'INSERT INTO hosts VALUES(?,0,?) ON CONFLICT(host) DO UPDATE SET cooldown=MAX(cooldown,excluded.cooldown)',
        )
        .run(host, Date.parse(until)),
    );
  }
}
