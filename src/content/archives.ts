import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import type { InstanceContext } from '../instance/index.js';
import { resource } from '../platform/resources.js';
import { completeArtifact, markArtifact, pruneArtifacts } from '../platform/retention.js';
import { ArchiveSnapshot } from '../storage/index.js';

import type { Item } from '../contracts/items.js';
import { errorText } from '../platform/errors.js';
import { hash } from '../platform/hash.js';
import { safeUrl } from '../platform/url.js';
import type { Storage } from '../storage/index.js';
import { assertAuthoredContent, isAuthoredPath } from './authored.js';
import { collectionTabs } from './collections.js';
import { initializePublications } from './publications.js';
import { selectionDay } from './selection/select.js';

import type { ArchiveIssue, ArchivePost, ArchiveReference } from '../contracts/archives.js';
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
export async function scanArchives(config: InstanceContext, signal?: AbortSignal, onlyPaths?: ReadonlySet<string>): Promise<ArchiveScan> {
  await assertAuthoredContent(config.feed.directory);
  const root = resolve(config.feed.directory), files = new Set<string>(), posts: ArchiveReference[] = [], issues: ArchiveIssue[] = [];
  const temporary = await mkdtemp(join(tmpdir(), 'feedgarden-archive-scan-'));
  const database = join(temporary, 'snapshot.sqlite');
  let snapshot: ArchiveSnapshot | undefined;
  async function dispose(): Promise<void> {
    snapshot?.close(); snapshot = undefined;
    if (dirname(resolve(temporary)) !== resolve(tmpdir())) throw new Error('Invalid temporary archive directory');
    await rm(temporary, { recursive: true, force: true });
  }
  try {
    // Keep immutable bytes on disk until import commits. Only path/identity
    // metadata survives each read, instead of retaining the entire archive heap.
    snapshot = new ArchiveSnapshot(database);
    async function walk(directory: string, prefix = ''): Promise<void> {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        signal?.throwIfAborted();
        const path = prefix + entry.name;
        if (isAuthoredPath(path)) continue;
        if (path === '_recommendations.json') continue;
        if (onlyPaths && ![...onlyPaths].some(target => target === path || target.startsWith(path + '/'))) continue;
        if (entry.isSymbolicLink()) throw new Error('Archive snapshot does not follow symlinks: ' + path);
        if (entry.isDirectory()) await walk(join(directory, entry.name), path + '/');
        else if (entry.isFile()) { snapshot!.saveFile(path, await readFile(join(directory, entry.name))); files.add(path); }
      }
    }
    if (existsSync(root)) await walk(root);
    const identities = new Set<string>();
    for (const path of files) {
      signal?.throwIfAborted();
      const match = path.match(/^(reddit|hackernews)\/(\d{4}-\d{2})\/(\d{2})\/item-(\d+)\.md$/);
      if (!match) continue;
      try {
        const source = match[1]!, en = snapshot.file(path)!.toString('utf8');
        const translated = snapshot.file('_translations/zh-CN/' + path);
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
        const item: Item = {
          source, id, stream, channel: 'archive', title: String(fields.title), url,
          publishedAt: new Date(String(fields.date)).toISOString(), observedAt: firstSeen, text: '', metrics: {}, basis: fields.date_basis === 'observed' ? 'observed' : 'published',
          metadata: { archiveOnly: true, ...(fields.discussion_url ? { discussionUrl: String(fields.discussion_url) } : {}) }
        };
        const timezone = config.sources.find(row => row.id === source)?.timezone ?? 'Asia/Shanghai';
        const day = selectionDay(item, firstSeen, timezone);
        if (day !== match[2] + '-' + match[3]) throw new Error('Archive date does not match its path: ' + path);
        const number = Number(match[4]);
        if (!Number.isSafeInteger(number) || number < 1) throw new Error('Invalid archive number: ' + path);
        snapshot.savePost(path, source, id, day, number, JSON.stringify(item), en, zh);
        posts.push({ path, source, id, day, number, item, firstSeen });
      } catch (error) {
        if (error instanceof Error && 'code' in error && String(error.code).startsWith('ERR_SQLITE')) throw error;
        issues.push({ path, source: match[1]!, day: match[2] + '-' + match[3], message: errorText(error) });
      }
    }
    for (const path of files) {
      const match = path.match(/^_translations\/zh-CN\/((reddit|hackernews)\/(\d{4}-\d{2})\/(\d{2})\/item-\d+\.md)$/);
      if (match && !files.has(match[1]!)) issues.push({ path: match[1]!, source: match[2]!, day: match[3] + '-' + match[4], message: 'Missing English archive copy: ' + match[1] });
    }
    for (const post of posts) for (const path of [post.path, '_translations/zh-CN/' + post.path]) { files.delete(path); snapshot.removeFile(path); }
    return {
      posts, files, issues, database, dispose,
      file: path => snapshot!.file(path),
      post: path => { const metadata = posts.find(post => post.path === path), body = snapshot!.translations(path); return metadata && body ? { ...metadata, ...body } : undefined; }
    };
  } catch (error) { await dispose(); throw error; }
}

