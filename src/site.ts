import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rename, rm, writeFile, readFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import type { Config } from './config.js';
import { Store } from './store.js';
import { iterateAcceptedItems, itemPath, type AcceptedItem } from './items.js';
import { loadTopics, resolveTopic } from './topics.js';
import { atomicWrite, safeUrl } from './util.js';

function escapeMarkdown(value: string): string { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_[\]{}()#!|$~]/g, char => `&#${char.charCodeAt(0)};`).replace(/\b([a-z][a-z0-9+.-]*):(?=\/\/)/gi, '$1&#58;').replace(/[\r\n]+/g, ' ').trim(); }
function frontmatter(properties: Record<string, unknown>): string { return `---\n${Object.entries(properties).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n`; }
export function renderItem(record: AcceptedItem, locale: 'en' | 'zh-CN', topics = record.copy.topics): string {
  const { item, copy } = record, translation = copy[locale];
  const summary = translation.summary.trim().split(/\n\s*\n/).map(paragraph => paragraph.split('\n').map(line => /^\s*[-*]\s+/.test(line) ? '- ' + escapeMarkdown(line.replace(/^\s*[-*]\s+/, '')) : escapeMarkdown(line)).join('\n')).join('\n\n');
  const media = (copy.media ?? []).map(id => item.media?.find(candidate => candidate.id === id)).filter(candidate => !!candidate).map(candidate => {
    const type = locale === 'en' ? candidate.type === 'image' ? 'Image' : 'Video' : candidate.type === 'image' ? '图片' : '视频';
    return '- [' + escapeMarkdown(type + (candidate.title ? ': ' + candidate.title : '')) + '](<' + safeUrl(candidate.url).replace(/[<>]/g, char => encodeURIComponent(char)) + '>)';
  });
  const body = summary + (media.length ? '\n\n## ' + (locale === 'en' ? 'Images and video' : '图片与视频') + '\n\n' + media.join('\n') : '');
  return frontmatter({ publish: true, content_type: 'post', title: translation.title, description: [...translation.summary.replace(/\s+/g, ' ')].slice(0, 240).join(''), date: record.date, updated: record.updated, first_seen: record.firstSeen, date_basis: record.dateBasis, source_url: safeUrl(item.url), tags: ['source/' + item.source, ...topics.map(id => 'topics/' + id)] }) + body + '\n';
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
export async function writeSite(config: Config, store: Store, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  await recoverContent(config);
  const registry = await loadTopics(config.feed.topics);
  const destination = resolve(config.feed.directory);
  await mkdir(dirname(destination), { recursive: true });
  const staging = await mkdtemp(join(dirname(destination), '.content-stage-'));
  const paths = new Map<string, string>();
  const directories = new Set<string>();
  try {
    async function write(path: string, body: string): Promise<void> {
      signal?.throwIfAborted();
      const file = join(staging, path), directory = dirname(file);
      if (!directories.has(directory)) { await mkdir(directory, { recursive: true }); directories.add(directory); }
      await writeFile(file, body.trimEnd() + '\n');
    }
    for (const locale of ['en', 'zh-CN'] as const) {
      const prefix = locale === 'zh-CN' ? '_translations/zh-CN/' : '';
      const manifest = JSON.parse(await readFile('config/locales/' + locale + '.json', 'utf8'));
      manifest.tag_labels = Object.fromEntries([...config.sources.map(source => ['source/' + source.id, source.name]), ...registry.topics.map(topic => ['topics/' + topic.id, topic.name[locale]])]);
      manifest.tag_aliases = Object.fromEntries(registry.topics.filter(topic => topic.replacedBy).map(topic => ['topics/' + topic.id, 'topics/' + topic.replacedBy]));
      await write(prefix + '_locale.yml', JSON.stringify(manifest, null, 2));
      await write(prefix + 'index.md', frontmatter({ publish: true, content_type: 'page', title: 'Feedgarden' }));
      for (const record of iterateAcceptedItems(store)) {
        const path = itemPath(record.item.source, record.item.id), identity = JSON.stringify([record.item.source, record.item.id]);
        const previous = paths.get(path);
        if (previous && previous !== identity) throw new Error('Item path hash collision: ' + path);
        paths.set(path, identity);
        await write(prefix + path, renderItem(record, locale, [...new Set(record.copy.topics.map(id => resolveTopic(registry, id)))]));
      }
    }
    signal?.throwIfAborted();
  } catch (error) { await rm(staging, { recursive: true, force: true }); throw error; }
  const previous = destination + '.previous-' + Date.now();
  await atomicWrite(resolve(config.storage.directory, 'content-journal.json'), JSON.stringify({ destination, staging, previous }), signal);
  signal?.throwIfAborted();
  if (existsSync(destination)) await rename(destination, previous);
  signal?.throwIfAborted();
  await rename(staging, destination);
  signal?.throwIfAborted();
  await recoverContent(config);
}
