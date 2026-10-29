import type Database from './sqlite.js';
import type { Statement } from './sqlite.js';
/** Lazy preparation also permits read-only sessions to open older schemas for explicit migration. */
export function statements(db: Database): (sql: string) => Statement { const cached = new Map<string, Statement>(); return sql => { let statement = cached.get(sql); if (!statement) { statement = db.prepare(sql); cached.set(sql, statement); } return statement; }; }