async function backupArchives(config: InstanceContext, store: Storage, signal?: AbortSignal): Promise<string> {
  store.assertLease(); signal?.throwIfAborted();
  const backup = resolve(config.paths.archiveBackups, new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID());
  await mkdir(backup, { recursive: true, mode: 0o700 });
  await markArtifact(backup, 'archives', config.instanceId);
  await store.backup(join(backup, 'data.sqlite'));
  store.assertLease(); signal?.throwIfAborted();
  if (existsSync(config.feed.directory)) await cp(config.feed.directory, join(backup, 'content'), { recursive: true });
  await completeArtifact(backup);
  await pruneArtifacts(config.paths.archiveBackups, 'archives', config.instanceId);
  return backup;
}

export async function archiveManifestSignature(config: InstanceContext): Promise<string> {
  const read = async (path: string) => { try { return await readFile(path, 'utf8'); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; return ''; } };
  const [topics, en, zh] = await Promise.all([read(config.feed.topics), read(join(config.feed.locales ?? resource('locales'), 'en.json')), read(join(config.feed.locales ?? resource('locales'), 'zh-CN.json'))]);
  return hash({ topics, manifests: [en, zh], sources: config.sources.map(({ id, name, timezone }) => ({ id, name, timezone })) });
}
export async function importArchives(config: InstanceContext, store: Storage, signal?: AbortSignal, forceSnapshot = false): Promise<string | undefined> {
  await assertAuthoredContent(config.feed.directory);
  await initializePublications(config, store, signal);
  if (!forceSnapshot && !config.sources.some(source => source.selection)) return;
  // The database owns the snapshot after its first import. A new output path
  // must not re-import a rendered subset or replace private original bytes.
  const key = 'selection_archives';
  if (store.meta(key)) return;
  if (store.archives.legacyMarker()) {
    store.assertLease(); signal?.throwIfAborted();
    store.setMeta(key, '1'); // Adopt the marker used by earlier directory-based imports.
    return;
  }
  const manifestSignature = await archiveManifestSignature(config);
  const scan = await scanArchives(config, signal);
  try {
    // Known identity/path conflicts are validation failures, so find them before
    // copying a backup. Recheck at commit after the asynchronous backup work.
    store.assertLease(); signal?.throwIfAborted();
    for (const post of scan.posts) store.validateArchiveReservation(post);
    let backup: string | undefined;
    if (scan.posts.length || scan.files.size) {
      backup = await backupArchives(config, store, signal);
    }
    store.importArchiveSnapshot({ database: scan.database, posts: scan.posts, files: scan.files, issues: scan.issues, manifestSignature, backup }, signal);
    return backup;
  } finally { await scan.dispose(); }
}

// Maintenance is explicit and backed up. Removed platform posts keep their
// private archive row; opaque-file revisions remain in the maintenance backup.
export async function maintainArchive(config: InstanceContext, store: Storage, action: 'update' | 'remove', requestedPath: string, signal?: AbortSignal): Promise<string> {
  const root = resolve(config.feed.directory), file = resolve(root, requestedPath), rel = relative(root, file);
  if (!requestedPath || /^[a-z]:/i.test(requestedPath) || requestedPath.includes('\\') || isAbsolute(requestedPath) || isAbsolute(rel) || rel === '..' || rel.startsWith('..' + sep) || !rel) throw new Error('Invalid archive path: ' + requestedPath);
  let path = rel.split(sep).join('/');
  if (isAuthoredPath(path)) throw new Error('Clippings are maintained directly on disk, not through archive maintenance');
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
  const generated = route ? store.archives.generatedPath(route[1]!, route[2] + '-' + route[3], Number(route[4])) as Identity | undefined : undefined;
  if (generated) {
    if (action === 'update') throw new Error('This archive has a generated summary; use summarize --refresh: ' + generatedPath);
    path = generatedPath; paired = true;
  }
  // Non-platform historical item routes are opaque, but still form bilingual
  // pairs. Remove both copies; updates retain their opaque-file behavior.
  if (action === 'remove' && route) { path = generatedPath; paired = true; }
  const current = generated ?? store.archives.identity(path) as Identity | undefined;
  const paths = paired ? [path, '_translations/zh-CN/' + path] : [path];
  const opaque = store.archives.hasFile;
  if (!current && !paths.some(path => opaque(path))) throw new Error('Unknown private archive path: ' + path);
  const scan = action === 'update' ? await scanArchives(config, signal, new Set(paths)) : undefined;
  try {
    const post = scan?.post(path);
    if (action === 'update' && paired && !post) throw new Error(scan?.issues.find(issue => issue.path === path)?.message ?? 'Missing bilingual archive pair: ' + path);
    if (post && current && (post.source !== current.source || post.id !== current.id || post.day !== current.day || post.number !== current.number)) throw new Error('Archive update cannot change identity, date or reserved number: ' + path);
    const bytes = !paired && action === 'update' ? scan?.file(path) : undefined;
    if (action === 'update' && !paired && !bytes) throw new Error('Missing archive file: ' + path);
    store.validateArchivePost(path, post);
    const backup = await backupArchives(config, store, signal);
    store.maintainArchiveSnapshot({ action, path, paths, current, post, bytes }, signal);
    return backup;
  } finally { await scan?.dispose(); }
}
