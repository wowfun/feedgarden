import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rename, rm, writeFile, readFile } from 'node:fs/promises';
import { join, resolve, dirname, relative, isAbsolute } from 'node:path';
import { DateTime } from 'luxon';
import { parse } from 'yaml';
import type { Config } from './config.js';
import { Store } from './store.js';
import { iterateAcceptedItems, itemPath, type AcceptedItem } from './items.js';
import { loadTopics } from './topics.js';
import { atomicWrite, safeUrl, hash, nowIso } from './util.js';
import { importArchives, archiveManifestSignature } from './archives.js';
import { reconcileSelection, selectionPolicy, selectionClause } from './selection.js';
import { embedKind } from './media-embed.js';
import { publication, recentPublication, activeRelations, recommendationManifest, relationRevision, type Publication } from './relations.js';

function escapeMarkdown(value: string): string { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_[\]{}()#!|$~]/g, char => `&#${char.charCodeAt(0)};`).replace(/\b([a-z][a-z0-9+.-]*):(?=\/\/)/gi, '$1&#58;').replace(/[\r\n]+/g, ' ').trim(); }
function frontmatter(properties: Record<string, unknown>): string { return `---\n${Object.entries(properties).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n`; }
function prose(value: string): string {
  return value.trim().split(/\n\s*\n/).map(paragraph => paragraph.split('\n').map(line => /^\s*[-*]\s+/.test(line) ? '- ' + escapeMarkdown(line.replace(/^\s*[-*]\s+/, '')) : escapeMarkdown(line)).join('\n')).join('\n\n');
}
function mediaLink(label: string, url: string, image = false, alt = label): string {
  const href = safeUrl(url).replace(/[<>]/g, char => encodeURIComponent(char));
  const link = '[' + label + '](<' + href + '>)';
  if (image && /(?:\||&#124;)\d+(?:x\d+)?$/.test(alt)) alt += ' · ' + label.split(':')[0];
  return embedKind(safeUrl(url), image) ? '![' + alt + '](<' + href + '>)\n\n' + link : link;
}

// Archive snapshots keep their original prose and metadata. Upgrade only the
// generated media section in their publication copy, never the private snapshot.
export function renderArchivedMedia(markdown: string, locale: 'en' | 'zh-CN'): string {
  try { return upgradeArchivedMedia(markdown, locale); }
  catch { return markdown; } // Quarantined or authored files keep their exact bytes.
}
function upgradeArchivedMedia(markdown: string, locale: 'en' | 'zh-CN'): string {
  const front = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!front) return markdown;
  const fields = parse(front[1]!);
  if (!fields || fields.content_type !== 'post' || typeof fields.source_url !== 'string') return markdown;
  let rendered = markdown;
  const section = /\n## (?:Images and video|图片与视频)\r?\n\r?\n([\s\S]*?)\s*$/.exec(markdown);
  if (section) {
    const rows = section[1]!.split(/\r?\n/).filter(line => line.trim());
    const parsed = rows.map(line => /^- \[([^\n]*)\]\(<(https?:\/\/[^<>]+)>\)$/.exec(line));
    if (parsed.length && parsed.every(match => match)) {
      const media = parsed.map(match => mediaLink(match![1]!, match![2]!, /^(?:Image|图片)(?::|$)/.test(match![1]!)));
      rendered = markdown.slice(0, section.index) + '\n## ' + (locale === 'en' ? 'Media' : '媒体') + '\n\n' + media.join('\n\n') + '\n';
    }
  }
  const original = safeUrl(fields.source_url);
  const originalEmbedded = [...rendered.matchAll(/!\[[^\n]*\]\(<([^<>]+)>\)/g)].some(match => safeUrl(match[1]!) === original);
  if (embedKind(original) && !originalEmbedded) {
    const label = escapeMarkdown((locale === 'en' ? 'Original' : '原文') + (typeof fields.title === 'string' ? ': ' + fields.title : ''));
    const heading = '\n## ' + (locale === 'en' ? 'Media' : '媒体') + '\n';
    rendered = rendered.trimEnd() + (rendered.includes(heading) ? '\n\n' : '\n\n' + heading.trimStart() + '\n') + mediaLink(label, original) + '\n';
  }
  return rendered;
}
export function renderItem(record: AcceptedItem, locale: 'en' | 'zh-CN', topics = record.copy.topics): string {
  const { item, copy } = record, translation = copy[locale];
  const summary = prose(translation.summary);
  const excerpt = item.articleQuote && item.articleQuote + (item.text.replace(/\s+/g, ' ').trim() === item.articleQuote ? '' : '…');
  const selected = (copy.media ?? []).map(id => item.media?.find(candidate => candidate.id === id)).filter(candidate => !!candidate);
  const original = safeUrl(item.url), kind = embedKind(original);
  const candidates = kind && !selected.some(candidate => safeUrl(candidate.url) === original)
    ? [{ url: original, type: kind, title: translation.title, original: true }, ...selected] : selected;
  const labels = locale === 'en' ? { image: 'Image', video: 'Video', audio: 'Audio', pdf: 'PDF', post: 'Post' } : { image: '图片', video: '视频', audio: '音频', pdf: 'PDF', post: '帖子' };
  const media = candidates.map(candidate => {
    const label = escapeMarkdown(('original' in candidate ? locale === 'en' ? 'Original' : '原文' : labels[candidate.type]) + (candidate.title ? ': ' + candidate.title : ''));
    const alt = /\|\d+(?:x\d+)?$/.test(candidate.title) ? label + ' · ' + labels[candidate.type] : label;
    return mediaLink(label, candidate.url, candidate.type === 'image', alt);
  });
  let body = item.source === 'hackernews' ? excerpt ? '## ' + (locale === 'en' ? 'Original excerpt' : '原文摘录') + '\n\n> ' + escapeMarkdown(excerpt) : summary ? '## ' + (locale === 'en' ? 'Article' : '正文提炼') + '\n\n' + summary : '' : summary;
  if (item.source === 'podcast') {
    const basis = item.metadata?.summaryBasis === 'transcript' ? 'transcript' : 'shownotes';
    const notes = locale === 'en'
      ? { transcript: 'Based on the complete available transcript.', shownotes: 'Based on episode show notes.' }
      : { transcript: '根据取得的完整转录整理。', shownotes: '根据单集节目简介整理。' };
    body += (body ? '\n\n' : '') + notes[basis];
  }
  if (copy.discussion && item.discussion) {
    const links = copy.discussion.commentIds.map(id => item.discussion!.comments.find(comment => comment.id === id)).filter(comment => !!comment).map(comment => '[' + escapeMarkdown((comment.author || '#' + comment.id)) + '](https://news.ycombinator.com/item?id=' + encodeURIComponent(comment.id) + ')');
    const sample = locale === 'en' ? 'Based on ' + item.discussion.comments.length + ' selected comments and replies.' : '根据 ' + item.discussion.comments.length + ' 条选取的评论与回复整理。';
    body += (body ? '\n\n' : '') + '## ' + (locale === 'en' ? 'HN discussion' : 'HN 热门讨论') + '\n\n' + sample + '\n\n' + prose(copy.discussion[locale]);
    body += '\n\n' + (locale === 'en' ? 'Selected comments: ' : '评论来源：') + links.join(' · ') + '\n\n[' + (locale === 'en' ? 'Read the full HN discussion' : '查看完整 HN 讨论') + '](<' + safeUrl(item.discussion.url) + '>)';
  }
  body += media.length ? '\n\n## ' + (locale === 'en' ? 'Media' : '媒体') + '\n\n' + media.join('\n\n') : '';
  const descriptionChars = [...(translation.summary || excerpt || copy.discussion?.[locale] || '').replace(/\s+/g, ' ')];
  const description = descriptionChars.length > 240 ? descriptionChars.slice(0, 237).join('') + '...' : descriptionChars.join('');
  return frontmatter({ publish: true, content_type: 'post', title: translation.title, description, date: record.date, updated: record.updated, first_seen: record.firstSeen, date_basis: record.dateBasis, source_url: safeUrl(item.url), ...(item.repoUrl ? { repo_url: safeUrl(item.repoUrl) } : {}), ...(item.discussion ? { discussion_url: safeUrl(item.discussion.url) } : {}), tags: ['source/' + item.source, ...topics.map(id => 'topics/' + id)] }) + body + '\n';
}
interface ContentJournal { destination: string; staging: string; previous: string }
export async function recoverContent(config: Config): Promise<void> {
  const journalPath = resolve(config.storage.directory, 'content-journal.json');
  if (!existsSync(journalPath)) return;
  const journal = JSON.parse(await readFile(journalPath, 'utf8')) as ContentJournal;
  if (journal.destination !== resolve(config.feed.directory) || dirname(journal.staging) !== dirname(journal.destination) || dirname(journal.previous) !== dirname(journal.destination)) throw new Error('Content journal paths differ from the configured same-filesystem destination');
  if (!existsSync(journal.destination)) {
    if (existsSync(journal.staging)) await rename(journal.staging, journal.destination);
    else if (existsSync(journal.previous)) await rename(journal.previous, journal.destination);
    else throw new Error('Content journal cannot recover either tree');
  }
  await rm(journal.staging, { recursive: true, force: true });
  await rm(journal.previous, { recursive: true, force: true });
  await rm(journalPath);
}
export async function writeSite(config: Config, store: Store, signal?: AbortSignal, force = false): Promise<boolean> {
  signal?.throwIfAborted();
  await recoverContent(config);
  await importArchives(config, store, signal);
  for (const source of config.sources) if (store.meta('selection_policy:' + source.id) !== selectionPolicy(source)) reconcileSelection(config, store, { source: source.id, signal });
  const registry = await loadTopics(config.feed.topics);
  const timezones = new Map(config.sources.map(source => [source.id, source.timezone]));
  const destination = resolve(config.feed.directory);
  const manifests = await Promise.all(['en', 'zh-CN'].map(locale => readFile('config/locales/' + locale + '.json', 'utf8')));
  const signature = hash({ contentVersion: store.meta('content_version'), registry, sources: config.sources.map(({ id, name, timezone, selection }) => ({ id, name, timezone, selection })), manifests, recommendations: relationRevision(store), renderRevision: 8 });
  const signatureKey = 'render_signature:' + destination;
  if (!force && existsSync(destination) && existsSync(join(destination, 'index.md')) && existsSync(join(destination, '_translations/zh-CN/index.md')) && store.meta(signatureKey) === signature) return false;
  const recommendationAt = nowIso(), relations = activeRelations(store, recommendationAt);
  const topicIds = new Map(registry.topics.map(topic => [topic.id, topic.replacedBy ?? topic.id]));
  await mkdir(dirname(destination), { recursive: true });
  const staging = await mkdtemp(join(dirname(destination), '.content-stage-'));
  const paths = new Map<string, string>();
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
    for (const row of store.db.prepare('SELECT path,body FROM feed_archive_files ORDER BY path').iterate() as Iterable<{ path: string; body: Buffer }>) {
      if (row.path === '_recommendations.json') continue;
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
      manifest.tag_labels = Object.fromEntries([...config.sources.map(source => ['source/' + source.id, source.name]), ...registry.topics.map(topic => ['topics/' + topic.id, topic.name[locale]])]);
      manifest.tag_aliases = Object.fromEntries(registry.topics.filter(topic => topic.replacedBy).map(topic => ['topics/' + topic.id, 'topics/' + topic.replacedBy]));
      if (!preserveManifest || !existsSync(join(staging, prefix + '_locale.yml'))) await write(prefix + '_locale.yml', JSON.stringify(manifest, null, 2));
      if (!existsSync(join(staging, prefix + 'index.md'))) await write(prefix + 'index.md', frontmatter({ publish: true, content_type: 'page', title: 'Feedgarden' }));
    }
    const archived = store.db.prepare(`SELECT a.path,a.source,a.id,a.en,a.zh FROM feed_archives a LEFT JOIN feed_summaries f ON f.source=a.source AND f.id=a.id LEFT JOIN feed_excluded e ON e.source=a.source AND e.id=a.id WHERE f.id IS NULL AND e.id IS NULL AND ${selectionClause('a', true)} ORDER BY a.path`);
    for (const row of archived.iterate() as Iterable<{ path: string; source: string; id: string; en: string; zh: string }>) {
      paths.set(row.path, JSON.stringify([row.source, row.id]));
      await preserve(row.path, renderArchivedMedia(row.en, 'en')); await preserve('_translations/zh-CN/' + row.path, renderArchivedMedia(row.zh, 'zh-CN'));
    }
    for (const record of iterateAcceptedItems(store)) {
        signal?.throwIfAborted();
        const { source, id } = record.item;
        const day = DateTime.fromISO(record.date, { zone: timezones.get(source) ?? 'Asia/Shanghai' }).toISODate();
        if (!day) throw new Error('Invalid item date: ' + source + '/' + id);
        itemPath(source, day, 1); // Validate directory components before reserving a number.
        const path = itemPath(source, day, store.itemNumber(source, id, day)), identity = JSON.stringify([source, id]);
        const previous = paths.get(path);
        if (previous && previous !== identity) throw new Error('Item path collision: ' + path);
        paths.set(path, identity);
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
  await atomicWrite(resolve(config.storage.directory, 'content-journal.json'), JSON.stringify({ destination, staging, previous }), signal);
  signal?.throwIfAborted();
  store.assertLease();
  if (existsSync(destination)) await rename(destination, previous);
  signal?.throwIfAborted();
  await rename(staging, destination);
  signal?.throwIfAborted();
  await recoverContent(config);
  store.setMeta(signatureKey, signature);
  return true;
}
