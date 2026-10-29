import Database from './sqlite.js';
export async function backupDatabase(source: string, destination: string): Promise<void> { const db = new Database(source, { readonly: true, fileMustExist: true }); try { await db.backup(destination); } finally { db.close(); } }
