import { cp, mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { chmodSync, existsSync } from 'node:fs';
import Database from 'better-sqlite3';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, relative, isAbsolute, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { parse } from 'yaml';
import type { Config } from './config.js';
import type { Store } from './store.js';
import type { Item } from './types.js';
import { hash, safeUrl, errorText, nowIso } from './util.js';
import { selectionDay } from './selection.js';
import { collectionTabs } from './collections.js';
import { initializePublications, recordPublications } from './publications.js';

export interface ArchivePost { path: string; source: string; id: string; day: string; number: number; item: Item; firstSeen: string; en: string; zh: string }
export interface ArchiveIssue { path: string; source: string; day: string; message: string }
type ArchiveReference = Omit<ArchivePost, 'en' | 'zh'>;
export interface ArchiveScan {
  posts: ArchiveReference[]; files: Set<string>; issues: ArchiveIssue[]; database: string;
  file(path: string): Buffer | undefined; post(path: string): ArchivePost | undefined; dispose(): Promise<void>;
}
function properties(body: string, path: string): Record<string, unknown> {
  const match = body.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error('Missing archive frontmatter: ' + path);
  const fields = parse(match[1]!);
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new Error('Invalid archive frontmatter: ' + path);
  return fields as Record<string, unknown>;
}
export function archiveNativeId(source: string, properties: Record<string, unknown>): string {
  const url = new URL(String(source === 'hackernews' ? properties.discussion_url ?? properties.source_url : properties.source_url));
  if (source === 'hackernews' && url.hostname === 'news.ycombinator.com' && /^\d+$/.test(url.searchParams.get('id') ?? '')) return url.searchParams.get('id')!;
  if (source === 'reddit' && /(^|\.)reddit\.com$/.test(url.hostname)) {
    const id = url.pathname.match(/\/comments\/([a-z0-9]+)(?:\/|$)/i)?.[1];
    if (id) return 't3_' + id.toLowerCase();
  }
  throw new Error('Cannot recover native archive ID: ' + source + '/' + String(properties.source_url));
}
export async function scanArchives(config: Config, signal?: AbortSignal, onlyPaths?: ReadonlySet<string>): Promise<ArchiveScan> {
  const root = resolve(config.feed.directory), files = new Set<string>(), posts: ArchiveReference[] = [], issues: ArchiveIssue[] = [];
  const temporary = await mkdtemp(join(tmpdir(), 'feedgarden-archive-scan-'));
  const database = join(temporary, 'snapshot.sqlite');
  let snapshot: Database.Database | undefined;
  async function dispose(): Promise<void> {
    snapshot?.close(); snapshot = undefined;
    if (dirname(resolve(temporary)) !== resolve(tmpdir())) throw new Error('Invalid temporary archive directory');
    await rm(temporary, { recursive: true, force: true });
  }
  try {
    // Keep immutable bytes on disk until import commits. Only path/identity
    // metadata survives each read, instead of retaining the entire archive heap.
    snapshot = new Database(database); chmodSync(database, 0o600);
    snapshot.exec('CREATE TABLE files(path TEXT PRIMARY KEY,body BLOB NOT NULL); CREATE TABLE posts(path TEXT PRIMARY KEY,source TEXT,id TEXT,day TEXT,number INTEGER,item TEXT,en TEXT,zh TEXT)');
    const saveFile = snapshot.prepare('INSERT INTO files VALUES (?,?)');
    const readFileBytes = snapshot.prepare('SELECT body FROM files WHERE path=?');
    const savePost = snapshot.prepare('INSERT INTO posts VALUES (?,?,?,?,?,?,?,?)');
    const removeFile = snapshot.prepare('DELETE FROM files WHERE path=?');
    async function walk(directory: string, prefix = ''): Promise<void> {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        signal?.throwIfAborted();
        const path = prefix + entry.name;
        if (path === '_recommendations.json') continue;
        if (onlyPaths && ![...onlyPaths].some(target => target === path || target.startsWith(path + '/'))) continue;
        if (entry.isSymbolicLink()) throw new Error('Archive snapshot does not follow symlinks: ' + path);
        if (entry.isDirectory()) await walk(join(directory, entry.name), path + '/');
        else if (entry.isFile()) { saveFile.run(path, await readFile(join(directory, entry.name))); files.add(path); }
      }
    }
    if (existsSync(root)) await walk(root);
    const identities = new Set<string>();
    for (const path of files) {
      signal?.throwIfAborted();
      const match = path.match(/^(reddit|hackernews)\/(\d{4}-\d{2})\/(\d{2})\/item-(\d+)\.md$/);
      if (!match) continue;
      try {
        const source = match[1]!, en = (readFileBytes.get(path) as { body: Buffer }).body.toString('utf8');
        const translated = (readFileBytes.get('_translations/zh-CN/' + path) as { body: Buffer } | undefined)?.body;
        if (!translated) throw new Error('Missing Chinese archive copy: ' + path);
        const zh = translated.toString('utf8'), fields = properties(en, path), translatedFields = properties(zh, path);
        if (fields.source_url !== translatedFields.source_url || fields.date !== translatedFields.date) throw new Error('Bilingual archive identities differ: ' + path);
        const id = archiveNativeId(source, fields), identity = source + '/' + id;
        if (id !== archiveNativeId(source, translatedFields)) throw new Error('Bilingual archive identities differ: ' + path);
        if (identities.has(identity)) throw new Error('Duplicate archive identity: ' + identity);
        identities.add(identity);
        const firstSeen = new Date(String(fields.first_seen ?? fields.date)).toISOString();
        const url = safeUrl(String(fields.source_url));
        const stream = source === 'reddit' ? new URL(url).pathname.match(/\/r\/([^/]+)\//)?.[1] : config.sources.find(row => row.id === source)?.streams[0]?.id;
        if (!stream) throw new Error('Cannot recover archive stream: ' + path);
        const item: Item = { source, id, stream, channel: 'archive', title: String(fields.title), url,
          publishedAt: new Date(String(fields.date)).toISOString(), observedAt: firstSeen, text: '', metrics: {}, basis: fields.date_basis === 'observed' ? 'observed' : 'published',
          metadata: { archiveOnly: true, ...(fields.discussion_url ? { discussionUrl: String(fields.discussion_url) } : {}) } };
        const timezone = config.sources.find(row => row.id === source)?.timezone ?? 'Asia/Shanghai';
        const day = selectionDay(item, firstSeen, timezone);
        if (day !== match[2] + '-' + match[3]) throw new Error('Archive date does not match its path: ' + path);
        const number = Number(match[4]);
        if (!Number.isSafeInteger(number) || number < 1) throw new Error('Invalid archive number: ' + path);
        savePost.run(path, source, id, day, number, JSON.stringify(item), en, zh);
        posts.push({ path, source, id, day, number, item, firstSeen });
      } catch (error) {
        if (error instanceof Database.SqliteError) throw error;
        issues.push({ path, source: match[1]!, day: match[2] + '-' + match[3], message: errorText(error) });
      }
    }
    for (const path of files) {
      const match = path.match(/^_translations\/zh-CN\/((reddit|hackernews)\/(\d{4}-\d{2})\/(\d{2})\/item-\d+\.md)$/);
      if (match && !files.has(match[1]!)) issues.push({ path: match[1]!, source: match[2]!, day: match[3] + '-' + match[4], message: 'Missing English archive copy: ' + match[1] });
    }
    for (const post of posts) for (const path of [post.path, '_translations/zh-CN/' + post.path]) { files.delete(path); removeFile.run(path); }
    const readPost = snapshot.prepare('SELECT en,zh FROM posts WHERE path=?');
    return { posts, files, issues, database, dispose,
      file: path => (readFileBytes.get(path) as { body: Buffer } | undefined)?.body,
      post: path => { const metadata = posts.find(post => post.path === path), body = readPost.get(path) as { en: string; zh: string } | undefined; return metadata && body ? { ...metadata, ...body } : undefined; }
    };
  } catch (error) { await dispose(); throw error; }
}

async function backupArchives(config: Config, store: Store, signal?: AbortSignal): Promise<string> {
  store.assertLease(); signal?.throwIfAborted();
  const backup = resolve(config.storage.directory, 'ranking-backups', new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID());
  await mkdir(backup, { recursive: true, mode: 0o700 });
  await store.backup(join(backup, 'data.sqlite'));
  store.assertLease(); signal?.throwIfAborted();
  if (existsSync(config.feed.directory)) await cp(config.feed.directory, join(backup, 'content'), { recursive: true });
  return backup;
}

function recordIssues(store: Store, issues: ArchiveIssue[]): void {
  const previous = store.meta('selection_archive_issues');
  store.setMeta('selection_archive_issues', JSON.stringify(issues));
  if (previous === JSON.stringify(issues)) return;
  const insert = store.db.prepare('INSERT INTO gaps(source,stream,channel,at,details) VALUES (?,?,?,?,?)');
  for (const issue of issues) {
    insert.run(issue.source, issue.day, 'archive', nowIso(), JSON.stringify(issue));
    console.warn('Archive preserved for repair: ' + issue.message);
  }
}
export async function archiveManifestSignature(config: Config): Promise<string> {
  const read = async (path: string) => { try { return await readFile(path, 'utf8'); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; return ''; } };
  const [topics, en, zh] = await Promise.all([read(config.feed.topics), read('config/locales/en.json'), read('config/locales/zh-CN.json')]);
  return hash({ topics, manifests: [en, zh], sources: config.sources.map(({ id, name, timezone }) => ({ id, name, timezone })) });
}
export async function importArchives(config: Config, store: Store, signal?: AbortSignal): Promise<string | undefined> {
  await initializePublications(config, store, signal);
  if (!config.sources.some(source => source.selection)) return;
  // The database owns the snapshot after its first import. A new output path
  // must not re-import a rendered subset or replace private original bytes.
  const key = 'selection_archives';
  if (store.meta(key)) return;
  if (store.db.prepare("SELECT 1 FROM feed_meta WHERE key GLOB 'selection_archives:*' LIMIT 1").get()) {
    store.assertLease(); signal?.throwIfAborted();
    store.setMeta(key, '1'); // Adopt the marker used by earlier directory-based imports.
    return;
  }
  const manifestSignature = await archiveManifestSignature(config);
  const scan = await scanArchives(config, signal);
  try {
    const reservation = store.db.prepare('SELECT number FROM feed_item_paths WHERE source=? AND id=? AND day=?');
    const reservedIdentity = store.db.prepare('SELECT id FROM feed_item_paths WHERE source=? AND day=? AND number=?');
    function validateReservation(post: ArchiveReference): void {
      const number = reservation.get(post.source, post.id, post.day) as { number: number } | undefined;
      const identity = reservedIdentity.get(post.source, post.day, post.number) as { id: string } | undefined;
      if (number && number.number !== post.number || identity && identity.id !== post.id) throw new Error('Archive number conflicts with its reserved path: ' + post.path);
    }
    // Known identity/path conflicts are validation failures, so find them before
    // copying a backup. Recheck at commit after the asynchronous backup work.
    store.assertLease(); signal?.throwIfAborted();
    for (const post of scan.posts) validateReservation(post);
    let backup: string | undefined;
    if (scan.posts.length || scan.files.size) {
      backup = await backupArchives(config, store, signal);
    }
    store.db.prepare('ATTACH DATABASE ? AS archive_import').run(scan.database);
    try {
      store.db.transaction(() => {
        store.assertLease(); signal?.throwIfAborted();
        const reserve = store.db.prepare('INSERT OR IGNORE INTO feed_item_paths VALUES (?,?,?,?)');
        const insertItem = store.db.prepare('INSERT OR IGNORE INTO items VALUES (?,?,?,?,?,?,?)');
        // SQLite copies the staged rows within the existing atomic transaction,
        // without materializing all bodies in JavaScript a second time.
        store.db.exec('INSERT INTO feed_archives SELECT * FROM archive_import.posts');
        for (const post of scan.posts) {
          validateReservation(post);
          reserve.run(post.source, post.id, post.day, post.number);
          insertItem.run(post.source, post.id, post.item.publishedAt, post.firstSeen, post.firstSeen, JSON.stringify(post.item), hash({ title: post.item.title, url: post.item.url, text: '' }));
        }
        store.db.exec('INSERT INTO feed_archive_files SELECT * FROM archive_import.files');
        recordPublications(store, scan.posts.map(post => [post.source, post.id]));
        for (const path of scan.files) {
          const match = path.match(/^([a-z0-9][a-z0-9_-]*)\/(\d{4}-\d{2})\/(\d{2})\/item-(\d+)\.md$/);
          // Reserving existing numbers protects other sources when their historical
          // native IDs cannot be recovered from published Markdown.
          const number = Number(match?.[4]);
          if (match && Number.isSafeInteger(number) && number > 0) reserve.run(match[1], 'archive:' + path, match[2] + '-' + match[3], number);
        }
        store.setMeta(key, '1');
        store.setMeta('selection_archive_manifest', manifestSignature);
        recordIssues(store, scan.issues);
        if (backup) store.setMeta('selection_archive_backup', backup);
        if (scan.posts.length || scan.files.size) store.setMeta('content_version', String(Number(store.meta('content_version')) + 1));
      })();
    } finally { store.db.exec('DETACH DATABASE archive_import'); }
    return backup;
  } finally { await scan.dispose(); }
}

// Maintenance is explicit and backed up. Removed platform posts keep their
// private archive row; opaque-file revisions remain in the maintenance backup.
export async function maintainArchive(config: Config, store: Store, action: 'update' | 'remove', requestedPath: string, signal?: AbortSignal): Promise<string> {
  const root = resolve(config.feed.directory), file = resolve(root, requestedPath), rel = relative(root, file);
  if (!requestedPath || /^[a-z]:/i.test(requestedPath) || requestedPath.includes('\\') || isAbsolute(requestedPath) || isAbsolute(rel) || rel === '..' || rel.startsWith('..' + sep) || !rel) throw new Error('Invalid archive path: ' + requestedPath);
  let path = rel.split(sep).join('/');
  const platformPair = /^(?:_translations\/zh-CN\/)?((?:reddit|hackernews)\/\d{4}-\d{2}\/\d{2}\/item-\d+\.md)$/.exec(path);
  let paired = !!platformPair;
  if (platformPair) path = platformPair[1]!;
  const collection = collectionTabs(config.sources).some(tab => path === tab.source + '/index.md' || path === '_translations/zh-CN/' + tab.source + '/index.md');
  if (['index.md', '_locale.yml', '_recommendations.json', '_translations/zh-CN/index.md', '_translations/zh-CN/_locale.yml'].includes(path)
    || collection) throw new Error('This file is generated from configuration: ' + path);
  await importArchives(config, store, signal);
  const generatedPath = path.replace(/^_translations\/zh-CN\//, '');
  const route = /^([a-z0-9][a-z0-9_-]*)\/(\d{4}-\d{2})\/(\d{2})\/item-([1-9]\d*)\.md$/.exec(generatedPath);
  type Identity = { source: string; id: string; day: string; number: number };
  const generated = route ? store.db.prepare(`SELECT p.* FROM feed_item_paths p WHERE p.source=? AND p.day=? AND p.number=? AND EXISTS(SELECT 1 FROM feed_summaries f WHERE f.source=p.source AND f.id=p.id)`).get(route[1], route[2] + '-' + route[3], Number(route[4])) as Identity | undefined : undefined;
  if (generated) {
    if (action === 'update') throw new Error('This archive has a generated summary; use summarize --refresh: ' + generatedPath);
    path = generatedPath; paired = true;
  }
  // Non-platform historical item routes are opaque, but still form bilingual
  // pairs. Remove both copies; updates retain their opaque-file behavior.
  if (action === 'remove' && route) { path = generatedPath; paired = true; }
  const current = generated ?? store.db.prepare('SELECT source,id,day,number FROM feed_archives WHERE path=?').get(path) as Identity | undefined;
  const paths = paired ? [path, '_translations/zh-CN/' + path] : [path];
  const opaque = store.db.prepare('SELECT 1 FROM feed_archive_files WHERE path=?');
  if (!current && !paths.some(path => opaque.get(path))) throw new Error('Unknown private archive path: ' + path);
  const scan = action === 'update' ? await scanArchives(config, signal, new Set(paths)) : undefined;
  try {
    const post = scan?.post(path);
    if (action === 'update' && paired && !post) throw new Error(scan?.issues.find(issue => issue.path === path)?.message ?? 'Missing bilingual archive pair: ' + path);
    if (post && current && (post.source !== current.source || post.id !== current.id || post.day !== current.day || post.number !== current.number)) throw new Error('Archive update cannot change identity, date or reserved number: ' + path);
    const bytes = !paired && action === 'update' ? scan?.file(path) : undefined;
    if (action === 'update' && !paired && !bytes) throw new Error('Missing archive file: ' + path);
    function validatePost(): void {
      if (!post) return;
      const identity = store.db.prepare('SELECT path FROM feed_archives WHERE source=? AND id=?').get(post.source, post.id) as { path: string } | undefined;
      if (identity && identity.path !== path) throw new Error('Duplicate archive identity: ' + post.source + '/' + post.id);
      const reservations = store.db.prepare('SELECT id,number FROM feed_item_paths WHERE source=? AND day=? AND (id=? OR number=?)').all(post.source, post.day, post.id, post.number) as { id: string; number: number }[];
      if (reservations.some(row => row.id !== post.id && row.id !== 'archive:' + path || row.number !== post.number)) throw new Error('Archive number conflicts with its reserved path: ' + path);
    }
    validatePost();
    const backup = await backupArchives(config, store, signal);
    store.db.transaction(() => {
      store.assertLease(); signal?.throwIfAborted();
      validatePost();
      if (action === 'remove') {
        if (current) store.db.prepare('INSERT OR IGNORE INTO feed_excluded VALUES (?,?)').run(current.source, current.id);
        for (const path of paths) store.db.prepare('DELETE FROM feed_archive_files WHERE path=?').run(path);
      } else if (post) {
        // Promoting a repaired quarantined pair replaces only its placeholder
        // reservation. Valid native-ID reservations and dropped rows stay intact.
        store.db.prepare('DELETE FROM feed_item_paths WHERE source=? AND day=? AND number=? AND id=?').run(post.source, post.day, post.number, 'archive:' + path);
        store.db.prepare('DELETE FROM feed_publications WHERE source=? AND id=?').run(post.source, 'archive:' + path);
        store.db.prepare('INSERT OR IGNORE INTO feed_item_paths VALUES (?,?,?,?)').run(post.source, post.id, post.day, post.number);
        store.db.prepare('INSERT INTO feed_archives VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(path) DO UPDATE SET en=excluded.en,zh=excluded.zh').run(path, post.source, post.id, post.day, post.number, JSON.stringify(post.item), post.en, post.zh);
        store.db.prepare('INSERT OR IGNORE INTO items VALUES (?,?,?,?,?,?,?)').run(post.source, post.id, post.item.publishedAt, post.firstSeen, post.firstSeen, JSON.stringify(post.item), hash({ title: post.item.title, url: post.item.url, text: '' }));
        recordPublications(store, [[post.source, post.id]]);
        for (const path of paths) store.db.prepare('DELETE FROM feed_archive_files WHERE path=?').run(path);
      } else store.db.prepare('UPDATE feed_archive_files SET body=? WHERE path=?').run(bytes, path);
      const issues = JSON.parse(store.meta('selection_archive_issues') ?? '[]') as ArchiveIssue[];
      recordIssues(store, issues.filter(issue => issue.path !== path));
      store.setMeta('content_version', String(Number(store.meta('content_version')) + 1));
    })();
    return backup;
  } finally { await scan?.dispose(); }
}
