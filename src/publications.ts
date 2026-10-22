import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { Config } from './config.js';
import type { Store } from './store.js';
import { selectionClause } from './selection.js';
import type { Item } from './types.js';
import { inItemWindow, type PublicationScope } from './item-window.js';
import { hash, mapLimit } from './util.js';

export type PublishedIdentity = [source: string, id: string];

export function publicationScope(store: Store): PublicationScope | undefined {
  const value = store.meta('publication_windows');
  return value ? JSON.parse(value) as PublicationScope : undefined;
}

// Callers must apply exclusions/selection in SQL and read the durable scope once.
// It restricts only first publication; installed history survives every scope.
// Requiring both inputs keeps render-adjacent readers from silently bypassing it.
export function admitsPublication(item: Item, firstSeen: string, published: boolean, scope: PublicationScope | undefined): boolean {
  if (published || !scope) return true;
  const window = scope[item.source];
  return !!window && inItemWindow(item, firstSeen, window);
}

// Only changes to publishable membership invalidate rendering. Moving an
// observation clock or visiting another empty source must not swap the tree.
export function publicationSignature(store: Store, scope: PublicationScope | undefined): string {
  const rows = store.statement(`SELECT f.source,f.id,json_extract(f.accepted,'$.item') item,json_extract(f.accepted,'$.firstSeen') first_seen FROM feed_summaries f
    WHERE NOT EXISTS(SELECT 1 FROM feed_publications p WHERE p.source=f.source AND p.id=f.id)
    AND NOT EXISTS(SELECT 1 FROM feed_excluded e WHERE e.source=f.source AND e.id=f.id) AND ${selectionClause('f', true)}
    UNION ALL SELECT a.source,a.id,a.item,i.first_seen FROM feed_archives a JOIN items i ON i.source=a.source AND i.id=a.id
    WHERE NOT EXISTS(SELECT 1 FROM feed_publications p WHERE p.source=a.source AND p.id=a.id)
    AND NOT EXISTS(SELECT 1 FROM feed_summaries f WHERE f.source=a.source AND f.id=a.id)
    AND NOT EXISTS(SELECT 1 FROM feed_excluded e WHERE e.source=a.source AND e.id=a.id) AND ${selectionClause('a', true)} ORDER BY source,id`);
  const identities: PublishedIdentity[] = [];
  for (const row of rows.iterate() as Iterable<{source:string;id:string;item:string;first_seen:string}>) {
    if (admitsPublication(JSON.parse(row.item), row.first_seen, false, scope)) identities.push([row.source,row.id]);
  }
  return hash(identities);
}

// Selection controls unfinished work. Publication survives subsequent ranking
// changes; callers still apply explicit exclusions before using this clause.
export function publicationClause(alias: string, publishedAlias: string): string {
  return `(${publishedAlias}.id IS NOT NULL OR ${selectionClause(alias, true)})`;
}

export function recordPublications(store: Store, identities: Iterable<PublishedIdentity>): void {
  const insert = store.statement('INSERT OR IGNORE INTO feed_publications VALUES (?,?)');
  store.db.transaction(() => {
    store.assertLease();
    for (const [source, id] of identities) insert.run(source, id);
  })();
}

// Adopt only the current bilingual output when upgrading an existing database.
// Private archives and recovered-but-unpublished summaries are not publication
// evidence. Once adopted, changing the output directory does not reset history.
export async function initializePublications(config: Config, store: Store, signal?: AbortSignal): Promise<void> {
  if (store.meta('publications_initialized')) return;
  const identities: PublishedIdentity[] = [];
  async function isFile(path: string): Promise<boolean> {
    try { return (await stat(path)).isFile(); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; }
  }
  const rows = store.db.prepare("SELECT source,id,day,number FROM feed_item_paths WHERE id NOT LIKE 'archive:%'").all() as { source: string; id: string; day: string; number: number }[];
  await mapLimit(rows, 16, async row => {
    signal?.throwIfAborted();
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(row.source) || !/^\d{4}-\d{2}-\d{2}$/.test(row.day) || !Number.isSafeInteger(row.number) || row.number < 1) throw new Error('Invalid publication path reservation');
    const path = `${row.source}/${row.day.slice(0, 7)}/${row.day.slice(8)}/item-${row.number}.md`;
    if ((await Promise.all([isFile(join(config.feed.directory, path)), isFile(join(config.feed.directory, '_translations/zh-CN', path))])).every(Boolean)) identities.push([row.source, row.id]);
  });
  store.db.transaction(() => {
    store.assertLease(); signal?.throwIfAborted();
    recordPublications(store, identities);
    store.setMeta('publications_initialized', '1');
  })();
}
