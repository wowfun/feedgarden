import { DateTime } from 'luxon';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { parse } from 'yaml';
import type { InstanceContext } from '../../instance/index.js';
import { resource } from '../../platform/resources.js';
import { frontmatter, renderArchivedMedia, renderItem } from './render.js';

import { assertExportDirectory } from '../../instance/index.js';
import { atomicWrite } from '../../platform/files.js';
import { hash } from '../../platform/hash.js';
import { nowIso } from '../../platform/time.js';
import { type Storage } from '../../storage/index.js';
import { archiveManifestSignature, importArchives } from '../archives.js';
import { assertAuthoredContent, authoredDirectory, isAuthoredPath, transferAuthoredContent } from '../authored.js';
import { collectionTabs } from '../collections.js';
import { itemPath, iterateAcceptedItems } from '../processing/summaries.js';
import { archivedPublications, publicationScope, publicationSignature, recordPublications, type PublishedIdentity } from '../publications.js';
import { activeRelations, corePublications, publication, recentPublication, recommendationManifest, relationRevision, type Publication } from '../relations.js';
import { reconcileSelection, selectionPolicy } from '../selection/select.js';
import { loadTopics, topicTagAliases } from '../topics.js';

interface ContentJournal { destination: string; staging: string; previous: string; publications?: PublishedIdentity[] }
export async function recoverContent(config: InstanceContext, store: Storage): Promise<void> {
  const journalPath = config.paths.contentJournal;
  if (!existsSync(journalPath)) return;
  const journal = JSON.parse(await readFile(journalPath, 'utf8')) as ContentJournal;
  if (journal.destination !== resolve(config.feed.directory) || dirname(journal.staging) !== dirname(journal.destination) || dirname(journal.previous) !== dirname(journal.destination)) throw new Error('Content journal paths differ from the configured same-filesystem destination');
  for (const tree of [journal.destination, journal.staging, journal.previous]) await assertAuthoredContent(tree);
  if (existsSync(journal.destination) && existsSync(journal.staging) && existsSync(journal.previous)) throw new Error('Content changed during the directory handoff; all trees have been kept for recovery');
  let installed = existsSync(journal.destination) && !existsSync(journal.staging);
  if (!existsSync(journal.destination)) {
    if (existsSync(journal.staging)) {
      await transferAuthoredContent(journal.previous, journal.staging);
      await rename(journal.staging, journal.destination); installed = true;
    }
    else if (existsSync(journal.previous)) await rename(journal.previous, journal.destination);
    else throw new Error('Content journal cannot recover either tree');
  }
  if (installed && existsSync(join(journal.previous, authoredDirectory))) throw new Error('Content recovery found untransferred clippings; the previous tree has been kept');
  // Journals predating publication tracking still own a recoverable content tree.
  const publications = journal.publications ?? [];
  if (installed) recordPublications(store, publications);
  else if (publications.length) {
    // If cleanup is interrupted, a later recovery must not mistake the old
    // destination for a committed staging tree after staging has been removed.
    journal.publications = [];
    await atomicWrite(journalPath, JSON.stringify(journal));
  }
  await rm(journal.staging, { recursive: true, force: true });
  await rm(journal.previous, { recursive: true, force: true });
  await rm(journalPath);
}
export async function writeSite(config: InstanceContext, store: Storage, signal?: AbortSignal, force = false): Promise<boolean> {
  assertExportDirectory(config.paths, config.feed.directory);
  signal?.throwIfAborted();
  await recoverContent(config, store);
  await importArchives(config, store, signal);
  for (const source of config.sources) if (store.meta('selection_policy:' + source.id) !== selectionPolicy(source)) reconcileSelection(config, store, { source: source.id, signal });
  const registry = await loadTopics(config.feed.topics);
  const timezones = new Map(config.sources.map(source => [source.id, source.timezone]));
  const destination = resolve(config.feed.directory);
  const manifests = await Promise.all(['en', 'zh-CN'].map(locale => readFile(join(config.feed.locales ?? resource('locales'), locale + '.json'), 'utf8')));
  const scope = publicationScope(store);
  const signature = () => hash({ contentVersion: store.meta('content_version'), admissions: publicationSignature(store, scope), registry, sources: config.sources.map(({ id, name, timezone, selection }) => ({ id, name, timezone, selection })), manifests, renderRevision: 18 });
  const signatureKey = 'render_signature:' + destination;
  const recommendationAt = nowIso(), relations = activeRelations(store, recommendationAt);
  const recommendationKey = 'recommendation_signature:' + destination;
  const recommendationSignature = () => hash({ pages: signature(), revision: relationRevision(store), relations });
  if (!force && existsSync(destination) && existsSync(join(destination, 'index.md')) && existsSync(join(destination, '_translations/zh-CN/index.md')) && store.meta(signatureKey) === signature()) {
    if (store.meta(recommendationKey) !== recommendationSignature() || !existsSync(join(destination, '_recommendations.json'))) {
      const manifest = await recommendationManifest(corePublications(config, store, recommendationAt), store, recommendationAt, relations);
      signal?.throwIfAborted(); store.assertLease();
      await atomicWrite(join(destination, '_recommendations.json'), JSON.stringify(manifest, null, 2) + '\n', signal);
      store.setMeta(recommendationKey, recommendationSignature());
    }
    return false;
  }
  const topicIds = new Map(registry.topics.map(topic => [topic.id, topic.replacedBy ?? topic.id]));
  await mkdir(dirname(destination), { recursive: true });
  const staging = await mkdtemp(join(dirname(destination), '.content-stage-'));
  const paths = new Map<string, PublishedIdentity>();
  const publications: PublishedIdentity[] = [];
  const directories = new Set<string>();
  const posts = new Map<string, Publication>();
  function trackPublication(path: string, body: string | Buffer): void {
    if (!path.endsWith('.md') || path.split('/').some(part => part.startsWith('_') || part.startsWith('.'))) return;
    const post = publication(path, body.toString(), recommendationAt);
    if (post) posts.set(path, post); else posts.delete(path);
  }
  try {
    // Configuration changes regenerate only the managed locale manifests;
    // every other opaque archive file remains part of the private snapshot.
    const preserveManifest = store.meta('selection_archive_manifest') === await archiveManifestSignature(config);
    async function write(path: string, body: string, postDate?: string): Promise<void> {
      signal?.throwIfAborted();
      const file = join(staging, path), directory = dirname(file);
      if (!directories.has(directory)) { await mkdir(directory, { recursive: true }); directories.add(directory); }
      const markdown = body.trimEnd() + '\n';
      await writeFile(file, markdown);
      if (postDate && recentPublication(postDate, recommendationAt)) trackPublication(path, markdown); else posts.delete(path);
    }
    async function preserve(path: string, body: string | Buffer): Promise<void> {
      signal?.throwIfAborted();
      const file = resolve(staging, path), rel = relative(staging, file);
      if (/^[a-z]:/i.test(path) || path.includes('\\') || isAbsolute(path) || isAbsolute(rel) || !rel || rel === '..' || rel.startsWith('..' + (process.platform === 'win32' ? '\\' : '/'))) throw new Error('Invalid archived relative path: ' + path);
      const directory = dirname(file);
      if (!directories.has(directory)) { await mkdir(directory, { recursive: true }); directories.add(directory); }
      await writeFile(file, body); trackPublication(path, body);
    }
    for (const row of store.projections.orderedFiles() as Iterable<{ path: string; body: Buffer }>) {
      if (row.path === '_recommendations.json' || isAuthoredPath(row.path)) continue;
      if (!preserveManifest && (row.path === '_locale.yml' || row.path === '_translations/zh-CN/_locale.yml')) continue;
      let body: string | Buffer = row.body;
      if (row.path.endsWith('.md')) {
        const source = row.body.toString('utf8'), rendered = renderArchivedMedia(source, row.path.startsWith('_translations/zh-CN/') ? 'zh-CN' : 'en');
        if (rendered !== source) body = rendered;
      }
      await preserve(row.path, body);
    }
    for (const locale of ['en', 'zh-CN'] as const) {
      const prefix = locale === 'zh-CN' ? '_translations/zh-CN/' : '';
      const manifest = JSON.parse(manifests[locale === 'en' ? 0 : 1]!);
      manifest.tag_labels = Object.fromEntries([['source/clippings', manifest.tag_labels?.['source/clippings'] ?? 'Clippings'], ...config.sources.map(source => ['source/' + source.id, manifest.tag_labels?.['source/' + source.id] ?? source.name]), ...registry.topics.map(topic => ['topics/' + topic.id, topic.name[locale]])]);
      manifest.hidden_tags = registry.topics.filter(topic => topic.hidden).map(topic => 'topics/' + topic.id).sort();
      manifest.tag_aliases = topicTagAliases(registry);
      const manifestPath = prefix + '_locale.yml';
      if (!preserveManifest || !existsSync(join(staging, manifestPath))) await write(manifestPath, JSON.stringify(manifest, null, 2));
      else {
        // Keep custom messages and tags, but configuration owns source/topic
        // labels and topic visibility even when a fresh DB imports stale output.
        const preserved = parse(await readFile(join(staging, manifestPath), 'utf8'));
        const reconciled = {
          ...preserved,
          tag_labels: { ...preserved.tag_labels, ...manifest.tag_labels },
          hidden_tags: [...new Set([...(preserved.hidden_tags ?? []).filter((tag: string) => !tag.startsWith('topics/')), ...manifest.hidden_tags])].sort(),
          tag_aliases: { ...preserved.tag_aliases, ...manifest.tag_aliases }
        };
        if (JSON.stringify(reconciled) !== JSON.stringify(preserved)) await write(manifestPath, JSON.stringify(reconciled, null, 2));
      }
      if (!existsSync(join(staging, prefix + 'index.md'))) await write(prefix + 'index.md', frontmatter({ publish: true, content_type: 'page', title: 'Feedgarden' }));
      for (const tab of collectionTabs(config.sources)) {
        const title = tab.title[locale];
        await write(prefix + tab.source + '/index.md', frontmatter({
          publish: true, content_type: 'page', title,
          tab: locale === 'en' ? { id: tab.id, order: tab.order, topics: ['source/' + tab.source], layout: 'archive' } : { label: title }
        }) + '# ' + title + '\n');
      }
    }
    const archived = archivedPublications(store);
    for (const row of archived as Iterable<{ path: string; source: string; id: string; item: string; first_seen: string; en: string; zh: string; published: number }>) {
      if (isAuthoredPath(row.path)) throw new Error('Generated archive occupies the authored clippings directory');
      paths.set(row.path, [row.source, row.id]);
      if (!row.published) publications.push([row.source, row.id]);
      await preserve(row.path, renderArchivedMedia(row.en, 'en')); await preserve('_translations/zh-CN/' + row.path, renderArchivedMedia(row.zh, 'zh-CN'));
    }
    for (const record of iterateAcceptedItems(store)) {
      signal?.throwIfAborted();
      const { source, id } = record.item;
      if (source === authoredDirectory) throw new Error('Generated item occupies the authored clippings directory');
      const day = DateTime.fromISO(record.date, { zone: timezones.get(source) ?? 'Asia/Shanghai' }).toISODate();
      if (!day) throw new Error('Invalid item date: ' + source + '/' + id);
      itemPath(source, day, 1); // Validate directory components before reserving a number.
      const path = itemPath(source, day, store.itemNumber(source, id, day));
      const previous = paths.get(path);
      if (previous && (previous[0] !== source || previous[1] !== id)) throw new Error('Item path collision: ' + path);
      paths.set(path, [source, id]);
      if (!record.published) publications.push([source, id]);
      const topics = [...new Set(record.copy.topics.map(id => {
        const resolved = topicIds.get(id); if (!resolved) throw new Error('Unknown stored topic: ' + id); return resolved;
      }))];
      for (const locale of ['en', 'zh-CN'] as const) await write((locale === 'zh-CN' ? '_translations/zh-CN/' : '') + path, renderItem(record, locale, topics), record.date);
    }
    await write('_recommendations.json', JSON.stringify(await recommendationManifest(posts, store, recommendationAt, relations), null, 2));
    signal?.throwIfAborted();
  } catch (error) { await rm(staging, { recursive: true, force: true }); throw error; }
  const previous = destination + '.previous-' + Date.now();
  store.assertLease();
  await atomicWrite(config.paths.contentJournal, JSON.stringify({ destination, staging, previous, publications }), signal);
  signal?.throwIfAborted();
  store.assertLease();
  if (existsSync(destination)) await rename(destination, previous);
  signal?.throwIfAborted();
  await transferAuthoredContent(previous, staging);
  signal?.throwIfAborted();
  await rename(staging, destination);
  signal?.throwIfAborted();
  await recoverContent(config, store);
  store.setMeta(signatureKey, signature());
  store.setMeta(recommendationKey, recommendationSignature());
  return true;
}
