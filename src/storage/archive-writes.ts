import type { ArchiveIssue, ArchivePost, ArchiveReference } from '../contracts/archives.js';
import { hash } from '../platform/hash.js';
import { nowIso } from '../platform/time.js';
import type { DatabaseSession } from './database.js';
function recordIssues(store: DatabaseSession, issues: ArchiveIssue[]): void {
  const previous = store.meta('selection_archive_issues');
  store.setMeta('selection_archive_issues', JSON.stringify(issues));
  if (previous === JSON.stringify(issues)) return;
  const insert = store.archives.recordIssue;
  for (const issue of issues) {
    insert(issue.source, issue.day, 'archive', nowIso(), JSON.stringify(issue));
    console.warn('Archive preserved for repair: ' + issue.message);
  }
}

export function validateArchiveReservation(store: DatabaseSession, post: ArchiveReference): void {
  const number = store.archives.reservedNumber(post.source, post.id, post.day) as { number: number } | undefined;
  const identity = store.archives.reservedId(post.source, post.day, post.number) as { id: string } | undefined;
  if (number && number.number !== post.number || identity && identity.id !== post.id) throw new Error('Archive number conflicts with its reserved path: ' + post.path);
}

export function validateArchivePost(store: DatabaseSession, path: string, post: ArchivePost | undefined): void {
  if (!post) return;
  const identity = store.archives.pathForIdentity(post.source, post.id) as { path: string } | undefined;
  if (identity && identity.path !== path) throw new Error('Duplicate archive identity: ' + post.source + '/' + post.id);
  const reservations = store.archives.reservations(post.source, post.day, post.id, post.number) as { id: string; number: number }[];
  if (reservations.some(row => row.id !== post.id && row.id !== 'archive:' + path || row.number !== post.number)) throw new Error('Archive number conflicts with its reserved path: ' + path);
}

export interface ArchiveImport { database: string; posts: ArchiveReference[]; files: Set<string>; issues: ArchiveIssue[]; manifestSignature: string; backup?: string }
export function importArchiveSnapshot(store: DatabaseSession, { database, posts, files, issues, manifestSignature, backup }: ArchiveImport, signal?: AbortSignal): void {
  store.db.prepare('ATTACH DATABASE ? AS archive_import').run(database);
  try {
    store.db.transaction(() => {
      store.assertLease(); signal?.throwIfAborted();
      const reserve = store.archives.reserve;
      const insertItem = store.archives.preserveItem;
      // SQLite copies the staged rows within the existing atomic transaction,
      // without materializing all bodies in JavaScript a second time.
      store.db.exec('INSERT INTO feed_archives SELECT * FROM archive_import.posts');
      for (const post of posts) {
        validateArchiveReservation(store, post);
        reserve(post.source, post.id, post.day, post.number);
        insertItem(post.source, post.id, post.item.publishedAt, post.firstSeen, post.firstSeen, JSON.stringify(post.item), hash({ title: post.item.title, url: post.item.url, text: '' }));
      }
      store.db.exec('INSERT INTO feed_archive_files SELECT * FROM archive_import.files');
      for (const post of posts) store.projections.publish(post.source, post.id);
      for (const path of files) {
        const match = path.match(/^([a-z0-9][a-z0-9_-]*)\/(\d{4}-\d{2})\/(\d{2})\/item-(\d+)\.md$/);
        // Reserving existing numbers protects other sources when their historical
        // native IDs cannot be recovered from published Markdown.
        const number = Number(match?.[4]);
        if (match && Number.isSafeInteger(number) && number > 0) reserve(match[1]!, 'archive:' + path, match[2] + '-' + match[3], number);
      }
      store.setMeta('selection_archives', '1');
      store.setMeta('selection_archive_manifest', manifestSignature);
      recordIssues(store, issues);
      if (backup) store.setMeta('selection_archive_backup', backup);
      if (posts.length || files.size) store.setMeta('content_version', String(Number(store.meta('content_version')) + 1));
    })();
  } finally { store.db.exec('DETACH DATABASE archive_import'); }
}
export interface ArchiveMaintenance { action: 'update' | 'remove'; path: string; paths: string[]; current?: { source: string; id: string }; post?: ArchivePost; bytes?: Buffer }
export function maintainArchiveSnapshot(store: DatabaseSession, { action, path, paths, current, post, bytes }: ArchiveMaintenance, signal?: AbortSignal): void {
  store.db.transaction(() => {
    store.assertLease(); signal?.throwIfAborted();
    validateArchivePost(store, path, post);
    if (action === 'remove') {
      if (current) store.archives.exclude(current.source, current.id);
      for (const path of paths) store.archives.removeFile(path);
    } else if (post) {
      // Promoting a repaired quarantined pair replaces only its placeholder
      // reservation. Valid native-ID reservations and dropped rows stay intact.
      store.archives.removePlaceholder(post.source, post.day, post.number, 'archive:' + path);
      store.projections.removePublication(post.source, 'archive:' + path);
      store.archives.reserve(post.source, post.id, post.day, post.number);
      store.archives.updatePost(path, post.source, post.id, post.day, post.number, JSON.stringify(post.item), post.en, post.zh);
      store.archives.preserveItem(post.source, post.id, post.item.publishedAt, post.firstSeen, post.firstSeen, JSON.stringify(post.item), hash({ title: post.item.title, url: post.item.url, text: '' }));
      store.projections.publish(post.source, post.id);
      for (const path of paths) store.archives.removeFile(path);
    } else store.archives.updateFile(bytes, path);
    const issues = JSON.parse(store.meta('selection_archive_issues') ?? '[]') as ArchiveIssue[];
    recordIssues(store, issues.filter(issue => issue.path !== path));
    store.setMeta('content_version', String(Number(store.meta('content_version')) + 1));
  })();
}
