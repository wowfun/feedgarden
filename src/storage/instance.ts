import { existsSync } from 'node:fs';
import type { InstanceContext } from '../instance/index.js';
import type { ReadStorage, Storage } from './session.js';
import { Transport } from './transport.js';

import { FdgError } from '../contracts/errors.js';
import { DatabaseSession } from './database.js';
import { initializeSharedTables } from './instance-schema.js';
export function initializeInstance(session: Storage, config: Pick<InstanceContext, 'instanceId'>): void {
  const store = session as DatabaseSession;
  const existing = store.meta('instanceId');
  if (existing && existing !== config.instanceId)
    throw new FdgError('INSTANCE_MISMATCH', 'Selected database belongs to another instance');
  store.db.transaction(() => {
    store.setMeta('instanceId', config.instanceId);
    initializeSharedTables(store.db);
    store.db.exec(`
      CREATE TABLE IF NOT EXISTS fdg_runs(id TEXT PRIMARY KEY,command TEXT NOT NULL,state TEXT NOT NULL,scope TEXT NOT NULL,config_hash TEXT NOT NULL,created_at TEXT NOT NULL,heartbeat TEXT,pid INTEGER,token TEXT NOT NULL,checkpoint TEXT NOT NULL DEFAULT '{}',result TEXT,exit_code INTEGER,cancel INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS fdg_generations(source TEXT PRIMARY KEY,generation INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS fdg_run_tasks(run_id TEXT NOT NULL,source TEXT NOT NULL,id TEXT NOT NULL,version TEXT NOT NULL,PRIMARY KEY(run_id,source,id));
      CREATE TABLE IF NOT EXISTS fdg_inbox(source TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,saved_at TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'pending',PRIMARY KEY(source,id));
      INSERT OR IGNORE INTO fdg_subscriptions SELECT source,id,json_extract(data,'$.stream') FROM items;
      CREATE TABLE IF NOT EXISTS fdg_deletions(target TEXT NOT NULL,path TEXT NOT NULL,PRIMARY KEY(target,path));
      CREATE TABLE IF NOT EXISTS fdg_ingest(seq INTEGER PRIMARY KEY AUTOINCREMENT,source TEXT NOT NULL,id TEXT NOT NULL,UNIQUE(source,id));
      INSERT OR IGNORE INTO fdg_ingest(source,id) SELECT source,id FROM items ORDER BY first_seen,source,id;
      CREATE TRIGGER IF NOT EXISTS fdg_ingest_insert AFTER INSERT ON items BEGIN INSERT OR IGNORE INTO fdg_ingest(source,id) VALUES(NEW.source,NEW.id); END;
      CREATE VIRTUAL TABLE IF NOT EXISTS fdg_search USING fts5(source UNINDEXED,id UNINDEXED,body,tokenize='unicode61');
      CREATE TABLE IF NOT EXISTS fdg_search_versions(source TEXT NOT NULL,id TEXT NOT NULL,hash TEXT NOT NULL,PRIMARY KEY(source,id));
    `);
    store.setMeta('fdg_schema', '1');
  })();
}
export function openInstance(config: InstanceContext, readonly: true): ReadStorage;
export function openInstance(config: InstanceContext, readonly?: false): Storage;
export function openInstance(config: InstanceContext, readonly = false): Storage {
  const path = config.paths.database;
  if (!existsSync(path))
    throw new FdgError('NOT_INITIALIZED', 'Selected database does not exist; setup or upgrade explicitly');
  // Inspect before opening a writer, so ordinary commands never upgrade old stores.
  const reader = new DatabaseSession(path, { readonly: true });
  try {
    if (reader.meta('instanceId') !== config.instanceId)
      throw new FdgError('INSTANCE_MISMATCH', 'Configuration and database instance IDs differ');
    if (reader.meta('fdg_schema') !== '1')
      throw new FdgError('UPGRADE_REQUIRED', 'Explicit instance upgrade required');
    if (readonly) return reader;
  } catch (error) {
    reader.close();
    throw error;
  }
  reader.close();
  const store = new DatabaseSession(path);
  store.transport = new Transport(config.paths.transport);
  return store;
}

export function migrateInstance(session: Storage, config: Pick<InstanceContext, 'instanceId'>, rewriteWorkspace: (workspace: string) => string): void {
  const store = session as DatabaseSession;
  store.db.transaction(() => {
    initializeInstance(store, config); for (const table of ['feed_batches', 'feed_tasks']) {
      for (const row of store.statement('SELECT rowid,workspace FROM ' + table).all() as { rowid: number; workspace: string }[]) {
        store.statement('UPDATE ' + table + ' SET workspace=? WHERE rowid=?').run(rewriteWorkspace(row.workspace), row.rowid);
      }
    }
  })();
}
