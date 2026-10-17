import Database from 'better-sqlite3';
import { DateTime } from 'luxon';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Collection, Item, RawResponse, RankingObservation, Metrics } from './types.js';
import { rankingObservation } from './scoring.js';
import { hash, nowIso, iso } from './util.js';

export interface ChannelState { source: string; stream: string; channel: string; cursor: string | null; last_success: string | null; last_attempt: string; next_attempt: string; status: string; notes: string }
export class Store {
  readonly db: Database.Database;
  private leaseOwner?: string;
  private readonly statements = new Map<string, Database.Statement>();
  statement(sql: string): Database.Statement {
    let statement = this.statements.get(sql);
    if (!statement) { statement = this.db.prepare(sql); this.statements.set(sql, statement); }
    return statement;
  }
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
    if (version < 3) initializeFeedSchema(this.db, iso(DateTime.now().setZone('Asia/Shanghai').startOf('day').toUTC()), false);
    this.db.transaction(() => {
      this.db.exec('CREATE INDEX IF NOT EXISTS agent_calls_at ON agent_calls(at); CREATE INDEX IF NOT EXISTS items_first_seen ON items(source,first_seen,id);');
      this.db.exec('CREATE INDEX IF NOT EXISTS items_selection_published ON items(source,julianday(published_at),id); CREATE INDEX IF NOT EXISTS items_selection_seen ON items(source,julianday(first_seen),id);');
      this.db.exec("CREATE INDEX IF NOT EXISTS feed_jobs_pending_order ON feed_jobs(source,json_extract(data,'$.firstSeen'),id,next_at) WHERE state='pending' AND attempts<5;");
      this.db.exec('CREATE INDEX IF NOT EXISTS raw_responses_fingerprint ON raw_responses(source,stream,channel,url,hash,status);');
      this.db.exec('CREATE TABLE IF NOT EXISTS feed_item_paths(source TEXT NOT NULL,id TEXT NOT NULL,day TEXT NOT NULL,number INTEGER NOT NULL CHECK(number>0),PRIMARY KEY(source,id,day),UNIQUE(source,day,number));');
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS feed_rankings(source TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,observed_at TEXT NOT NULL,PRIMARY KEY(source,id));
        CREATE TABLE IF NOT EXISTS feed_rank_snapshots(source TEXT NOT NULL,stream TEXT NOT NULL,window TEXT NOT NULL,observed_at TEXT NOT NULL,PRIMARY KEY(source,stream,window));
        CREATE TABLE IF NOT EXISTS feed_selection(source TEXT NOT NULL,id TEXT NOT NULL,day TEXT NOT NULL,selected INTEGER NOT NULL CHECK(selected IN (0,1)),score REAL,method TEXT NOT NULL,scored_at TEXT,PRIMARY KEY(source,id));
        CREATE INDEX IF NOT EXISTS feed_selection_day ON feed_selection(source,day,selected);
        CREATE TABLE IF NOT EXISTS feed_selection_days(source TEXT NOT NULL,day TEXT NOT NULL,policy TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(source,day));
        CREATE TABLE IF NOT EXISTS feed_archives(path TEXT PRIMARY KEY,source TEXT NOT NULL,id TEXT,day TEXT NOT NULL,number INTEGER NOT NULL,item TEXT,en TEXT NOT NULL,zh TEXT NOT NULL);
        CREATE UNIQUE INDEX IF NOT EXISTS feed_archives_identity ON feed_archives(source,id) WHERE id IS NOT NULL;
        CREATE TABLE IF NOT EXISTS feed_archive_files(path TEXT PRIMARY KEY,body BLOB NOT NULL);
      `);
      // Collection changes enqueue planning; planning consumes or reschedules
      // each row after enrichment. Accepted content/exclusion changes bump the
      // render signature; removing a job or accepted copy re-enqueues its item.
      // These invariants also apply to maintenance writers outside summarize().
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS feed_planning(source TEXT NOT NULL,id TEXT NOT NULL,due_at TEXT NOT NULL,PRIMARY KEY(source,id));
        CREATE INDEX IF NOT EXISTS feed_planning_due ON feed_planning(source,due_at,id);
        CREATE TABLE IF NOT EXISTS enrichment_extractions(key TEXT PRIMARY KEY,body_hash TEXT NOT NULL,data TEXT NOT NULL);
        INSERT OR IGNORE INTO feed_meta VALUES ('content_version','0');
        CREATE TRIGGER IF NOT EXISTS feed_plan_insert AFTER INSERT ON items BEGIN
          INSERT INTO feed_planning VALUES (NEW.source,NEW.id,'') ON CONFLICT(source,id) DO UPDATE SET due_at='';
        END;
        CREATE TRIGGER IF NOT EXISTS feed_plan_update AFTER UPDATE ON items
        WHEN OLD.content_hash IS NOT NEW.content_hash OR OLD.first_seen IS NOT NEW.first_seen
          OR json_remove(OLD.data,'$.observedAt') IS NOT json_remove(NEW.data,'$.observedAt') BEGIN
          INSERT INTO feed_planning VALUES (NEW.source,NEW.id,'') ON CONFLICT(source,id) DO UPDATE SET due_at='';
        END;
        CREATE TRIGGER IF NOT EXISTS feed_plan_job_delete AFTER DELETE ON feed_jobs BEGIN
          INSERT INTO feed_planning VALUES (OLD.source,OLD.id,'') ON CONFLICT(source,id) DO UPDATE SET due_at='';
        END;
        CREATE TRIGGER IF NOT EXISTS feed_content_insert AFTER INSERT ON feed_summaries BEGIN
          UPDATE feed_meta SET value=CAST(value AS INTEGER)+1 WHERE key='content_version';
        END;
        CREATE TRIGGER IF NOT EXISTS feed_content_update AFTER UPDATE ON feed_summaries WHEN OLD.accepted IS NOT NEW.accepted BEGIN
          UPDATE feed_meta SET value=CAST(value AS INTEGER)+1 WHERE key='content_version';
        END;
        CREATE TRIGGER IF NOT EXISTS feed_content_delete AFTER DELETE ON feed_summaries BEGIN
          UPDATE feed_meta SET value=CAST(value AS INTEGER)+1 WHERE key='content_version';
          INSERT INTO feed_planning VALUES (OLD.source,OLD.id,'') ON CONFLICT(source,id) DO UPDATE SET due_at='';
        END;
        CREATE TRIGGER IF NOT EXISTS feed_excluded_insert AFTER INSERT ON feed_excluded BEGIN
          UPDATE feed_meta SET value=CAST(value AS INTEGER)+1 WHERE key='content_version';
        END;
        CREATE TRIGGER IF NOT EXISTS feed_excluded_delete AFTER DELETE ON feed_excluded BEGIN
          UPDATE feed_meta SET value=CAST(value AS INTEGER)+1 WHERE key='content_version';
          INSERT INTO feed_planning VALUES (OLD.source,OLD.id,'') ON CONFLICT(source,id) DO UPDATE SET due_at='';
        END;
      `);
      if (this.meta('items_date_revision') !== '1') {
        this.db.exec("UPDATE items SET published_at=json_extract(data,'$.publishedAt') WHERE typeof(json_extract(data,'$.publishedAt'))='text' AND published_at IS NOT json_extract(data,'$.publishedAt');");
        this.setMeta('items_date_revision', '1');
      }
    })();
  }
  acquireLease(owner: string): void {
    this.db.transaction(() => {
      const lease = this.statement('SELECT owner,expires FROM job_lease WHERE id=1').get() as { owner: string; expires: string } | undefined;
      if (lease && lease.expires > nowIso()) throw new Error('Another Feedgarden job holds the database lease');
      this.statement('INSERT OR REPLACE INTO job_lease VALUES (1,?,?)').run(owner, new Date(Date.now() + 120_000).toISOString());
    })();
    this.leaseOwner = owner;
  }
  renewLease(owner: string): void { if (this.statement('UPDATE job_lease SET expires=? WHERE id=1 AND owner=? AND expires>?').run(new Date(Date.now() + 120_000).toISOString(), owner, nowIso()).changes !== 1) throw new Error('Lost database job lease'); }
  assertLease(): void { if (this.leaseOwner) this.renewLease(this.leaseOwner); }
  watchLease(owner: string, cancellation: AbortController): NodeJS.Timeout {
    const timer = setInterval(() => {
      if (cancellation.signal.aborted) return;
      try { this.renewLease(owner); } catch (error) { cancellation.abort(error); }
    }, 30_000);
    timer.unref();
    return timer;
  }
  releaseLease(owner: string): void { this.statement('DELETE FROM job_lease WHERE id=1 AND owner=?').run(owner); if (this.leaseOwner === owner) this.leaseOwner = undefined; }
  close(): void { this.statements.clear(); this.db.close(); }
  channel(source: string, stream: string, channel: string): ChannelState | undefined {
    return this.statement('SELECT * FROM channel_state WHERE source=? AND stream=? AND channel=?').get(source, stream, channel) as ChannelState | undefined;
  }
  cache(url: string): RawResponse | undefined { const row = this.statement('SELECT response FROM http_cache WHERE url=?').get(url) as { response: string } | undefined; return row && JSON.parse(row.response); }
  cacheHeaders(url: string): Record<string, string> | undefined {
    const row = this.statement("SELECT json_extract(response,'$.headers') headers FROM http_cache WHERE url=?").get(url) as { headers: string } | undefined;
    return row && JSON.parse(row.headers);
  }
  extracted<T>(key: string, body: string, parse: () => T): T {
    const digest = hash(body), row = this.statement('SELECT body_hash,data FROM enrichment_extractions WHERE key=?').get(key) as { body_hash: string; data: string } | undefined;
    if (row?.body_hash === digest) return JSON.parse(row.data) as T;
    const result = parse();
    this.statement('INSERT OR REPLACE INTO enrichment_extractions VALUES (?,?,?)').run(key, digest, JSON.stringify(result));
    return result;
  }
  saveCache(response: RawResponse): void { this.statement('INSERT OR REPLACE INTO http_cache VALUES (?,?)').run(response.url, JSON.stringify(response)); }
  saveRaw(source: string, stream: string, channel: string, raw: RawResponse): void {
    const headers = JSON.stringify(raw.headers), digest = hash(raw.body);
    // Keep distinct representations and response metadata, without appending
    // another full body for an identical response. Existing evidence stays intact.
    this.statement(`INSERT INTO raw_responses(source,stream,channel,fetched_at,url,status,headers,body,hash)
      SELECT ?,?,?,?,?,?,?,?,? WHERE NOT EXISTS
      (SELECT 1 FROM raw_responses WHERE source=? AND stream=? AND channel=? AND url=? AND hash=? AND status=? AND headers=?)`).run(
      source, stream, channel, raw.fetchedAt, raw.url, raw.status, headers, raw.body, digest,
      source, stream, channel, raw.url, digest, raw.status, headers);
  }
  saveCollection(source: string, stream: string, channel: string, result: Collection, nextAttempt: string, attemptedAt = result.coverage.to): void {
    const upsertItem = this.statement('INSERT INTO items VALUES (?,?,?,?,?,?,?) ON CONFLICT(source,id) DO UPDATE SET published_at=excluded.published_at,last_seen=excluded.last_seen,data=excluded.data,content_hash=excluded.content_hash');
    const insertVersion = this.statement('INSERT OR IGNORE INTO item_versions VALUES (?,?,?,?,?)');
    const insertObservation = this.statement('INSERT INTO observations(source,item_id,stream,channel,observed_at,data) VALUES (?,?,?,?,?,?)');
    this.db.transaction(() => {
      for (const raw of result.raw) this.saveRaw(source, stream, channel, raw);
      for (const item of result.items) {
        const ranking = rankingObservation(item);
        const data = JSON.stringify(ranking ? { ...item, ranking } : item);
        const contentHash = hash({ title: item.title, text: item.text, url: item.url, author: item.author, ...(item.media?.length ? { media: item.media } : {}) });
        upsertItem.run(source, item.id, item.publishedAt, item.observedAt, item.observedAt, data, contentHash);
        insertVersion.run(source, item.id, contentHash, data, item.observedAt);
        insertObservation.run(source, item.id, stream, channel, item.observedAt, data);
        if (ranking) this.saveRanking(source, item.id, ranking);
      }
      if (result.ranking && (result.coverage.status === 'complete' || result.coverage.status === 'partial')) this.saveRankSnapshot(source, stream, result.ranking.window, result.coverage.to);
      const previous = this.channel(source, stream, channel);
      const successful = result.coverage.status === 'complete' || result.coverage.status === 'partial';
      this.statement('INSERT OR REPLACE INTO channel_state VALUES (?,?,?,?,?,?,?,?,?)').run(source, stream, channel,
        successful ? result.cursor ?? previous?.cursor ?? null : previous?.cursor ?? null,
        successful ? result.coverage.to : previous?.last_success ?? null, attemptedAt, nextAttempt, result.coverage.status, JSON.stringify(result.coverage.notes));
      if (result.coverage.status !== 'complete') this.statement('INSERT INTO gaps(source,stream,channel,at,details) VALUES (?,?,?,?,?)').run(source, stream, channel, attemptedAt, JSON.stringify(result.coverage));
    })();
  }
  saveRanking(source: string, id: string, ranking: RankingObservation): boolean {
    if (!Number.isFinite(ranking.score)) throw new Error('Invalid selection score');
    const observedAt = new Date(ranking.observedAt).toISOString();
    return this.statement('INSERT INTO feed_rankings VALUES (?,?,?,?) ON CONFLICT(source,id) DO UPDATE SET data=excluded.data,observed_at=excluded.observed_at WHERE julianday(excluded.observed_at)>=julianday(feed_rankings.observed_at)').run(source, id, JSON.stringify({ ...ranking, observedAt }), observedAt).changes === 1;
  }
  saveRankSnapshot(source: string, stream: string, window: string, observedAt: string): void {
    this.statement('INSERT INTO feed_rank_snapshots VALUES (?,?,?,?) ON CONFLICT(source,stream,window) DO UPDATE SET observed_at=excluded.observed_at WHERE excluded.observed_at>=feed_rank_snapshots.observed_at').run(source, stream, window, observedAt);
  }
  private currentRankingItem(source: string, id: string, observedAt: string): Item | undefined {
    const row = this.statement('SELECT i.data,r.observed_at FROM items i LEFT JOIN feed_rankings r ON r.source=i.source AND r.id=i.id WHERE i.source=? AND i.id=?').get(source, id) as { data: string; observed_at: string | null } | undefined;
    if (!row) return;
    const item = JSON.parse(row.data) as Item, incoming = new Date(observedAt).getTime();
    if (!Number.isFinite(incoming)) throw new Error('Invalid ranking observation timestamp');
    // Cached evidence must not restore an older metric or inactive state after
    // a more recent collection, ranking observation or deletion check.
    const timestamps = [row.observed_at, item.observedAt, item.ranking?.observedAt, item.metadata?.rankingInactiveAt];
    if (timestamps.some(timestamp => typeof timestamp === 'string' && Date.parse(timestamp) > incoming)) return;
    return item;
  }
  updateRankingItem(source: string, id: string, ranking: RankingObservation, metrics: Metrics): boolean {
    const update = () => {
      const item = this.currentRankingItem(source, id, ranking.observedAt);
      if (!item || !this.saveRanking(source, id, ranking)) return false;
      const metadata = { ...item.metadata }; delete metadata.rankingInactive; delete metadata.rankingInactiveAt;
      this.statement('UPDATE items SET data=? WHERE source=? AND id=?').run(JSON.stringify({ ...item, metrics: { ...item.metrics, ...metrics }, ranking: { ...ranking, observedAt: new Date(ranking.observedAt).toISOString() }, metadata }), source, id);
      return true;
    };
    return this.db.inTransaction ? update() : this.db.transaction(() => { this.assertLease(); return update(); })();
  }
  markRankingInactive(source: string, id: string, observedAt: string): boolean {
    const update = () => {
      const item = this.currentRankingItem(source, id, observedAt);
      if (!item) return false;
      this.statement('UPDATE items SET data=? WHERE source=? AND id=?').run(JSON.stringify({ ...item, metadata: { ...item.metadata, rankingInactive: true, rankingInactiveAt: new Date(observedAt).toISOString() } }), source, id);
      return true;
    };
    return this.db.inTransaction ? update() : this.db.transaction(() => { this.assertLease(); return update(); })();
  }
  isSelected(source: string, id: string, existing = false): boolean {
    if (!this.meta('selection_policy:' + source)) return true;
    const row = this.statement('SELECT selected FROM feed_selection WHERE source=? AND id=?').get(source, id) as { selected: number } | undefined;
    return row ? row.selected === 1 : existing;
  }
  items(source: string, start?: string, end?: string): Item[] {
    const clauses = [start ? 'julianday(published_at)>=julianday(?)' : '', end ? 'julianday(published_at)<julianday(?)' : ''].filter(Boolean);
    const args = [source, ...(start ? [start] : []), ...(end ? [end] : [])];
    const rows = this.statement(`SELECT data FROM items WHERE source=? ${clauses.length ? 'AND ' + clauses.join(' AND ') : ''} ORDER BY julianday(published_at),id`).all(...args) as { data: string }[];
    return rows.map(row => JSON.parse(row.data) as Item);
  }
  states(): ChannelState[] { return this.statement('SELECT * FROM channel_state ORDER BY source,stream,channel').all() as ChannelState[]; }
  meta(key: string): string | undefined { return (this.statement('SELECT value FROM feed_meta WHERE key=?').get(key) as { value: string } | undefined)?.value; }
  setMeta(key: string, value: string): void { this.statement('INSERT OR REPLACE INTO feed_meta VALUES (?,?)').run(key, value); }
  itemNumber(source: string, id: string, day: string): number {
    return this.db.transaction(() => {
      const existing = this.statement('SELECT number FROM feed_item_paths WHERE source=? AND id=? AND day=?').get(source, id, day) as { number: number } | undefined;
      if (existing) return existing.number;
      const { number } = this.statement('SELECT COALESCE(MAX(number),0)+1 AS number FROM feed_item_paths WHERE source=? AND day=?').get(source, day) as { number: number };
      this.statement('INSERT INTO feed_item_paths VALUES (?,?,?,?)').run(source, id, day, number);
      return number;
    })();
  }
  startCall(report: string, model: string, maxDaily: number): number {
    return this.db.transaction(() => {
      const day = nowIso().slice(0, 10);
      const { count } = this.statement('SELECT count(*) AS count FROM agent_calls WHERE at>=?').get(day) as { count: number };
      if (count >= maxDaily) throw new QuotaDeferred(`Agent daily call limit (${maxDaily}) reached; task retained`);
      return Number(this.statement('INSERT INTO agent_calls(at,report_key,model,status) VALUES (?,?,?,?)').run(nowIso(), report, model, 'running').lastInsertRowid);
    })();
  }
  finishCall(id: number, status: string, usage: unknown): void { this.statement('UPDATE agent_calls SET status=?,usage=? WHERE id=?').run(status, JSON.stringify(usage ?? null), id); }
  run(kind: string): number { return Number(this.statement('INSERT INTO runs(kind,started_at,status) VALUES (?,?,?)').run(kind, nowIso(), 'running').lastInsertRowid); }
  finishRun(id: number, status: string, details: unknown): void { this.statement('UPDATE runs SET finished_at=?,status=?,details=? WHERE id=?').run(nowIso(), status, JSON.stringify(details), id); }
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
