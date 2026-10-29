import type { SummaryRow } from '../rows.js';
import { publicationClause, selectionClause } from '../selection-sql.js';
import type Database from '../sqlite.js';
import { statements } from '../statements.js';
export function projectionsRepository(db: Database) {
  const statement = statements(db);
  return {
    unpublished: () => statement(`SELECT f.source,f.id,json_extract(f.accepted,'$.item') item,json_extract(f.accepted,'$.firstSeen') first_seen FROM feed_summaries f
    WHERE NOT EXISTS(SELECT 1 FROM feed_publications p WHERE p.source=f.source AND p.id=f.id)
    AND NOT EXISTS(SELECT 1 FROM feed_excluded e WHERE e.source=f.source AND e.id=f.id) AND ${selectionClause('f', true)}
    UNION ALL SELECT a.source,a.id,a.item,i.first_seen FROM feed_archives a JOIN items i ON i.source=a.source AND i.id=a.id
    WHERE NOT EXISTS(SELECT 1 FROM feed_publications p WHERE p.source=a.source AND p.id=a.id)
    AND NOT EXISTS(SELECT 1 FROM feed_summaries f WHERE f.source=a.source AND f.id=a.id)
    AND NOT EXISTS(SELECT 1 FROM feed_excluded e WHERE e.source=a.source AND e.id=a.id) AND ${selectionClause('a', true)} ORDER BY source,id`).iterate() as IterableIterator<{ source: string; id: string; item: string; first_seen: string }>,
    archived: () => statement(`SELECT a.path,a.source,a.id,a.item,i.first_seen,a.en,a.zh,p.id IS NOT NULL AS published FROM feed_archives a JOIN items i ON i.source=a.source AND i.id=a.id LEFT JOIN feed_summaries f ON f.source=a.source AND f.id=a.id LEFT JOIN feed_excluded e ON e.source=a.source AND e.id=a.id LEFT JOIN feed_publications p ON p.source=a.source AND p.id=a.id WHERE f.id IS NULL AND e.id IS NULL AND ${publicationClause('a', 'p')} ORDER BY a.path`).iterate() as IterableIterator<{ path: string; source: string; id: string; item: string; first_seen: string; en: string; zh: string; published: number }>,
    acceptedPage: (source: string, id: string) => statement(`SELECT f.source,f.id,f.accepted,p.id IS NOT NULL AS published FROM feed_summaries f LEFT JOIN feed_excluded e ON e.source=f.source AND e.id=f.id LEFT JOIN feed_publications p ON p.source=f.source AND p.id=f.id WHERE e.id IS NULL AND ${publicationClause('f', 'p')} AND (f.source,f.id)>(?,?) ORDER BY f.source,f.id LIMIT 128`).all(source, id) as { source: string; id: string; accepted: string; published: number }[],
    archiveFiles: (): IterableIterator<{ path: string; body: Buffer }> => statement("SELECT path,body FROM feed_archive_files").iterate() as IterableIterator<{ path: string; body: Buffer }>,
    archiveMarkdown: (): IterableIterator<{ path: string; body: Buffer }> => statement("SELECT path,body FROM feed_archive_files WHERE substr(path,-3)='.md'").iterate() as IterableIterator<{ path: string; body: Buffer }>,
    orderedFiles: (): IterableIterator<{ path: string; body: Buffer }> => statement("SELECT path,body FROM feed_archive_files ORDER BY path").iterate() as IterableIterator<{ path: string; body: Buffer }>,
    summaries: (): Pick<SummaryRow, "source" | "id" | "cache_key" | "accepted">[] => statement("SELECT source,id,cache_key,accepted FROM feed_summaries ORDER BY source,id").all() as Pick<SummaryRow, "source" | "id" | "cache_key" | "accepted">[],
    nativePaths: (): { source: string; id: string; day: string; number: number }[] => statement("SELECT source,id,day,number FROM feed_item_paths WHERE id NOT LIKE 'archive:%'").all() as { source: string; id: string; day: string; number: number }[],
    publish: (source: string, id: string) => statement("INSERT OR IGNORE INTO feed_publications VALUES (?,?)").run(source, id),
    removePublication: (source: string, id: string) => statement("DELETE FROM feed_publications WHERE source=? AND id=?").run(source, id),
    relationKeys: (at: string): { key: string }[] => statement("SELECT key FROM feed_relation_pairs WHERE expires_at>?").all(at) as { key: string }[],
    saveRelation: (key: string, leftPath: string, rightPath: string, leftHash: string, rightHash: string, output: string, expiresAt: string) => statement("INSERT OR REPLACE INTO feed_relation_pairs VALUES (?,?,?,?,?,?,?)").run(key, leftPath, rightPath, leftHash, rightHash, output, expiresAt),
    relations: (at: string): { key: string; left_path: string; right_path: string; left_hash: string; right_hash: string; expires_at: string; verdict: string; policy: string }[] => statement("SELECT key,left_path,right_path,left_hash,right_hash,expires_at,json_extract(output,'$.verdict') verdict,json_extract(output,'$.policy') policy FROM feed_relation_pairs WHERE expires_at>? ORDER BY key").all(at) as { key: string; left_path: string; right_path: string; left_hash: string; right_hash: string; expires_at: string; verdict: string; policy: string }[],
  };
}
export type ProjectionsRepository = ReturnType<typeof projectionsRepository>;
