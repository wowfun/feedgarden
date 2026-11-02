import { DateTime } from 'luxon';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';
import type { Target } from '../../contracts/publishing.js';
import type { Registry } from '../../contracts/registry.js';
import { validateRegistry } from '../../contracts/topics.mjs';
import type { InstanceContext } from '../../instance/index.js';
import { atomicWrite } from '../../platform/files.js';
import { resource } from '../../platform/resources.js';
import { ensureSafe, treeFiles } from '../../platform/tree.js';
import type { Storage } from '../../storage/index.js';
import { itemPath, iterateAcceptedItems } from '../processing/summaries.js';
import { activeRelations, publication, recommendationManifest, type Publication } from '../relations.js';
import { loadTopics } from '../topics.js';
import { canonical, itemDocument, itemHistory, identifyItem, identityKey, numbered } from './history.js';
import { renderItem } from './render.js';
import { indexPage, localeManifest } from './navigation.js';

/** Incremental export never replays archive snapshots or replaces a directory. */
export async function generateDirectory(config: InstanceContext, store: Storage, output: string, format: Target['format'], topicsFile: string, options: { rebuild?: boolean; signal?: AbortSignal }) {
  const { signal } = options;
  await mkdir(output, { recursive: true });
  const records = [...iterateAcceptedItems(store)], identify = identifyItem(records);
  const history = records.length ? await itemHistory(output, signal) : undefined;
  const files = new Set<string>(), liveIds = new Map<string, string>();
  const posts = new Map<string, Publication & { sources: string[] }>();
  const locations = new Map<string, Set<string>>(), occupants = new Map<string, Set<string>>(), numbers = new Map<string, number>();
  function reserveNumber(path: string) {
    const match = numbered(path);
    if (match) {
      const key = match[1] + '/' + match[2], number = Number(match[3]);
      if (!Number.isSafeInteger(number)) throw new Error('Invalid item number: ' + path);
      numbers.set(key, Math.max(number, numbers.get(key) ?? 0));
    }
  }
  function reserve(path: string, id: string) {
    const name = canonical(path), paths = locations.get(id) ?? new Set(); paths.add(name); locations.set(id, paths);
    const ids = occupants.get(name) ?? new Set(); ids.add(id); occupants.set(name, ids);
  }
  function observe(path: string, text: string) {
    const doc = itemDocument(path, text);
    liveIds.delete(path);
    posts.delete(path);
    if (!doc) return;
    const id = identify(path, doc.fields);
    if (id) { reserve(path, id); liveIds.set(path, id); }
    if (format !== 'jekyll' || !doc.front) return;
    const post = publication(path, text, null, doc.front);
    if (!post) return;
    const sources = path.includes('/') ? [path.split('/')[0]!] : [];
    for (const tag of Array.isArray(doc.fields.tags) ? doc.fields.tags : [])
      if (typeof tag === 'string' && /^source\/[a-z0-9_-]+$/.test(tag)) sources.push(tag.slice(7));
    posts.set(path, { ...post, sources });
  }
  for await (const path of treeFiles(output)) {
    signal?.throwIfAborted();
    files.add(path);
    reserveNumber(path);
    if (!/\.(md|json)$/.test(path) || (!history && (format !== 'jekyll' || !path.endsWith('.md')))) continue;
    const bytes = await readFile(join(output, path), { signal });
    observe(path, bytes.toString());
    history?.observed(path, bytes);
  }
  if (history) for (const path of history.paths) reserveNumber(path);
  const missing = new Set(records.map(record => identityKey(record.item.source, record.item.id)).filter(key => !locations.has(key)));
  // Default export only needs proof that an item existed. Rebuild examines all
  // historical identities to detect ambiguous reuse of deleted paths.
  if (history && (options.rebuild || missing.size)) for await (const [path, body] of history.items()) {
    const fields = itemDocument(path, body.toString())?.fields;
    const key = fields && identify(path, fields);
    if (key) { reserve(path, key); missing.delete(key); }
    if (!options.rebuild && !missing.size) break;
  }
  const incoming = await loadTopics(config.feed.topics);
  const previous: Registry = existsSync(topicsFile) ? await loadTopics(topicsFile) : { version: 1, topics: [] };
  const registry = validateRegistry({ version: 1, topics: [...previous.topics, ...incoming.topics.filter(topic => !previous.topics.some(old => old.id === topic.id))] }) as Registry;
  const topicIds = new Map(registry.topics.map(topic => [topic.id, topic.replacedBy ?? topic.id]));
  let written = 0;
  async function write(path: string, body: string, exclusive = false) {
    signal?.throwIfAborted(); store.assertLease();
    const destination = await ensureSafe(output, path);
    if (files.has(path) && (await readFile(destination, { signal })).equals(Buffer.from(body))) return;
    if (exclusive) {
      await mkdir(dirname(destination), { recursive: true });
      // Another writer may have created this path since the initial scan.
      // Refuse that collision instead of replacing their bytes.
      await writeFile(destination, body, { flag: 'wx', signal });
    } else await atomicWrite(destination, body, signal);
    files.add(path);
    observe(path, body);
    written++;
  }
  for (const record of records) {
    signal?.throwIfAborted();
    const { source, id } = record.item, key = identityKey(source, id), known = [...(locations.get(key) ?? [])];
    const existing = known.filter(path => files.has(path) || files.has('_translations/zh-CN/' + path));
    // Multiple live paths for one identity cannot be chosen automatically.
    if (existing.length > 1) continue;
    // Existing or deleted history blocks regeneration unless explicitly requested.
    if (!options.rebuild && known.length) continue;
    let path = existing[0] ?? known[0];
    // A deleted path used by different identities cannot safely be restored.
    if (path && !existing.length && occupants.get(path)?.size !== 1) continue;
    // Either language may now contain authored content or a different item.
    if (path && [path, '_translations/zh-CN/' + path].some(name => files.has(name) && liveIds.get(name) !== key)) continue;
    if (!path) {
      const day = DateTime.fromISO(record.date).setZone(config.sources.find(s => s.id === source)?.timezone ?? config.timezone).toISODate();
      if (!day) throw new Error('Invalid item date: ' + source + '/' + id);
      const group = source + '/' + day.slice(0, 7) + '/' + day.slice(8), number = (numbers.get(group) ?? 0) + 1;
      path = itemPath(source, day, number).replace(/\.md$/, format === 'json' ? '.json' : '.md');
      numbers.set(group, number);
    }
    const topics = [...new Set(record.copy.topics.map(topic => {
      const resolved = topicIds.get(topic); if (!resolved) throw new Error('Unknown stored topic: ' + topic); return resolved;
    }))];
    // A worktree may contain multiple formats. Rebuild keeps both the known
    // pathname and its representation; the target format selects new paths.
    if (path.endsWith('.json')) await write(path, JSON.stringify({ schemaVersion: 1, evidenceTrust: 'untrusted', ...record }, null, 2) + '\n', !options.rebuild);
    else for (const locale of ['en', 'zh-CN'] as const) await write((locale === 'en' ? '' : '_translations/zh-CN/') + path, renderItem(record, locale, topics), !options.rebuild);
  }
  signal?.throwIfAborted(); store.assertLease();
  if (JSON.stringify(previous) !== JSON.stringify(registry) || !existsSync(topicsFile)) await atomicWrite(topicsFile, JSON.stringify(registry, null, 2) + '\n', signal);
  if (format === 'jekyll') {
    const at = new Date().toISOString(), sources = new Set<string>();
    for (const post of posts.values()) for (const source of post.sources) sources.add(source);
    for (const locale of ['en', 'zh-CN'] as const) {
      const prefix = locale === 'en' ? '' : '_translations/zh-CN/';
      const defaults = JSON.parse(await readFile(join(config.feed.locales ?? resource('locales'), locale + '.json'), 'utf8'));
      const localePath = prefix + '_locale.yml';
      const old = files.has(localePath) ? parse(await readFile(await ensureSafe(output, localePath), 'utf8')) : {};
      const manifest = localeManifest(defaults, old, [...sources].map(id => ({ id, name: config.sources.find(source => source.id === id)?.name })), registry, locale);
      await write(prefix + '_locale.yml', JSON.stringify(manifest, null, 2) + '\n');
      if (!files.has(prefix + 'index.md')) await write(prefix + 'index.md', indexPage(locale));
      for (const source of sources) {
        if (!files.has(prefix + source + '/index.md')) await write(prefix + source + '/index.md', indexPage(locale, { id: source, name: manifest.tag_labels['source/' + source] }));
      }
    }
    const byHash = new Map<string, string[]>();
    for (const post of posts.values()) byHash.set(post.hash, [...(byHash.get(post.hash) ?? []), post.path]);
    const pathFor = (path: string, hash: string) => posts.get(path)?.hash === hash ? path : byHash.get(hash)?.length === 1 ? byHash.get(hash)![0]! : path;
    const relations = activeRelations(store, at).map(row => ({ ...row, left_path: pathFor(row.left_path, row.left_hash), right_path: pathFor(row.right_path, row.right_hash) }));
    await write('_recommendations.json', JSON.stringify(await recommendationManifest(posts, store, at, relations), null, 2) + '\n');
  }
  return { output, format, written, items: records.length };
}
