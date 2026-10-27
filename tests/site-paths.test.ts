import { storagePaths } from '../src/storage-paths.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, lstat, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { configSchema } from '../src/config.js';
import { Store } from '../src/store.js';
import { summarize, type Generator } from '../src/items.js';
import { writeSite } from '../src/site.js';
import type { Item } from '../src/types.js';

const at = '2026-10-09T10:00:00.000Z', nextDay = '2026-10-10T00:00:00.000Z';
const generator: Generator = async (_config, input, _repair, directory) => ({
  directory: directory!, usage: [], events: [], output: { contractVersion: 2, newTopics: [], items: input.items.map(item => ({
    source: item.source, id: item.id, topics: ['coding'],
    en: { title: item.title, summary: item.text }, 'zh-CN': { title: '中文 ' + item.title, summary: '来源事实。' },
  })) },
});
const item = (id: string, source = 'one', overrides: Partial<Item> = {}): Item => ({
  source, id, stream: 'main', channel: 'rss', title: 'Title ' + id, text: 'Source facts',
  url: 'https://example.test/' + encodeURIComponent(id), publishedAt: at, observedAt: at, basis: 'published', metrics: {}, ...overrides,
});
function save(store: Store, items: Item[]): void {
  for (const item of items) store.saveCollection(item.source, item.stream, item.channel, { items: [item], raw: [], coverage: { status: 'complete', to: item.observedAt, notes: [] } }, '');
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-paths-'));
  const topics = join(root, 'topics.json');
  await writeFile(topics, JSON.stringify({ version: 1, topics: [{ id: 'coding', name: { en: 'Coding', 'zh-CN': '编程' }, description: 'Developer tools', aliases: [], deprecated: false }] }));
  const config = configSchema.parse({ version: 2, storage: { root: root }, feed: { directory: join(root, 'content'), topics },
    agent: { model: 'deepseek/deepseek-flash' }, sources: ['one', 'two'].map(id => ({ id, name: id, timezone: id === 'two' ? 'America/Los_Angeles' : 'Asia/Shanghai', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'rss', kind: 'feed' }] }] })) });
  const store = new Store(storagePaths(config.storage).database); store.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
  return { config, store, cleanup: async () => { store.close(); await rm(root, { recursive: true, force: true }); } };
}

test('source/day numbers survive later arrivals, locale rendering and database reopening', async () => {
  const f = await fixture();
  try {
    await mkdir(join(f.config.feed.directory, 'items'), { recursive: true });
    await writeFile(join(f.config.feed.directory, 'items/old-hash.md'), 'Old layout');
    save(f.store, [item('b'), item('z'), item('la', 'two', { publishedAt: '2026-10-10T05:30:00.000Z' })]);
    await summarize(f.config, f.store, {}, generator, at); await writeSite(f.config, f.store);
    const original = await readFile(join(f.config.feed.directory, 'one/2026-10/09/item-1.md'), 'utf8');
    assert.match(original, /Title b/);
    assert.match(await readFile(join(f.config.feed.directory, 'two/2026-10/09/item-1.md'), 'utf8'), /Title la/);
    await assert.rejects(lstat(join(f.config.feed.directory, 'items')), { code: 'ENOENT' });
    save(f.store, [item('a'), item('next', 'one', { publishedAt: nextDay }), item('undated', 'one', { basis: 'observed', publishedAt: '2026-10-01T00:00:00.000Z', observedAt: nextDay })]);
    await summarize(f.config, f.store, {}, generator, at); await writeSite(f.config, f.store);
    assert.equal(await readFile(join(f.config.feed.directory, 'one/2026-10/09/item-1.md'), 'utf8'), original);
    for (const prefix of ['', '_translations/zh-CN/']) {
      for (const [path, title] of [['one/2026-10/09/item-2.md', 'Title z'], ['one/2026-10/09/item-3.md', 'Title a'], ['one/2026-10/10/item-1.md', 'Title next'], ['one/2026-10/10/item-2.md', 'Title undated']]) {
        assert.match(await readFile(join(f.config.feed.directory, prefix + path), 'utf8'), new RegExp(title!));
      }
    }
    const reservations = f.store.db.prepare('SELECT * FROM feed_item_paths ORDER BY source,day,number').all();
    assert.equal(reservations.length, 6);
    const reopened = new Store(storagePaths(f.config.storage).database);
    try { await writeSite(f.config, reopened); assert.deepEqual(reopened.db.prepare('SELECT * FROM feed_item_paths ORDER BY source,day,number').all(), reservations); }
    finally { reopened.close(); }
    assert.equal(await readFile(join(f.config.feed.directory, 'one/2026-10/09/item-1.md'), 'utf8'), original);
  } finally { await f.cleanup(); }
});

