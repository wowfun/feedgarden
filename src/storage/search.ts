import { FdgError } from '../contracts/errors.js';
import { hash } from '../platform/hash.js';
import type { DatabaseSession } from './database.js';
import type { ReadStorage, Storage } from './session.js';
const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
export const tokens = (text: string): string[] =>
  [...segmenter.segment(text.normalize('NFKC').toLowerCase())]
    .filter((part) => part.isWordLike)
    .map((part) => part.segment);
export function indexItems(session: Storage): void {
  const store = session as DatabaseSession;
  store.db.transaction(() => {
    for (const row of store.statement(`SELECT i.source,i.id,i.data,i.content_hash FROM items i
      LEFT JOIN fdg_search_versions v ON v.source=i.source AND v.id=i.id
      WHERE v.hash IS NULL OR v.hash != 'nfkc-segmenter-v1:' || i.content_hash`).iterate()) {
      const item = JSON.parse(row.data);
      store.statement('DELETE FROM fdg_search WHERE source=? AND id=?').run(row.source, row.id);
      store
        .statement('INSERT INTO fdg_search(source,id,body) VALUES(?,?,?)')
        .run(row.source, row.id, tokens(item.title + ' ' + item.text).join(' '));
      store
        .statement('INSERT OR REPLACE INTO fdg_search_versions VALUES(?,?,?)')
        .run(row.source, row.id, 'nfkc-segmenter-v1:' + row.content_hash);
    }
    store.setMeta('search_recipe', 'nfkc-segmenter-v1');
  })();
}
export function listItems(
  session: ReadStorage,
  options: { query?: string; source?: string; limit?: number; cursor?: string } = {},
) {
  const store = session as DatabaseSession;
  const limit = options.limit ?? 20;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)
    throw new FdgError('BAD_INPUT', '--limit must be between 1 and 100');
  const filter = hash({ query: options.query ?? '', source: options.source ?? '' });
  let last = 0,
    ceiling = store.statement('SELECT COALESCE(MAX(seq),0) n FROM fdg_ingest').get().n;
  if (options.cursor) {
    try {
      const cursor = JSON.parse(Buffer.from(options.cursor, 'base64url').toString());
      if (
        cursor.filter !== filter ||
        !Number.isSafeInteger(cursor.last) ||
        !Number.isSafeInteger(cursor.ceiling)
      )
        throw new Error();
      last = cursor.last;
      ceiling = cursor.ceiling;
    } catch {
      throw new FdgError('BAD_INPUT', 'Invalid cursor or changed filters');
    }
  }
  const parameters: (string | number)[] = [last, ceiling];
  let clause = '';
  if (options.source) {
    clause += ' AND i.source=?';
    parameters.push(options.source);
  }
  if (options.query) {
    const normalized = options.query.normalize('NFKC').trim(),
      terms = tokens(normalized);
    const short = /^[\p{Script=Han}]{1,2}$/u.test(normalized);
    if (!terms.length) return { items: [], nextCursor: null };
    clause +=
      ' AND (EXISTS(SELECT 1 FROM fdg_search f WHERE f.source=i.source AND f.id=i.id AND fdg_search MATCH ?)';
    parameters.push(terms.map((term) => '"' + term.replaceAll('"', '""') + '"').join(' AND '));
    if (short) {
      clause +=
        " OR json_extract(i.data,'$.title') LIKE ? ESCAPE '\\' OR json_extract(i.data,'$.text') LIKE ? ESCAPE '\\'";
      const q = '%' + normalized.replace(/[\\%_]/g, '\\$&') + '%';
      parameters.push(q, q);
    }
    clause += ')';
  }
  const rows = store
    .statement(
      'SELECT g.seq,i.source,i.id,i.data,j.state FROM fdg_ingest g JOIN items i ON i.source=g.source AND i.id=g.id LEFT JOIN feed_jobs j ON j.source=i.source AND j.id=i.id WHERE g.seq>? AND g.seq<=?' +
      clause +
      ' ORDER BY g.seq,i.source,i.id LIMIT ?',
    )
    .all(...parameters, limit + 1);
  const page = rows.slice(0, limit);
  return {
    items: page.map((row) => {
      const item = JSON.parse(row.data); return ({
        source: row.source,
        id: row.id,
        state: row.state ?? 'collected',
        evidence: {
          trust: 'untrusted',
          ...item,
          text: item.text.slice(0, 2000),
        },
      });
    }),
    nextCursor:
      rows.length > limit
        ? Buffer.from(JSON.stringify({ filter, last: page.at(-1)!.seq, ceiling })).toString('base64url')
        : null,
  };
}
