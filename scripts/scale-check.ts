import assert from 'node:assert/strict';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { DateTime } from 'luxon';
import { loadConfig } from '../src/config.js';
import { Store } from '../src/store.js';
import { periodFor, reportKey } from '../src/period.js';
import { writeSite } from '../src/site.js';
import { buildSite } from '../src/build-site.js';
import type { Item } from '../src/types.js';

const root = resolve('.local/scale-workspace'), c = loadConfig(), started = Date.now();
const inspect = process.argv.includes('--inspect');
if (!inspect) {
c.sources = c.sources.filter(source => source.enabled);
assert.ok(c.sources.length, 'Scale validation requires an enabled source');
c.storage.directory = join(root, '.local'); c.storage.database = join(c.storage.directory, 'fixture.sqlite'); c.reports.directory = join(root, 'reports');
await mkdir(join(root, '.github'), { recursive: true });
await cp('.github/jekyll-obsidian.yml', join(root, '.github/jekyll-obsidian.yml'));
await cp('.github/theme.lock.json', join(root, '.github/theme.lock.json'));
const store = new Store(c.storage.database);
try {
  store.db.transaction(() => {
    for (let index = 0; index < 3008; index++) {
      const source = c.sources[index % c.sources.length]!;
      const date = DateTime.fromISO('2025-01-01').plus({ days: Math.floor(index / c.sources.length) }).toISODate()!;
      const period = periodFor(source, 'daily', date);
      const items: Item[] = Array.from({ length: 50 }, (_, i) => ({ id: String(index) + '-' + i, source: source.id, stream: source.streams[0]!.id, channel: 'scale-fixture', title: 'Scale fixture item ' + i,
        text: 'Synthetic fixture for build validation. No real announcement is represented. '.repeat(4), url: 'https://example.invalid/' + index + '/' + i,
        publishedAt: period.start, observedAt: period.start, basis: 'published', metrics: {} }));
      store.saveReport(reportKey(period), { period, items, createdAt: period.end, frozenScores: {}, coverage: { status: 'complete', from: period.start, to: period.end, notes: [] } }, items.map(item => ({ id: item.id, en: { title: item.title, summary: item.text }, 'zh-CN': { title: '构建测试条目 ' + item.id, summary: '用于检查站点构建的合成素材，不代表真实新闻。'.repeat(6) } })), 'sealed');
    }
  })();
  await writeSite(c, store);
} finally { store.close(); }
}
const output = inspect ? join(root, '.jekyll-obsidian-cache/site') : await buildSite(root), results: unknown[] = [];
for (const prefix of ['', 'zh-CN/']) {
  const json = await readFile(join(output, 'assets/website', prefix ? 'i18n/zh-CN/search.v1.json' : 'search.v1.json'), 'utf8');
  const documents = JSON.parse(json).documents as { text: string }[];
  assert.equal(documents.length, 3000); assert.ok(documents.every(doc => doc.text.length <= 240));
  const feed = await readFile(join(output, prefix, 'feed.xml'), 'utf8');
  assert.equal((feed.match(/<entry>/g) ?? []).length, 100);
  results.push({ locale: prefix || 'en', searchEntries: documents.length, searchBytes: Buffer.byteLength(json), feedEntries: 100, feedBytes: Buffer.byteLength(feed) });
}
const evidence = { reportMarkdownFiles: 6016, itemsPerReport: 50, ...(inspect ? { inspectedExistingBuild: true, timingLog: '.local/notes/0929/scale-check.log' } : { elapsedSeconds: (Date.now() - started) / 1000 }), output, results };
await writeFile('.local/notes/0929/scale-check.json', JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
