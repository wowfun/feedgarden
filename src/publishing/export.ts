import { DateTime } from 'luxon';
import { mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { itemPath, iterateAcceptedItems, renderItem, writeSite } from '../content/index.js';
import type { Target } from '../contracts/publishing.js';
import type { InstanceContext } from '../instance/index.js';
import { assertExportDirectory } from '../instance/index.js';
import { atomicWrite } from '../platform/files.js';
import { hash } from '../platform/hash.js';
import type { Storage } from '../storage/index.js';
import { ensureSafe, tree } from './filesystem.js';
import type { Entry } from './targets.js';
export async function exportTarget(
  config: InstanceContext,
  store: Storage,
  target?: Target,
  options: { output?: string; format?: Target['format']; rebuild?: boolean; signal?: AbortSignal } = {},
) {
  const format = options.format ?? target?.format ?? 'markdown',
    output = resolve(
      options.output ??
      target?.output ??
      join(config.paths.dataDir, 'exports', target?.id ?? 'manual'),
    );
  assertExportDirectory(config.paths, output);
  const entries: Record<string, Entry> = {};
  if (format === 'jekyll') {
    const rendered = { ...config, feed: { ...config.feed, directory: output } };
    await writeSite(rendered, store, options.signal, options.rebuild);
    for (const [path, body] of Object.entries(await tree(output))) {
      const match = /^(?:_translations\/zh-CN\/)?([a-z0-9_-]+)\/(\d{4}-\d{2})\/(\d{2})\/item-(\d+)\.md$/.exec(
        path,
      );
      const identity = match
        ? store.archives.reservedIdentity(match[1]!, match[2] + '-' + match[3], Number(match[4]))
        : undefined;
      entries[path] = { hash: hash(body), ...(identity ? { identity } : {}) };
    }
  } else {
    await mkdir(output, { recursive: true });
    for (const record of iterateAcceptedItems(store)) {
      options.signal?.throwIfAborted();
      store.assertLease();
      const day = DateTime.fromISO(record.date)
        .setZone(config.sources.find((s) => s.id === record.item.source)?.timezone ?? config.timezone)
        .toISODate()!;
      const path = itemPath(
        record.item.source,
        day,
        store.itemNumber(record.item.source, record.item.id, day),
      );
      const files =
        format === 'json'
          ? {
            [path.replace(/\.md$/, '.json')]:
              JSON.stringify({ schemaVersion: 1, evidenceTrust: 'untrusted', ...record }, null, 2) + '\n',
          }
          : {
            [path]: renderItem(record, 'en'),
            ['_translations/zh-CN/' + path]: renderItem(record, 'zh-CN'),
          };
      for (const [name, body] of Object.entries(files)) {
        await atomicWrite(await ensureSafe(output, name), body, options.signal);
        entries[name] = {
          hash: hash(Buffer.from(body)),
          identity: { source: record.item.source, id: record.item.id },
        };
      }
    }
    await atomicWrite(
      join(output, 'topics.json'),
      await readFile(config.feed.topics, 'utf8'),
      options.signal,
    );
    entries['topics.json'] = { hash: hash(await readFile(join(output, 'topics.json'))) };
  }
  const receipt = { output, format, entries };
  await atomicWrite(
    join(config.paths.targets, target?.id ?? 'manual', 'export.json'),
    JSON.stringify(receipt),
  );
  return receipt;
}