test('a corrected date moves an item while retaining every previous number reservation', async () => {
  const f = await fixture();
  try {
    save(f.store, [item('moving'), item('stays')]);
    await summarize(f.config, f.store, {}, generator, at); await writeSite(f.config, f.store);
    save(f.store, [item('moving', 'one', { publishedAt: nextDay })]);
    await summarize(f.config, f.store, {}, () => { throw new Error('Date changes reuse accepted text'); }, at); await writeSite(f.config, f.store);
    await assert.rejects(lstat(join(f.config.feed.directory, 'one/2026-10/09/item-1.md')), { code: 'ENOENT' });
    assert.match(await readFile(join(f.config.feed.directory, 'one/2026-10/10/item-1.md'), 'utf8'), /Title moving/);
    save(f.store, [item('fresh')]); await summarize(f.config, f.store, {}, generator, at); await writeSite(f.config, f.store);
    assert.match(await readFile(join(f.config.feed.directory, 'one/2026-10/09/item-2.md'), 'utf8'), /Title stays/);
    assert.match(await readFile(join(f.config.feed.directory, 'one/2026-10/09/item-3.md'), 'utf8'), /Title fresh/);
    save(f.store, [item('moving')]); await summarize(f.config, f.store, {}, () => { throw new Error('Returning dates reuse accepted text'); }, at); await writeSite(f.config, f.store);
    assert.match(await readFile(join(f.config.feed.directory, 'one/2026-10/09/item-1.md'), 'utf8'), /Title moving/);
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_item_paths').get() as { n: number }).n, 4);
  } finally { await f.cleanup(); }
});

test('a failed render keeps its number reservation and reuses it on retry', async () => {
  const f = await fixture();
  try {
    save(f.store, [item('a')]); await summarize(f.config, f.store, {}, generator, at); await writeSite(f.config, f.store);
    const original = await readFile(join(f.config.feed.directory, 'one/2026-10/09/item-1.md'), 'utf8');
    save(f.store, [item('b')]); await summarize(f.config, f.store, {}, generator, at);
    const row = f.store.db.prepare("SELECT accepted FROM feed_summaries WHERE id='b'").get() as { accepted: string };
    const accepted = JSON.parse(row.accepted); accepted.copy.topics = ['missing-topic'];
    f.store.db.prepare("UPDATE feed_summaries SET accepted=? WHERE id='b'").run(JSON.stringify(accepted));
    await assert.rejects(writeSite(f.config, f.store), /Unknown stored topic/);
    assert.equal(await readFile(join(f.config.feed.directory, 'one/2026-10/09/item-1.md'), 'utf8'), original);
    assert.equal(f.store.itemNumber('one', 'b', '2026-10-09'), 2);
    accepted.copy.topics = ['coding'];
    f.store.db.prepare("UPDATE feed_summaries SET accepted=? WHERE id='b'").run(JSON.stringify(accepted));
    await writeSite(f.config, f.store);
    assert.match(await readFile(join(f.config.feed.directory, 'one/2026-10/09/item-2.md'), 'utf8'), /Title b/);
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_item_paths').get() as { n: number }).n, 2);
  } finally { await f.cleanup(); }
});
