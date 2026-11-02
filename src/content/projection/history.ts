import { createHash } from 'node:crypto';
import type { AcceptedItem } from '../../contracts/content.js';
import { git, gitBlobs, gitRecords } from '../../platform/git.js';
import { parseFrontmatter, type Frontmatter } from '../frontmatter.js';

export const canonical = (path: string) => path.replace(/^_translations\/[^/]+\//, '');
export const numbered = (path: string) => /^([a-z0-9_-]+)\/(\d{4}-\d{2}\/\d{2})\/item-(\d+)\.(?:md|json)$/.exec(canonical(path));
export const identityKey = (source: string, id: string) => JSON.stringify([source, id]);

export function itemDocument(path: string, text: string): { fields: Record<string, unknown>; front?: Frontmatter } | undefined {
  try {
    if (path.endsWith('.json')) {
      const fields = JSON.parse(text);
      if (fields && typeof fields === 'object' && !Array.isArray(fields)) return { fields };
    } else if (path.endsWith('.md')) {
      const front = parseFrontmatter(text);
      if (front) return { fields: front.fields, front };
    }
  } catch { /* Invalid authored files are opaque to generation. */ }
}

/** Transient identity hints only. Never persisted or consulted by publication. */
export function identifyItem(records: AcceptedItem[]) {
  const links = new Map<string, Set<string>>();
  for (const { item } of records) for (const url of [item.url, item.discussion?.url]) {
    if (!url) continue;
    const key = identityKey(item.source, url), ids = links.get(key) ?? new Set();
    ids.add(identityKey(item.source, item.id)); links.set(key, ids);
  }
  return (path: string, value: Record<string, unknown>): string | undefined => {
    const match = numbered(path);
    if (!/\.(md|json)$/.test(path)) return;
    try {
      const item = value.item;
      if (item && typeof item === 'object' && 'source' in item && typeof item.source === 'string' && 'id' in item && typeof item.id === 'string')
        return identityKey(item.source, item.id);
      if (typeof value.feed_source === 'string' && typeof value.feed_source_id === 'string') return identityKey(value.feed_source, value.feed_source_id);
      const tagged = Array.isArray(value.tags) ? value.tags.filter((tag: unknown) => typeof tag === 'string' && tag.startsWith('source/')) : [];
      const source = typeof value.feed_source === 'string' ? value.feed_source : match?.[1] ?? (tagged.length === 1 ? tagged[0].slice(7) : undefined);
      if (!source) return;
      if (source === 'hackernews' && typeof value.discussion_url === 'string') {
        const url = new URL(value.discussion_url), id = url.searchParams.get('id');
        if (url.hostname === 'news.ycombinator.com' && /^\d+$/.test(id ?? '')) return identityKey(source, id!);
      }
      if (source === 'reddit' && typeof value.source_url === 'string') {
        const url = new URL(value.source_url), id = /\/comments\/([a-z0-9]+)/i.exec(url.pathname)?.[1];
        if (/(^|\.)reddit\.com$/.test(url.hostname) && id) return identityKey(source, 't3_' + id);
      }
      const ids = new Set<string>();
      for (const url of [value.source_url, value.source, value.discussion_url]) if (typeof url === 'string')
        for (const id of links.get(identityKey(source, url)) ?? []) ids.add(id);
      return ids.size === 1 ? [...ids][0] : undefined;
    } catch { return; }
  };
}

/** Paths reserve numbering without reading bodies. Identity bodies are lazy and
 * only needed when generation cannot already identify its inputs on disk. */
export async function itemHistory(output: string, signal?: AbortSignal) {
  const paths = new Set<string>(), blobs = new Map<string, Set<string>>();
  const inWorktree = await git(['rev-parse', '--is-inside-work-tree'], output, signal).catch(() => undefined) === 'true';
  signal?.throwIfAborted();
  let algorithm = 'sha1';
  if (inWorktree) {
    let header: RegExpExecArray | null = null;
    await gitRecords(['log', '--all', '--relative', '--format=', '--raw', '--no-abbrev', '--no-renames', '-z', '--', '.'], output, record => {
      if (!header) {
        header = /^\s*:(\d+) (\d+) ([a-f0-9]+) ([a-f0-9]+) [A-Z]\d*$/.exec(record);
        return;
      }
      const modes = header;
      header = null;
      const path = record;
      if (!/\.(md|json)$/.test(path) || canonical(path).split('/').some(part => part.startsWith('.') || part.startsWith('_')) || path.endsWith('/topics.json') || path === 'topics.json') return;
      paths.add(path);
      for (const [oid, mode] of [[modes[4]!, modes[2]!], [modes[3]!, modes[1]!]] as const) {
        // Links and submodules reserve numbers but have no article body.
        if (!/^100(?:644|755)$/.test(mode) || /^0+$/.test(oid)) continue;
        if (oid.length === 64) algorithm = 'sha256';
        const names = blobs.get(oid) ?? new Set();
        names.add(path);
        blobs.set(oid, names);
      }
    }, signal);
  }
  function observed(path: string, bytes: Buffer) {
    if (!paths.has(path)) return;
    // Only skip a historical version when the same path's exact Git blob has
    // already been inspected in this run. Filters and CRLF differences miss safely.
    const oid = createHash(algorithm).update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
    const names = blobs.get(oid);
    if (names?.delete(path) && !names.size) blobs.delete(oid);
  }
  async function* items(): AsyncGenerator<[string, Buffer]> {
    if (!inWorktree) return;
    for await (const { oid, body } of gitBlobs([...blobs.keys()], output, signal))
      for (const path of blobs.get(oid)!) yield [path, body];
  }
  return { paths, observed, items };
}
