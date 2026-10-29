import { FdgError } from '../../contracts/errors.js';
import type { Item } from '../../contracts/items.js';
import type Database from '../sqlite.js';
import { statements } from '../statements.js';
export function inboxRepository(db: Database, admit: (item: Item) => unknown) {
  const statement = statements(db);
  return {
    save: (items: readonly Item[], at: string) => db.transaction(() => items.map(original => {
      let item = original;
      if (statement('SELECT 1 FROM feed_excluded WHERE source=? AND id=?').get(item.source, item.id)) throw new FdgError('EXCLUDED_ITEM', 'Explicitly excluded item: ' + item.source + '/' + item.id);
      const prior = statement('SELECT data FROM items WHERE source=? AND id=?').get(item.source, item.id);
      if (prior) { const previous = JSON.parse(prior.data) as Item; item = { ...item, publishedAt: previous.publishedAt, basis: previous.basis }; }
      statement("INSERT INTO fdg_inbox(source,id,data,saved_at) VALUES(?,?,?,?) ON CONFLICT(source,id) DO UPDATE SET data=excluded.data,saved_at=excluded.saved_at,state='pending'").run(item.source, item.id, JSON.stringify(item), at);
      return { source: item.source, id: item.id, state: 'pending' as const };
    }))(),
    accept: (selected?: string) => db.transaction(() => {
      let count = 0;
      for (const row of statement("SELECT * FROM fdg_inbox WHERE state='pending' AND (? IS NULL OR source=?)").all(selected ?? null, selected ?? null)) {
        if (statement('SELECT 1 FROM feed_excluded WHERE source=? AND id=?').get(row.source, row.id)) continue;
        const item = JSON.parse(row.data) as Item; item.metadata = { ...item.metadata, fdgExplicitAdmission: true };
        admit(item);
        statement('INSERT OR IGNORE INTO fdg_admissions(source,id) VALUES(?,?)').run(item.source, item.id);
        statement("UPDATE fdg_inbox SET state='accepted' WHERE source=? AND id=?").run(item.source, item.id); count++;
      }
      return count;
    })(),
  };
}
