import Database from 'better-sqlite3';
import { DateTime } from 'luxon';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Collection, Item, RawResponse } from './types.js';
import { hash, nowIso } from './util.js';

export interface ChannelState { source: string; stream: string; channel: string; cursor: string | null; last_success: string | null; last_attempt: string; next_attempt: string; status: string; notes: string }
export class Store {
  readonly db: Database.Database;
  constructor(readonly path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new Database(path);
    if (path !== ':memory:') chmodSync(path, 0o600);
    const version = this.db.pragma('user_version', { simple: true }) as number;
    if (version === 1 || version === 2) { this.db.close(); throw new Error('Migration required: run feedgarden migrate before opening the legacy database'); }
    if (version > 3) { this.db.close(); throw new Error('Database schema is newer than this application'); }
    this.db.pragma('journal_mode = WAL'); this.db.pragma('foreign_keys = ON'); this.db.pragma('busy_timeout = 5000');
    if (version < 1) this.db.transaction(() => {
      this.db.exec(`
        CREATE TABLE raw_responses(id INTEGER PRIMARY KEY, source TEXT NOT NULL, stream TEXT NOT NULL, channel TEXT NOT NULL, fetched_at TEXT NOT NULL, url TEXT NOT NULL, status INTEGER NOT NULL, headers TEXT NOT NULL, body TEXT NOT NULL, hash TEXT NOT NULL);
        CREATE TABLE items(source TEXT NOT NULL, id TEXT NOT NULL, published_at TEXT NOT NULL, first_seen TEXT NOT NULL, last_seen TEXT NOT NULL, data TEXT NOT NULL, content_hash TEXT NOT NULL, PRIMARY KEY(source,id));
        CREATE INDEX items_period ON items(source,published_at);
        CREATE TABLE item_versions(source TEXT NOT NULL,id TEXT NOT NULL,hash TEXT NOT NULL,data TEXT NOT NULL,observed_at TEXT NOT NULL,PRIMARY KEY(source,id,hash));
        CREATE TABLE observations(id INTEGER PRIMARY KEY,source TEXT NOT NULL,item_id TEXT NOT NULL,stream TEXT NOT NULL,channel TEXT NOT NULL,observed_at TEXT NOT NULL,data TEXT NOT NULL);
        CREATE INDEX observations_period ON observations(source,observed_at);
        CREATE TABLE channel_state(source TEXT NOT NULL,stream TEXT NOT NULL,channel TEXT NOT NULL,cursor TEXT,last_success TEXT,last_attempt TEXT NOT NULL,next_attempt TEXT NOT NULL,status TEXT NOT NULL,notes TEXT NOT NULL,PRIMARY KEY(source,stream,channel));
        CREATE TABLE gaps(id INTEGER PRIMARY KEY,source TEXT NOT NULL,stream TEXT NOT NULL,channel TEXT NOT NULL,at TEXT NOT NULL,details TEXT NOT NULL);
        CREATE TABLE http_cache(url TEXT PRIMARY KEY,response TEXT NOT NULL);
        CREATE TABLE reports(key TEXT PRIMARY KEY,source TEXT NOT NULL,frequency TEXT NOT NULL,date TEXT NOT NULL,snapshot TEXT NOT NULL,copies TEXT NOT NULL,state TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0,error TEXT,updated_at TEXT NOT NULL);
        CREATE TABLE text_cache(key TEXT PRIMARY KEY,copy TEXT NOT NULL);
        CREATE TABLE agent_calls(id INTEGER PRIMARY KEY,at TEXT NOT NULL,report_key TEXT NOT NULL,model TEXT NOT NULL,status TEXT NOT NULL,usage TEXT);
        CREATE TABLE runs(id INTEGER PRIMARY KEY,kind TEXT NOT NULL,started_at TEXT NOT NULL,finished_at TEXT,status TEXT NOT NULL,details TEXT);
        PRAGMA user_version = 1;
      `);
    })();
    if (version < 2) this.db.transaction(() => {
      this.db.exec('CREATE TABLE job_lease(id INTEGER PRIMARY KEY CHECK(id=1),owner TEXT NOT NULL,expires TEXT NOT NULL); PRAGMA user_version=2;');
    })();
    if (version < 3) initializeFeedSchema(this.db, DateTime.now().setZone('Asia/Shanghai').startOf('day').toUTC().toISO()!, false);
  }
  acquireLease(owner: string): void {
    this.db.transaction(() => {
      const lease = this.db.prepare('SELECT owner,expires FROM job_lease WHERE id=1').get() as { owner: string; expires: string } | undefined;
      if (lease && lease.expires > nowIso()) throw new Error('Another Feedgarden job holds the database lease');
      this.db.prepare('INSERT OR REPLACE INTO job_lease VALUES (1,?,?)').run(owner, new Date(Date.now() + 120_000).toISOString());
    })();
  }
  renewLease(owner: string): void { if (this.db.prepare('UPDATE job_lease SET expires=? WHERE id=1 AND owner=?').run(new Date(Date.now() + 120_000).toISOString(), owner).changes !== 1) throw new Error('Lost database job lease'); }
  releaseLease(owner: string): void { this.db.prepare('DELETE FROM job_lease WHERE id=1 AND owner=?').run(owner); }
  close(): void { this.db.close(); }
  channel(source: string, stream: string, channel: string): ChannelState | undefined {
    return this.db.prepare('SELECT * FROM channel_state WHERE source=? AND stream=? AND channel=?').get(source, stream, channel) as ChannelState | undefined;
  }
  cache(url: string): RawResponse | undefined { const row = this.db.prepare('SELECT response FROM http_cache WHERE url=?').get(url) as { response: string } | undefined; return row && JSON.parse(row.response); }
  saveCache(response: RawResponse): void { this.db.prepare('INSERT OR REPLACE INTO http_cache VALUES (?,?)').run(response.url, JSON.stringify(response)); }
  saveCollection(source: string, stream: string, channel: string, result: Collection, nextAttempt: string, attemptedAt = result.coverage.to): void {
    this.db.transaction(() => {
      for (const raw of result.raw) this.db.prepare('INSERT INTO raw_responses(source,stream,channel,fetched_at,url,status,headers,body,hash) VALUES (?,?,?,?,?,?,?,?,?)').run(source, stream, channel, raw.fetchedAt, raw.url, raw.status, JSON.stringify(raw.headers), raw.body, hash(raw.body));
      for (const item of result.items) {
        const contentHash = hash({ title: item.title, text: item.text, url: item.url, author: item.author, ...(item.media?.length ? { media: item.media } : {}) });
        this.db.prepare(`INSERT INTO items VALUES (?,?,?,?,?,?,?) ON CONFLICT(source,id) DO UPDATE SET last_seen=excluded.last_seen,data=excluded.data,content_hash=excluded.content_hash`).run(source, item.id, item.publishedAt, item.observedAt, item.observedAt, JSON.stringify(item), contentHash);
        this.db.prepare('INSERT OR IGNORE INTO item_versions VALUES (?,?,?,?,?)').run(source, item.id, contentHash, JSON.stringify(item), item.observedAt);
        this.db.prepare('INSERT INTO observations(source,item_id,stream,channel,observed_at,data) VALUES (?,?,?,?,?,?)').run(source, item.id, stream, channel, item.observedAt, JSON.stringify(item));
      }
      const previous = this.channel(source, stream, channel);
      const successful = result.coverage.status === 'complete' || result.coverage.status === 'partial';
      this.db.prepare('INSERT OR REPLACE INTO channel_state VALUES (?,?,?,?,?,?,?,?,?)').run(source, stream, channel,
        successful ? result.cursor ?? previous?.cursor ?? null : previous?.cursor ?? null,
        successful ? result.coverage.to : previous?.last_success ?? null, attemptedAt, nextAttempt, result.coverage.status, JSON.stringify(result.coverage.notes));
      if (result.coverage.status !== 'complete') this.db.prepare('INSERT INTO gaps(source,stream,channel,at,details) VALUES (?,?,?,?,?)').run(source, stream, channel, attemptedAt, JSON.stringify(result.coverage));
    })();
  }
  items(source: string, start?: string, end?: string): Item[] {
    const rows = this.db.prepare('SELECT data FROM items WHERE source=? AND published_at>=? AND published_at<? ORDER BY published_at,id').all(source, start ?? '', end ?? '9999') as { data: string }[];
    return rows.map(row => JSON.parse(row.data) as Item);
  }
  observations(source: string, start: string, end: string): Item[] {
    return (this.db.prepare('SELECT data FROM observations WHERE source=? AND observed_at>=? AND observed_at<? ORDER BY observed_at,id').all(source, start, end) as { data: string }[]).map(row => JSON.parse(row.data) as Item);
  }
  states(): ChannelState[] { return this.db.prepare('SELECT * FROM channel_state ORDER BY source,stream,channel').all() as ChannelState[]; }
  meta(key: string): string | undefined { return (this.db.prepare('SELECT value FROM feed_meta WHERE key=?').get(key) as { value: string } | undefined)?.value; }
  setMeta(key: string, value: string): void { this.db.prepare('INSERT OR REPLACE INTO feed_meta VALUES (?,?)').run(key, value); }
  startCall(report: string, model: string, maxDaily: number): number {
    return this.db.transaction(() => {
      const day = nowIso().slice(0, 10);
      const { count } = this.db.prepare('SELECT count(*) AS count FROM agent_calls WHERE at>=?').get(day) as { count: number };
      if (count >= maxDaily) throw new QuotaDeferred(`Agent daily call limit (${maxDaily}) reached; task retained`);
      return Number(this.db.prepare('INSERT INTO agent_calls(at,report_key,model,status) VALUES (?,?,?,?)').run(nowIso(), report, model, 'running').lastInsertRowid);
    })();
  }
  finishCall(id: number, status: string, usage: unknown): void { this.db.prepare('UPDATE agent_calls SET status=?,usage=? WHERE id=?').run(status, JSON.stringify(usage ?? null), id); }
  run(kind: string): number { return Number(this.db.prepare('INSERT INTO runs(kind,started_at,status) VALUES (?,?,?)').run(kind, nowIso(), 'running').lastInsertRowid); }
  finishRun(id: number, status: string, details: unknown): void { this.db.prepare('UPDATE runs SET finished_at=?,status=?,details=? WHERE id=?').run(nowIso(), status, JSON.stringify(details), id); }
  async backup(path: string): Promise<void> { mkdirSync(dirname(path), { recursive: true }); await this.db.backup(path); chmodSync(path, 0o600); }
}
export class QuotaDeferred extends Error {}
export function initializeFeedSchema(db: Database.Database, cutoff: string, excludeExisting = true): void {
  db.transaction(() => {
    db.exec(`
      CREATE TABLE feed_meta(key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE feed_excluded(source TEXT NOT NULL,id TEXT NOT NULL,PRIMARY KEY(source,id));
      CREATE TABLE feed_jobs(source TEXT NOT NULL,id TEXT NOT NULL,cache_key TEXT NOT NULL,data TEXT NOT NULL,state TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,next_at TEXT NOT NULL DEFAULT '',error TEXT,PRIMARY KEY(source,id));
      CREATE INDEX feed_jobs_queue ON feed_jobs(source,state,next_at);
      CREATE TABLE feed_summaries(source TEXT NOT NULL,id TEXT NOT NULL,cache_key TEXT NOT NULL,accepted TEXT NOT NULL,updated TEXT NOT NULL,PRIMARY KEY(source,id));
      CREATE TABLE feed_cache(key TEXT PRIMARY KEY,copy TEXT NOT NULL);
      CREATE TABLE feed_batches(id TEXT PRIMARY KEY,input TEXT NOT NULL,jobs TEXT NOT NULL,workspace TEXT NOT NULL,state TEXT NOT NULL,created_at TEXT NOT NULL,error TEXT);
      PRAGMA user_version=3;
    `);
    db.prepare('INSERT INTO feed_meta VALUES (?,?)').run('cutoff', cutoff);
    db.prepare('INSERT INTO feed_meta VALUES (?,?)').run('round_robin', '');
    if (excludeExisting) db.exec('INSERT INTO feed_excluded SELECT source,id FROM items; DELETE FROM channel_state;');
  })();
}
