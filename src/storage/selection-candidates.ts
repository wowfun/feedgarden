import type Database from './sqlite.js';
export function* selectionCandidates(db: Database, source: string, range?: { start: string; end: string }): IterableIterator<{ id: string; data: string; first_seen: string; ranking: string | null; selected_day: string | null; selected: number | null; existing: number }> {
  const candidates = range ? `WITH candidates AS (
    SELECT id FROM items WHERE source=? AND julianday(published_at)>=julianday(?) AND julianday(published_at)<julianday(?) AND json_extract(data,'$.basis')!='observed'
    UNION SELECT id FROM items WHERE source=? AND julianday(first_seen)>=julianday(?) AND julianday(first_seen)<julianday(?) AND json_extract(data,'$.basis')='observed'
    UNION SELECT p.id FROM feed_planning p JOIN feed_selection s ON s.source=p.source AND s.id=p.id WHERE p.source=? AND p.id>?
  ) ` : '';
  const query = db.prepare(candidates + `SELECT i.id,i.data,i.first_seen,r.data ranking,s.day selected_day,s.selected,
    (a.id IS NOT NULL OR f.id IS NOT NULL) existing
    FROM items i
    LEFT JOIN feed_rankings r ON r.source=i.source AND r.id=i.id
    LEFT JOIN feed_selection s ON s.source=i.source AND s.id=i.id
    LEFT JOIN feed_archives a ON a.source=i.source AND a.id=i.id
    LEFT JOIN feed_summaries f ON f.source=i.source AND f.id=i.id
    LEFT JOIN feed_excluded e ON e.source=i.source AND e.id=i.id
    WHERE i.source=? AND e.id IS NULL AND i.id>? ${range ? 'AND i.id IN (SELECT id FROM candidates)' : ''} ORDER BY i.id LIMIT 128`);
  let cursor = '';
  while (true) {
    const args = range ? [source, range.start, range.end, source, range.start, range.end, source, cursor, source, cursor] : [source, cursor];
    const rows = query.all(...args) as { id: string; data: string; first_seen: string; ranking: string | null; selected_day: string | null; selected: number | null; existing: number }[];
    if (!rows.length) return;
    for (const row of rows) { cursor = row.id; yield row; }
  }
}
