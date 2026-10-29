import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { InstanceContext } from '../instance/index.js';

import type { Item } from '../contracts/items.js';
import { inItemWindow, type PublicationScope } from '../contracts/window.js';
import { mapLimit } from '../platform/concurrency.js';
import { hash } from '../platform/hash.js';
import type { Storage } from '../storage/index.js';

export type PublishedIdentity = [source: string, id: string];

export function publicationScope(store: Storage): PublicationScope | undefined {
  const value = store.meta('publication_windows');
  return value ? JSON.parse(value) as PublicationScope : undefined;
}

// Callers must apply exclusions/selection in SQL and read the durable scope once.
// It restricts only first publication; installed history survives every scope.
// Requiring both inputs keeps render-adjacent readers from silently bypassing it.
export function admitsPublication(item: Item, firstSeen: string, published: boolean, scope: PublicationScope | undefined): boolean {
  if (published || !scope || item.metadata?.fdgExplicitAdmission === true) return true;
  const window = scope[item.source];
  return !!window && inItemWindow(item, firstSeen, window);
}

/** One archive membership policy for rendered pages and relation evidence. */
export function* archivedPublications(store: Storage) {
  const scope = publicationScope(store);
  for (const row of store.projections.archived())
    if (admitsPublication(JSON.parse(row.item), row.first_seen, row.published === 1, scope)) yield row;
}

// Only changes to publishable membership invalidate rendering. Moving an
// observation clock or visiting another empty source must not swap the tree.
export function publicationSignature(store: Storage, scope: PublicationScope | undefined): string {
  const rows = store.projections.unpublished();
  const identities: PublishedIdentity[] = [];
  for (const row of rows) {
    if (admitsPublication(JSON.parse(row.item), row.first_seen, false, scope)) identities.push([row.source, row.id]);
  }
  return hash(identities);
}

// Selection controls unfinished work. Publication survives subsequent ranking
// changes; callers still apply explicit exclusions before using this clause.
export function recordPublications(store: Storage, identities: Iterable<PublishedIdentity>): void {
  store.recordPublications(identities);
}

// Adopt only the current bilingual output when upgrading an existing database.
// Private archives and recovered-but-unpublished summaries are not publication
// evidence. Once adopted, changing the output directory does not reset history.
export async function initializePublications(config: InstanceContext, store: Storage, signal?: AbortSignal): Promise<void> {
  if (store.meta('publications_initialized')) return;
  const identities: PublishedIdentity[] = [];
  async function isFile(path: string): Promise<boolean> {
    try { return (await stat(path)).isFile(); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; }
  }
  const rows = store.projections.nativePaths() as { source: string; id: string; day: string; number: number }[];
  await mapLimit(rows, 16, async row => {
    signal?.throwIfAborted();
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(row.source) || !/^\d{4}-\d{2}-\d{2}$/.test(row.day) || !Number.isSafeInteger(row.number) || row.number < 1) throw new Error('Invalid publication path reservation');
    const path = `${row.source}/${row.day.slice(0, 7)}/${row.day.slice(8)}/item-${row.number}.md`;
    if ((await Promise.all([isFile(join(config.feed.directory, path)), isFile(join(config.feed.directory, '_translations/zh-CN', path))])).every(Boolean)) identities.push([row.source, row.id]);
  });
  store.recordPublications(identities, true, signal);
}
