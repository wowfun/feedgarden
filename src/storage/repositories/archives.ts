import type Database from '../sqlite.js';
import { statements } from '../statements.js';
export function archivesRepository(db: Database) {
  const statement = statements(db);
  return {
    recordIssue: (source: string, stream: string, channel: string, at: string, details: string) => statement("INSERT INTO gaps(source,stream,channel,at,details) VALUES (?,?,?,?,?)").run(source, stream, channel, at, details),
    legacyMarker: (): object | undefined => statement("SELECT 1 FROM feed_meta WHERE key GLOB 'selection_archives:*' LIMIT 1").get() as object | undefined,
    reservedNumber: (source: string, id: string, day: string): { number: number } | undefined => statement("SELECT number FROM feed_item_paths WHERE source=? AND id=? AND day=?").get(source, id, day) as { number: number } | undefined,
    reservedId: (source: string, day: string, number: number): { id: string } | undefined => statement("SELECT id FROM feed_item_paths WHERE source=? AND day=? AND number=?").get(source, day, number) as { id: string } | undefined,
    reservedIdentity: (source: string, day: string, number: number): { source: string; id: string } | undefined => statement("SELECT source,id FROM feed_item_paths WHERE source=? AND day=? AND number=?").get(source, day, number) as { source: string; id: string } | undefined,
    reserve: (source: string, id: string, day: string, number: number) => statement("INSERT OR IGNORE INTO feed_item_paths VALUES (?,?,?,?)").run(source, id, day, number),
    preserveItem: (source: string, id: string, publishedAt: string, firstSeen: string, lastSeen: string, data: string, hash: string) => statement("INSERT OR IGNORE INTO items VALUES (?,?,?,?,?,?,?)").run(source, id, publishedAt, firstSeen, lastSeen, data, hash),
    generatedPath: (source: string, day: string, number: number): { source: string; id: string; day: string; number: number } | undefined => statement("SELECT p.* FROM feed_item_paths p WHERE p.source=? AND p.day=? AND p.number=? AND EXISTS(SELECT 1 FROM feed_summaries f WHERE f.source=p.source AND f.id=p.id)").get(source, day, number) as { source: string; id: string; day: string; number: number } | undefined,
    identity: (path: string): { source: string; id: string; day: string; number: number } | undefined => statement("SELECT source,id,day,number FROM feed_archives WHERE path=?").get(path) as { source: string; id: string; day: string; number: number } | undefined,
    hasFile: (path: string): object | undefined => statement("SELECT 1 FROM feed_archive_files WHERE path=?").get(path) as object | undefined,
    pathForIdentity: (source: string, id: string): { path: string } | undefined => statement("SELECT path FROM feed_archives WHERE source=? AND id=?").get(source, id) as { path: string } | undefined,
    reservations: (source: string, day: string, id: string, number: number): { id: string; number: number }[] => statement("SELECT id,number FROM feed_item_paths WHERE source=? AND day=? AND (id=? OR number=?)").all(source, day, id, number) as { id: string; number: number }[],
    exclude: (source: string, id: string) => statement("INSERT OR IGNORE INTO feed_excluded VALUES (?,?)").run(source, id),
    removeFile: (path: string) => statement("DELETE FROM feed_archive_files WHERE path=?").run(path),
    removePlaceholder: (source: string, day: string, number: number, id: string) => statement("DELETE FROM feed_item_paths WHERE source=? AND day=? AND number=? AND id=?").run(source, day, number, id),
    updatePost: (path: string, source: string, id: string, day: string, number: number, item: string, en: string, zh: string) => statement("INSERT INTO feed_archives VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(path) DO UPDATE SET en=excluded.en,zh=excluded.zh").run(path, source, id, day, number, item, en, zh),
    updateFile: (body: Buffer | undefined, path: string) => statement("UPDATE feed_archive_files SET body=? WHERE path=?").run(body, path),
    post: (path: string): { source: string; id: string; en: string; zh: string } | undefined => statement("SELECT source,id,en,zh FROM feed_archives WHERE path=?").get(path) as { source: string; id: string; en: string; zh: string } | undefined,
    preservePost: (path: string, source: string, id: string, day: string, number: number, item: string, en: string, zh: string) => statement("INSERT OR IGNORE INTO feed_archives VALUES(?,?,?,?,?,?,?,?)").run(path, source, id, day, number, item, en, zh),
    file: (path: string): { body: Buffer } | undefined => statement("SELECT body FROM feed_archive_files WHERE path=?").get(path) as { body: Buffer } | undefined,
    preserveFile: (path: string, body: Buffer) => statement("INSERT OR IGNORE INTO feed_archive_files VALUES(?,?)").run(path, body),
  };
}
export type ArchivesRepository = ReturnType<typeof archivesRepository>;
