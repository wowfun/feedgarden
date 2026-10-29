import type Database from './sqlite.js';

/** Shared by core stores and explicit instance initialization/upgrades. */
export function initializeSharedTables(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS fdg_subscriptions(source TEXT NOT NULL,id TEXT NOT NULL,subscription TEXT NOT NULL,PRIMARY KEY(source,id,subscription));
    CREATE TABLE IF NOT EXISTS fdg_admissions(source TEXT NOT NULL,id TEXT NOT NULL,accepted_at TEXT,PRIMARY KEY(source,id));
    CREATE TABLE IF NOT EXISTS fdg_attempts(id TEXT PRIMARY KEY,task TEXT NOT NULL,model TEXT NOT NULL,workspace TEXT NOT NULL,input_hash TEXT NOT NULL,state TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS fdg_model_cooldowns(backend TEXT NOT NULL,account TEXT NOT NULL,model TEXT NOT NULL,retry_at TEXT NOT NULL,PRIMARY KEY(backend,account,model));
  `);
}
