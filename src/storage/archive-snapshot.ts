import { chmodSync } from 'node:fs';
import Database from './sqlite.js';
export class ArchiveSnapshot {
  private readonly db: Database;
  constructor(path: string) {
    this.db = new Database(path); chmodSync(path, 0o600);
    this.db.exec('CREATE TABLE files(path TEXT PRIMARY KEY,body BLOB NOT NULL); CREATE TABLE posts(path TEXT PRIMARY KEY,source TEXT,id TEXT,day TEXT,number INTEGER,item TEXT,en TEXT,zh TEXT)');
  }
  saveFile(path: string, body: Buffer): void { this.db.prepare('INSERT INTO files VALUES (?,?)').run(path, body); }
  file(path: string): Buffer | undefined { return (this.db.prepare('SELECT body FROM files WHERE path=?').get(path) as { body: Buffer } | undefined)?.body; }
  savePost(path: string, source: string, id: string, day: string, number: number, item: string, en: string, zh: string): void { this.db.prepare('INSERT INTO posts VALUES (?,?,?,?,?,?,?,?)').run(path, source, id, day, number, item, en, zh); }
  removeFile(path: string): void { this.db.prepare('DELETE FROM files WHERE path=?').run(path); }
  translations(path: string): { en: string; zh: string } | undefined { return this.db.prepare('SELECT en,zh FROM posts WHERE path=?').get(path); }
  close(): void { this.db.close(); }
}
