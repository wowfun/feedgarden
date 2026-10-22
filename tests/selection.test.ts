import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { hash } from '../src/util.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { configSchema } from '../src/config.js';
import { Store } from '../src/store.js';
import { Http, HttpError } from '../src/http.js';
import { hnScore, redditRanking, redditScore } from '../src/scoring.js';
import { candidatesFor, historicalWindow, orderCandidates, reconcileSelection, selectionDay } from '../src/selection.js';
import { parseFeed } from '../src/channels/parsers.js';
import { rankItems } from '../src/rank.js';
import { archiveManifestSignature, importArchives, maintainArchive } from '../src/archives.js';
import { summarize, acceptedItems, type Generator } from '../src/items.js';
import { writeSite } from '../src/site.js';
import { collect } from '../src/collect.js';
import { adapters } from '../src/channels/index.js';
import type { Collection, Item } from '../src/types.js';

const at = '2026-10-13T04:00:00.000Z';
const publishedAt = '2026-10-09T01:00:00.000Z';
const item = (source: string, id: string, overrides: Partial<Item> = {}): Item => ({ source, id, stream: source === 'reddit' ? 'large' : 'frontpage', channel: 'primary', title: 'Post ' + id,
  url: source === 'reddit' ? `https://www.reddit.com/r/large/comments/${id.replace(/^t3_/, '')}/title/` : `https://news.ycombinator.com/item?id=${id}`,
  text: 'Supplied source facts.', publishedAt, observedAt: at, basis: 'published', metrics: { score: 10, comments: 2 }, ...overrides });
function save(store: Store, rows: Item[], ranking?: Collection['ranking']): void {
  for (const row of rows) store.saveCollection(row.source, row.stream, row.channel, { items: [row], raw: [], coverage: { status: 'complete', to: row.observedAt, notes: [] }, ...(ranking ? { ranking } : {}) }, '');
}
async function fixture(limit = 50) {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-selection-'));
  const topics = join(root, 'topics.json');
  await writeFile(topics, JSON.stringify({ version: 1, topics: [{ id: 'coding', name: { en: 'Coding', 'zh-CN': '编程' }, description: 'Developer tools', aliases: [], deprecated: false }] }));
  const config = configSchema.parse({ version: 2, storage: { directory: root, database: join(root, 'data.sqlite') }, feed: { directory: join(root, 'content'), topics },
    agent: { model: 'fixture', runtimeDirectory: join(root, 'tasks') }, sources: [
      { id: 'hackernews', name: 'HN', intervalHours: 1, selection: { method: 'hn-engagement', dailyLimit: limit }, streams: [{ id: 'frontpage', channels: [{ id: 'primary', kind: 'hn-api' }] }] },
      { id: 'reddit', name: 'Reddit', intervalHours: 12, selection: { method: 'reddit-rss-percentile', dailyLimit: limit }, streams: ['large', 'small'].map(id => ({ id, channels: [{ id: 'primary', kind: 'feed', url: `https://www.reddit.com/r/${id}/top.rss?t=week&limit=100` }] })) },
    ] });
  const store = new Store(config.storage.database); store.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
  return { root, config, store, cleanup: async () => { store.close(); await rm(root, { recursive: true, force: true }); } };
}
const generator: Generator = async (_agent, input, _repair, directory) => ({ directory: directory!, events: [], usage: [], output: { contractVersion: 2, newTopics: [], items: input.items.map(row => ({ source: row.source, id: row.id, topics: ['coding'], en: { title: row.title, summary: row.text }, 'zh-CN': { title: '中文 ' + row.title, summary: row.text ? '提供的事实。' : '' } })) } });
const feed = (entries: string[]) => '<feed>' + entries.join('') + '</feed>';
const entry = (id: string, stream = 'large') => `<entry><id>t3_${id}</id><title>Post ${id}</title><link href="https://www.reddit.com/r/${stream}/comments/${id}/title/"/><published>${publishedAt}</published></entry>`;

test('heat formulas clamp negative HN counters and distinguish unknown metrics from zero', () => {
  assert.equal(hnScore(0, 0), 0); assert.equal(hnScore(-20, -5), 0);
  assert.equal(hnScore(100, 20), 0.75 * Math.log1p(100) + 0.25 * Math.log1p(20));
  for (const missing of [null, undefined, NaN, Infinity]) assert.equal(hnScore(missing, 2), undefined);
  assert.equal(hnScore(2, null), undefined);
  assert.equal(redditScore(1, 100), 100); assert.equal(redditScore(100, 100), 1); assert.equal(redditScore(1, 1), 100);
  assert.throws(() => redditScore(0, 100)); assert.throws(() => redditScore(101, 100));
});

test('Reddit top RSS uses original sample size and positions; new RSS order is not heat', () => {
  const context = { source: 'reddit', stream: 'large', channel: 'rss', observedAt: at };
  const body = feed([entry('a'), '<entry><title>Broken</title></entry>', entry('b')]);
  const notes: string[] = [], rows = parseFeed(body, context, notes, 'week');
  assert.equal(rows.length, 2); assert.equal(rows[1]!.ranking!.rank, 3); assert.equal(rows[1]!.ranking!.size, 3);
  assert.equal(rows[1]!.ranking!.score, 100 / 3); assert.match(notes.join(' '), /malformed/);
  assert.equal(parseFeed(feed([entry('a')]), context)[0]!.ranking, undefined);
  assert.equal(rows[0]!.id, 't3_a');
});

test('Shanghai dates, stable observed dates, tie order and historical RSS windows are explicit', () => {
  const row = item('hackernews', '1', { publishedAt: '2026-10-08T16:00:00.000Z' });
  assert.equal(selectionDay(row, at, 'Asia/Shanghai'), '2026-10-09');
  assert.equal(selectionDay({ ...row, publishedAt: '2026-10-08T15:59:59.999Z' }, at, 'Asia/Shanghai'), '2026-10-08');
  assert.equal(selectionDay({ ...row, basis: 'observed' }, '2026-10-08T16:00:00Z', 'Asia/Shanghai'), '2026-10-09');
  const candidates = ['b', 'a'].map(id => ({ item: item('reddit', 't3_' + id), firstSeen: at, day: '2026-10-09', ranking: redditRanking(1, 1, at, 'week') }));
  candidates.push({ item: item('reddit', 't3_new', { publishedAt: at }), firstSeen: at, day: '2026-10-13', ranking: undefined as never });
  assert.deepEqual(orderCandidates(candidates).map(row => row.item.id), ['t3_a', 't3_b', 't3_new']);
  assert.equal(historicalWindow('2026-10-07', at, 'Asia/Shanghai'), 'week');
  assert.equal(historicalWindow('2026-10-06', at, 'Asia/Shanghai'), 'month');
  assert.equal(historicalWindow('2026-09-01', at, 'Asia/Shanghai'), 'year');
  assert.equal(historicalWindow('2025-10-01', at, 'Asia/Shanghai'), 'all');
});

test('store item ranges use instants consistently with selection for offset timestamps', async () => {
  const f = await fixture(); try {
    save(f.store, [item('hackernews', '1', { publishedAt: '2026-10-09T08:30:00+08:00' }), item('hackernews', '2', { publishedAt: '2026-10-09T02:00:00Z' })]);
    assert.deepEqual(f.store.items('hackernews', '2026-10-09T00:00:00Z', '2026-10-09T01:00:00Z').map(row => row.id), ['1']);
  } finally { await f.cleanup(); }
});

test('platform/day caps combine communities and retain all private candidates', async () => {
  const f = await fixture(); try {
    const hn = Array.from({ length: 120 }, (_, i) => item('hackernews', String(i + 1), { publishedAt: i < 60 ? publishedAt : '2026-10-09T16:00:00Z', metrics: { score: i, comments: 0 } }));
    save(f.store, hn);
    const reddit = Array.from({ length: 80 }, (_, i) => item('reddit', 't3_r' + i, { stream: i < 40 ? 'large' : 'small', ranking: redditRanking(i % 40 + 1, i < 40 ? 100 : 40, at, 'week') }));
    save(f.store, reddit, { method: 'reddit-rss-percentile', window: 'week', size: 100 });
    const reports = reconcileSelection(f.config, f.store, { at });
    assert.deepEqual(reports.map(row => row.kept.length), [50, 50, 50]);
    assert.equal(f.store.items('hackernews').length, 120); assert.equal(f.store.items('reddit').length, 80);
    assert.ok(reports[2]!.kept.includes('t3_r40'), 'small-community first place is eligible');
    assert.equal(f.store.items('hackernews').find(row => row.id === '11')!.metrics.score, 10, 'native score is retained separately');
    const version = f.store.meta('content_version'); reconcileSelection(f.config, f.store, { at }); assert.equal(f.store.meta('content_version'), version);
    const previous = reports[0]!.kept;
    save(f.store, [item('hackernews', '1', { observedAt: '2026-10-21T00:00:00Z', metrics: { score: 100000, comments: 1000 } })]);
    reconcileSelection(f.config, f.store, { at: '2026-10-21T00:00:00Z' });
    const frozen = f.store.db.prepare("SELECT id FROM feed_selection WHERE source='hackernews' AND day='2026-10-09' AND selected=1 ORDER BY id").all() as { id: string }[];
    assert.deepEqual(frozen.map(row => row.id), [...previous].sort(), 'older days stay frozen without loading their full candidate history');
    assert.ok(reconcileSelection(f.config, f.store, { at: '2026-10-21T00:00:00Z', history: true })[0]!.kept.includes('1'));
  } finally { await f.cleanup(); }
});

test('only selected candidates are processed while published copies survive reranking without ACP', async () => {
  const f = await fixture(); try {
    save(f.store, Array.from({ length: 60 }, (_, i) => item('hackernews', String(i + 1), { metrics: { score: i + 1, comments: 0 } })));
    let prepared = 0, generated = 0;
    const prepare = async (row: Item) => { prepared++; return row; };
    const generate: Generator = async (...args) => { generated += args[1].items.length; return generator(...args); };
    await summarize(f.config, f.store, { source: 'hackernews' }, generate, at, prepare);
    assert.equal(prepared, 50); assert.equal(generated, 50); assert.equal(acceptedItems(f.store).length, 50);
    await writeSite(f.config, f.store);
    const original = await readFile(join(f.config.feed.directory, 'hackernews/2026-10/09/item-1.md'));
    save(f.store, [item('hackernews', '1', { metrics: { score: 10000, comments: 1000 } })]);
    await summarize(f.config, f.store, { source: 'hackernews' }, generate, at, prepare);
    assert.equal(generated, 51); assert.equal(acceptedItems(f.store).length, 51); assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_summaries').get() as { n: number }).n, 51);
    assert.ok(!f.store.isSelected('hackernews', '11'));
    await writeSite(f.config, f.store);
    assert.deepEqual(await readFile(join(f.config.feed.directory, 'hackernews/2026-10/09/item-1.md')), original);
    save(f.store, [item('hackernews', '1', { metrics: { score: 0, comments: 0 } })]);
    await summarize(f.config, f.store, { source: 'hackernews' }, () => { throw new Error('Ready summaries must be reused'); }, at, prepare);
    assert.ok(f.store.isSelected('hackernews', '11')); assert.equal(acceptedItems(f.store).length, 51);
    await writeSite(f.config, f.store);
    const paths = (await readdir(join(f.config.feed.directory, 'hackernews/2026-10/09'))).filter(path => path.endsWith('.md'));
    assert.equal(paths.length, 51); assert.equal((await readdir(join(f.config.feed.directory, '_translations/zh-CN/hackernews/2026-10/09'))).length, 51);
    f.store.db.prepare("INSERT INTO feed_excluded VALUES ('hackernews','11')").run();
    await writeSite(f.config, f.store);
    assert.equal(acceptedItems(f.store).length, 50, 'explicit exclusion still removes a published item');
  } finally { await f.cleanup(); }
});

test('a selected item corrected into a frozen day cannot leak its stale accepted copy above the cap', async () => {
  const f = await fixture(1); try {
    save(f.store, [item('hackernews', '1', { metrics: { score: 100, comments: 10 } }), item('hackernews', '2')]);
    await summarize(f.config, f.store, { source: 'hackernews' }, generator, at, async row => row);
    save(f.store, [item('hackernews', '1', { publishedAt: '2026-10-01T00:00:00Z', metrics: { score: 100, comments: 10 } })]);
    await summarize(f.config, f.store, { source: 'hackernews' }, generator, at, async row => row);
    assert.deepEqual(acceptedItems(f.store).map(row => row.item.id), ['2']);
  } finally { await f.cleanup(); }
});

async function archive(f: Awaited<ReturnType<typeof fixture>>, source: string, count: number): Promise<Map<string, string>> {
  const originals = new Map<string, string>();
  for (let i = 1; i <= count; i++) {
    const id = source === 'hackernews' ? String(1000 + i) : 'r' + i, stream = i % 2 ? 'large' : 'small';
    const url = source === 'hackernews' ? `https://publisher.example/article/${id}` : `https://www.reddit.com/r/${stream}/comments/${id}/title/`;
    const path = `${source}/2026-10/09/item-${i}.md`;
    for (const [prefix, text] of [['', 'Existing English body'], ['_translations/zh-CN/', '已有中文正文']] as const) {
      const body = `---\npublish: true\ncontent_type: "post"\ntitle: "Old ${id}"\ndate: "${publishedAt}"\nfirst_seen: "${publishedAt}"\ndate_basis: "published"\nsource_url: "${url}"\n${source === 'hackernews' ? `discussion_url: "https://news.ycombinator.com/item?id=${id}"\n` : ''}tags: ["source/${source}","topics/coding"]\n---\n\n${text} ${id}\n\n`;
      await mkdir(join(f.config.feed.directory, prefix, source, '2026-10/09'), { recursive: true });
      await writeFile(join(f.config.feed.directory, prefix + path), body); originals.set(prefix + path, body);
    }
  }
  return originals;
}

test('explicit refresh enriches selected archived items while default runs reuse their bytes', async () => {
  const f = await fixture(1); try {
    await archive(f, 'hackernews', 2);
    await rankItems(f.config, f.store, { source: 'hackernews', history: true, at }, rankingHttp(f.store).http);
    let prepared = 0;
    const prepare = async (row: Item) => { prepared++; return { ...row, text: 'Refreshed facts' }; };
    const initial = await summarize(f.config, f.store, { source: 'hackernews' }, generator, at, prepare);
    assert.equal(initial.generated, 0); assert.equal(prepared, 0);
    const refreshed = await summarize(f.config, f.store, { source: 'hackernews', refresh: true }, generator, at, prepare);
    assert.equal(refreshed.generated, 1); assert.equal(prepared, 1);
    await summarize(f.config, f.store, { source: 'hackernews' }, () => { throw new Error('Stable refreshed input reuses its summary'); }, '2026-10-13T05:01:00.000Z', prepare);
    assert.equal(prepared, 2, 'regenerated archive summaries resume their normal periodic enrichment');
    await writeSite(f.config, f.store);
    assert.match(await readFile(join(f.config.feed.directory, 'hackernews/2026-10/09/item-2.md'), 'utf8'), /Refreshed facts/);
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_archives').get() as { n: number }).n, 2);
  } finally { await f.cleanup(); }
});

test('a batch deselected before acceptance keeps its copy privately and completes its jobs', async () => {
  const f = await fixture(1); try {
    save(f.store, [item('hackernews', '1')]);
    const deselect: Generator = async (...args) => {
      f.store.db.prepare("UPDATE feed_selection SET selected=0 WHERE source='hackernews'").run();
      return generator(...args);
    };
    const result = await summarize(f.config, f.store, { source: 'hackernews' }, deselect, at, async row => row);
    assert.equal(result.generated, 0); assert.deepEqual(acceptedItems(f.store), []);
    assert.equal((f.store.db.prepare('SELECT state FROM feed_jobs').get() as { state: string }).state, 'ready');
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_summaries').get() as { n: number }).n, 1);
    await summarize(f.config, f.store, { source: 'hackernews' }, () => { throw new Error('Reuse completed private copy'); }, at, async row => row);
    assert.equal(acceptedItems(f.store).length, 1);
  } finally { await f.cleanup(); }
});

test('malformed bilingual archives are preserved and defer only the affected platform/day', async () => {
  const f = await fixture(1); try {
    const originals = await archive(f, 'hackernews', 2);
    await rm(join(f.config.feed.directory, '_translations/zh-CN/hackernews/2026-10/09/item-2.md'));
    await importArchives(f.config, f.store);
    save(f.store, [item('hackernews', '2', { publishedAt: at })]);
    save(f.store, [item('reddit', 't3_a', { ranking: redditRanking(1, 1, at, 'week') })], { method: 'reddit-rss-percentile', window: 'week', size: 1 });
    const reports = await rankItems(f.config, f.store, { history: true, at }, rankingHttp(f.store).http);
    assert.equal(reports[0]!.status, 'deferred');
    assert.match(reports[0]!.notes.join(' '), /Missing Chinese archive copy/);
    assert.deepEqual(reports.slice(1).map(report => report.status), ['selected', 'selected']);
    await writeSite(f.config, f.store);
    assert.equal(await readFile(join(f.config.feed.directory, 'hackernews/2026-10/09/item-2.md'), 'utf8'), originals.get('hackernews/2026-10/09/item-2.md'));
    assert.equal((f.store.db.prepare("SELECT count(*) n FROM gaps WHERE channel='archive'").get() as { n: number }).n, 1);
  } finally { await f.cleanup(); }
});

test('malformed archive numbers are quarantined before path reservation constraints', async () => {
  const f = await fixture(); try {
    const originals = await archive(f, 'hackernews', 1);
    for (const [path, body] of originals) {
      await rm(join(f.config.feed.directory, path));
      await writeFile(join(f.config.feed.directory, path.replace('item-1.md', 'item-0.md')), body);
    }
    await importArchives(f.config, f.store);
    assert.match(f.store.meta('selection_archive_issues')!, /Invalid archive number/);
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_item_paths').get() as { n: number }).n, 0);
    await writeSite(f.config, f.store);
    for (const [path, body] of originals) assert.equal(await readFile(join(f.config.feed.directory, path.replace('item-1.md', 'item-0.md')), 'utf8'), body);
  } finally { await f.cleanup(); }
});

test('archive maintenance updates bilingual bytes and removes output without losing private copies', async () => {
  const f = await fixture(2); try {
    const originals = await archive(f, 'hackernews', 2);
    await mkdir(join(f.config.feed.directory, 'other'), { recursive: true });
    await writeFile(join(f.config.feed.directory, 'other/draft.md'), 'Original draft');
    await rankItems(f.config, f.store, { source: 'hackernews', history: true, at }, rankingHttp(f.store).http);
    const path = 'hackernews/2026-10/09/item-1.md';
    const revised = originals.get(path)!.replace('Existing English body', 'Corrected English body');
    await writeFile(join(f.config.feed.directory, path), revised);
    const configPath = join(f.root, 'config.json'); await writeFile(configPath, JSON.stringify(f.config));
    const result = await promisify(execFile)(process.execPath, ['--import', 'tsx', resolve('src/cli.ts'), 'archives', 'update', path, '--config', configPath], { timeout: 15000 });
    assert.match(result.stdout, /^Archive maintenance backup: /);
    const backup = result.stdout.trim().replace(/^Archive maintenance backup: /, '');
    const prior = new Store(join(backup, 'data.sqlite'));
    try { assert.equal((prior.db.prepare('SELECT en FROM feed_archives WHERE path=?').get(path) as { en: string }).en, originals.get(path)); }
    finally { prior.close(); }
    await writeSite(f.config, f.store);
    assert.equal(await readFile(join(f.config.feed.directory, path), 'utf8'), revised);
    assert.equal(await readFile(join(f.config.feed.directory, '_translations/zh-CN/' + path), 'utf8'), originals.get('_translations/zh-CN/' + path));
    f.store.db.prepare("INSERT INTO feed_jobs VALUES ('hackernews','1001','queued',?,'pending',0,'',NULL)").run(JSON.stringify({ item: item('hackernews', '1001'), firstSeen: at }));
    await maintainArchive(f.config, f.store, 'remove', '_translations/zh-CN/' + path);
    let calls = 0;
    await summarize(f.config, f.store, { source: 'hackernews' }, () => { calls++; throw new Error('Removed archive must not consume ACP'); }, at, async row => row);
    assert.equal(calls, 0);
    const removal = await maintainArchive(f.config, f.store, 'remove', 'other/draft.md');
    await writeSite(f.config, f.store, undefined, true);
    for (const path of ['hackernews/2026-10/09/item-1.md', '_translations/zh-CN/hackernews/2026-10/09/item-1.md', 'other/draft.md']) await assert.rejects(readFile(join(f.config.feed.directory, path)), { code: 'ENOENT' });
    assert.equal((f.store.db.prepare('SELECT en FROM feed_archives WHERE path=?').get(path) as { en: string }).en, revised);
    assert.equal(await readFile(join(removal, 'content/other/draft.md'), 'utf8'), 'Original draft');
    await writeSite(f.config, f.store, undefined, true);
    await assert.rejects(readFile(join(f.config.feed.directory, 'other/draft.md')), { code: 'ENOENT' });
    await assert.rejects(maintainArchive(f.config, f.store, 'remove', '../escape'), /Invalid archive path/);
  } finally { await f.cleanup(); }
});

test('collection pages are protected only while their source remains configured, including disabled sources', async () => {
  const f = await fixture();
  try {
    const source = f.config.sources[0]!;
    f.config.sources.push(...['github', 'podcast'].map(id => ({ ...source, id, enabled: false, selection: undefined })));
    const paths = ['github/index.md', '_translations/zh-CN/github/index.md', 'podcast/index.md', '_translations/zh-CN/podcast/index.md'];
    for (const path of paths) {
      await mkdir(join(f.config.feed.directory, path, '..'), { recursive: true });
      await writeFile(join(f.config.feed.directory, path), 'Authored collection');
      await assert.rejects(maintainArchive(f.config, f.store, 'update', path), /generated from configuration/);
    }
    f.config.sources = f.config.sources.filter(source => !['github', 'podcast'].includes(source.id));
    await importArchives(f.config, f.store);
    for (const path of paths) {
      await writeFile(join(f.config.feed.directory, path), 'Updated authored collection');
      await maintainArchive(f.config, f.store, 'update', path);
    }
    await writeSite(f.config, f.store);
    for (const path of paths) assert.equal(await readFile(join(f.config.feed.directory, path), 'utf8'), 'Updated authored collection');
  } finally { await f.cleanup(); }
});

test('archive maintenance promotes a repaired quarantined pair and clears its scoring block', async () => {
  const f = await fixture(1); try {
    const originals = await archive(f, 'hackernews', 1);
    const path = 'hackernews/2026-10/09/item-1.md', translation = '_translations/zh-CN/' + path;
    await rm(join(f.config.feed.directory, translation));
    await importArchives(f.config, f.store);
    await writeFile(join(f.config.feed.directory, translation), originals.get(translation)!);
    await maintainArchive(f.config, f.store, 'update', path);
    assert.deepEqual(JSON.parse(f.store.meta('selection_archive_issues')!), []);
    const reports = await rankItems(f.config, f.store, { source: 'hackernews', history: true, at }, rankingHttp(f.store).http);
    assert.equal(reports[0]!.status, 'selected'); assert.deepEqual(reports[0]!.kept, ['1001']);
    assert.equal((f.store.db.prepare("SELECT id FROM feed_item_paths WHERE source='hackernews'").get() as { id: string }).id, '1001');
    await writeSite(f.config, f.store);
    assert.equal(await readFile(join(f.config.feed.directory, translation), 'utf8'), originals.get(translation));
  } finally { await f.cleanup(); }
});
function rankingHttp(store: Store, fail?: (url: string) => boolean, fetchedAt = at) {
  const calls: string[] = [], http = new Http(store);
  http.get = async url => {
    calls.push(url); if (fail?.(url)) throw new HttpError('Fixture limited', 429, '2026-10-13T05:00:00Z');
    const id = new URL(url).pathname.match(/\/item\/(\d+)\.json/)?.[1];
    const stream = new URL(url).pathname.match(/\/r\/([^/]+)/)?.[1];
    const body = id ? JSON.stringify({ id: Number(id), type: 'story', score: Number(id), descendants: 10 }) : feed([entry(stream === 'large' ? 'r1' : 'r2', stream)]);
    const raw = { url, status: 200, headers: {}, body, fetchedAt }; store.saveCache(raw); return raw;
  };
  return { http, calls };
}

test('moving the published directory reuses private archives, including legacy import markers', async () => {
  const f = await fixture(); try {
    await archive(f, 'hackernews', 2);
    const asset = Buffer.from([0, 255, 17]);
    await writeFile(join(f.config.feed.directory, 'asset.bin'), asset);
    await importArchives(f.config, f.store);
    // A published tree can omit private/excluded posts and contain newer media
    // formatting. It must never replace the database's original snapshots.
    f.store.db.prepare('INSERT INTO feed_excluded VALUES (?,?)').run('hackernews', '1002');
    const before = f.store.db.prepare('SELECT * FROM feed_archives ORDER BY path').all();
    const backup = f.store.meta('selection_archive_backup');
    const previous = f.config.feed.directory;
    f.store.db.prepare("DELETE FROM feed_meta WHERE key='selection_archives'").run();
    f.store.setMeta('selection_archives:' + hash(resolve(previous)), '1');
    f.config.feed.directory = join(f.root, 'moved-content');
    await rename(previous, f.config.feed.directory);
    await writeFile(join(f.config.feed.directory, 'asset.bin'), 'edited visible copy');
    await importArchives(f.config, f.store);
    await writeSite(f.config, f.store, undefined, true);
    assert.deepEqual(f.store.db.prepare('SELECT * FROM feed_archives ORDER BY path').all(), before);
    assert.equal(f.store.meta('selection_archive_backup'), backup);
    assert.deepEqual(await readFile(join(f.config.feed.directory, 'asset.bin')), asset);
    assert.ok(f.store.db.prepare("SELECT 1 FROM feed_excluded WHERE id='1002'").get());
    await assert.rejects(readFile(join(f.config.feed.directory, 'hackernews/2026-10/09/item-2.md')), { code: 'ENOENT' });
  } finally { await f.cleanup(); }
});

test('quarantined malformed Markdown cannot block healthy archived media rendering', async () => {
  const f = await fixture(); try {
    const originals = await archive(f, 'hackernews', 2);
    const path = 'hackernews/2026-10/09/item-1.md';
    const malformed = originals.get(path)!.replace(/source_url: .*/, 'source_url: "not a url"');
    await writeFile(join(f.config.feed.directory, path), malformed);
    const healthy = '---\ncontent_type: post\nsource_url: https://example.test/paper.pdf\n---\n\nHealthy prose.\n';
    await writeFile(join(f.config.feed.directory, 'healthy.md'), healthy);
    await writeSite(f.config, f.store, undefined, true);
    assert.equal(await readFile(join(f.config.feed.directory, path), 'utf8'), malformed);
    assert.match(await readFile(join(f.config.feed.directory, 'healthy.md'), 'utf8'), /!\[Original\]\(<https:\/\/example.test\/paper.pdf>\)/);
    await writeSite(f.config, f.store, undefined, true);
    assert.equal(await readFile(join(f.config.feed.directory, path), 'utf8'), malformed);
  } finally { await f.cleanup(); }
});

test('stale cached Reddit RSS cannot regress snapshot or per-item observation timestamps', async () => {
  const f = await fixture(); try {
    const newer = '2026-10-13T05:00:00.000Z';
    save(f.store, [item('reddit', 't3_r1', { observedAt: newer, ranking: redditRanking(2, 2, newer, 'week') })], { method: 'reddit-rss-percentile', window: 'week', size: 2 });
    f.store.saveCache({ url: 'https://www.reddit.com/r/large/top.rss?t=week&limit=100', status: 200, headers: {}, body: feed([entry('r1')]), fetchedAt: at });
    const http = new Http(f.store); http.get = async () => { throw new Error('Expected cached RSS'); };
    await rankItems(f.config, f.store, { source: 'reddit', at: '2026-10-13T05:30:00.000Z' }, http);
    assert.equal((f.store.db.prepare("SELECT observed_at FROM feed_rank_snapshots WHERE source='reddit' AND stream='large' AND window='week'").get() as { observed_at: string }).observed_at, newer);
    assert.equal(f.store.items('reddit')[0]!.ranking!.observedAt, newer);
    assert.equal(f.store.items('reddit')[0]!.ranking!.score, 50);
  } finally { await f.cleanup(); }
});

test('archive maintenance rejects Windows drive-relative paths before import or backup', async () => {
  const f = await fixture(); try {
    for (const path of ['C:foo.md', 'D:foo.md', '../escape', '/absolute']) {
      await assert.rejects(maintainArchive(f.config, f.store, 'remove', path), /Invalid archive path/);
    }
    assert.equal(f.store.meta('selection_archive_manifest'), undefined);
  } finally { await f.cleanup(); }
});

test('archive rendering contains drive-relative paths and retains Unicode filenames with spaces', async () => {
  const f = await fixture(); try {
    await mkdir(f.config.feed.directory, { recursive: true });
    const asset = Buffer.from([0, 255, 17]), name = '手写资料 v1.2.bin';
    await writeFile(join(f.config.feed.directory, name), asset);
    await writeSite(f.config, f.store, undefined, true);
    assert.deepEqual(await readFile(join(f.config.feed.directory, name)), asset);
    for (const path of ['C:drive-relative.md', 'D:drive-relative.md', '../outside.md', 'folder\\outside.md']) {
      f.store.db.prepare('INSERT INTO feed_archive_files VALUES (?,?)').run(path, Buffer.from('untrusted path'));
      await assert.rejects(writeSite(f.config, f.store, undefined, true), /Invalid archived relative path/);
      assert.deepEqual(await readFile(join(f.config.feed.directory, name)), asset, 'failed staging must preserve the published tree');
      f.store.db.prepare('DELETE FROM feed_archive_files WHERE path=?').run(path);
    }
    assert.ok(!(await readdir(f.root)).some(path => path.startsWith('.content-stage-')));
  } finally { await f.cleanup(); }
});

test('a late RSS arrival before the seventh Shanghai date stays private until explicit history ranking', async () => {
  const f = await fixture(); try {
    const boundary = '2026-10-13T00:01:00+08:00';
    const late = item('reddit', 't3_late', { publishedAt: '2026-10-06T00:02:00+08:00', observedAt: boundary, ranking: redditRanking(1, 2, boundary, 'week') });
    const active = item('reddit', 't3_active', { publishedAt: '2026-10-07T00:00:00+08:00', observedAt: boundary, ranking: redditRanking(2, 2, boundary, 'week') });
    save(f.store, [late, active], { method: 'reddit-rss-percentile', window: 'week', size: 2 });
    reconcileSelection(f.config, f.store, { source: 'reddit', at: boundary });
    assert.ok(f.store.isSelected('reddit', active.id));
    assert.ok(!f.store.isSelected('reddit', late.id), 'a rolling 168-hour sample can reach the frozen calendar date');
    assert.equal(f.store.items('reddit').length, 2, 'late arrivals remain available privately');
    const http = new Http(f.store);
    http.get = async url => ({ url, status: 200, headers: {}, fetchedAt: new Date(boundary).toISOString(), body: feed([entry('late'), entry('active')]) });
    await rankItems(f.config, f.store, { source: 'reddit', history: true, at: boundary }, http);
    assert.ok(f.store.isSelected('reddit', late.id));
  } finally { await f.cleanup(); }
});

test('history caps candidate processing and preserves every published archive in both locales', async () => {
  const f = await fixture(); try {
    const originals = new Map([...await archive(f, 'hackernews', 60), ...await archive(f, 'reddit', 60)]);
    await mkdir(join(f.config.feed.directory, 'other'), { recursive: true });
    const unrelated = Buffer.from('Unrelated draft\r\n\r\n'); await writeFile(join(f.config.feed.directory, 'other/keep.md'), unrelated);
    const { http, calls } = rankingHttp(f.store);
    const reports = await rankItems(f.config, f.store, { history: true, at }, http);
    assert.deepEqual(reports.map(row => row.kept.length), [50, 50]); assert.equal(reports[1]!.unknown, 58);
    const backup = f.store.meta('selection_archive_backup')!;
    assert.equal(await readFile(join(backup, 'content/hackernews/2026-10/09/item-1.md'), 'utf8'), originals.get('hackernews/2026-10/09/item-1.md'));
    await writeSite(f.config, f.store);
    assert.deepEqual(await readFile(join(f.config.feed.directory, 'other/keep.md')), unrelated);
    for (const source of ['reddit', 'hackernews']) for (const prefix of ['', '_translations/zh-CN/']) {
      const paths = await readdir(join(f.config.feed.directory, prefix, source, '2026-10/09'));
      assert.equal(paths.length, 60);
      for (const path of paths) { const relative = prefix + source + '/2026-10/09/' + path; assert.equal(await readFile(join(f.config.feed.directory, relative), 'utf8'), originals.get(relative)); }
    }
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_archives').get() as { n: number }).n, 120);
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_summaries').get() as { n: number }).n, 0);
    const count = calls.length, version = f.store.meta('content_version');
    await rankItems(f.config, f.store, { history: true, at }, http); assert.equal(calls.length, count); assert.equal(f.store.meta('content_version'), version);
    assert.equal(await writeSite(f.config, f.store), false);
    const reopened = new Store(f.config.storage.database); try { await writeSite(f.config, reopened, undefined, true); assert.equal(reopened.meta('selection_archive_backup'), backup); } finally { reopened.close(); }
    assert.deepEqual(await readFile(join(f.config.feed.directory, 'other/keep.md')), unrelated);
  } finally { await f.cleanup(); }
});

test('history failures preserve unranked and previously selected days instead of trimming them', async () => {
  const f = await fixture(2); try {
    const originals = new Map([...await archive(f, 'hackernews', 3), ...await archive(f, 'reddit', 3)]);
    const failed = rankingHttp(f.store, url => url.includes('/item/1001') || url.includes('/r/small/'));
    let reports = await rankItems(f.config, f.store, { history: true, at }, failed.http);
    assert.ok(reports.every(row => row.status === 'deferred')); assert.deepEqual(reports.map(row => row.kept.length), [3, 3]);
    await writeSite(f.config, f.store);
    for (const [path, body] of originals) assert.equal(await readFile(join(f.config.feed.directory, path), 'utf8'), body);
    const recoveryAt = '2026-10-13T06:00:00Z';
    const good = rankingHttp(f.store, undefined, recoveryAt); reports = await rankItems(f.config, f.store, { history: true, at: recoveryAt }, good.http);
    const kept = reports.map(row => row.kept); await writeSite(f.config, f.store);
    const later = '2026-10-13T20:00:00Z';
    reports = await rankItems(f.config, f.store, { history: true, at: later }, failed.http);
    assert.ok(reports.every(row => row.status === 'deferred')); assert.deepEqual(reports.map(row => [...row.kept].sort()), kept.map(ids => [...ids].sort()));
    await writeSite(f.config, f.store);
    assert.equal((await readdir(join(f.config.feed.directory, 'reddit/2026-10/09'))).length, 3);
  } finally { await f.cleanup(); }
});

test('publication adoption retains current output across restarts without exposing private archives', async () => {
  const f = await fixture(1); try {
    const originals = await archive(f, 'hackernews', 3);
    await rankItems(f.config, f.store, { source: 'hackernews', history: true, at }, rankingHttp(f.store).http);
    // Simulate a database/output created before publication retention existed:
    // item 1 was private, item 2 is published but no longer in the Top 1.
    for (const prefix of ['', '_translations/zh-CN/']) await rm(join(f.config.feed.directory, prefix + 'hackernews/2026-10/09/item-1.md'));
    f.store.db.exec("DELETE FROM feed_publications; DELETE FROM feed_meta WHERE key='publications_initialized'");
    await writeSite(f.config, f.store);
    assert.ok(!f.store.isSelected('hackernews', '1002'));
    const reopened = new Store(f.config.storage.database);
    try {
      f.config.feed.directory = join(f.root, 'new-output');
      await writeSite(f.config, reopened);
      for (const prefix of ['', '_translations/zh-CN/']) {
        await assert.rejects(readFile(join(f.config.feed.directory, prefix + 'hackernews/2026-10/09/item-1.md')), { code: 'ENOENT' });
        for (const number of [2, 3]) {
          const path = prefix + `hackernews/2026-10/09/item-${number}.md`;
          assert.equal(await readFile(join(f.config.feed.directory, path), 'utf8'), originals.get(path));
        }
      }
    } finally { reopened.close(); }
  } finally { await f.cleanup(); }
});

test('an interrupted import resumes from the intact tree and keeps its original number reservations', async () => {
  const f = await fixture(2); try {
    await archive(f, 'hackernews', 3);
    f.store.db.prepare("INSERT INTO feed_item_paths VALUES ('hackernews','1001','2026-10-09',9)").run();
    await assert.rejects(importArchives(f.config, f.store), /conflicts/);
    await assert.rejects(readdir(join(f.root, 'ranking-backups')), { code: 'ENOENT' });
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_archives').get() as { n: number }).n, 0);
    assert.equal((await readdir(join(f.config.feed.directory, 'hackernews/2026-10/09'))).length, 3);
    f.store.db.prepare('DELETE FROM feed_item_paths').run();
    await importArchives(f.config, f.store);
    assert.equal((f.store.db.prepare("SELECT number FROM feed_item_paths WHERE id='1001'").get() as { number: number }).number, 1);
  } finally { await f.cleanup(); }
});

test('archive maintenance reads only its requested pair despite an unrelated duplicate on disk', async () => {
  const f = await fixture(); try {
    await archive(f, 'hackernews', 1);
    const initial = 'hackernews/2026-10/09/item-1.md', target = 'hackernews/2026-10/09/item-10.md';
    for (const prefix of ['', '_translations/zh-CN/']) await rename(join(f.config.feed.directory, prefix + initial), join(f.config.feed.directory, prefix + target));
    await importArchives(f.config, f.store);
    for (const prefix of ['', '_translations/zh-CN/']) {
      const original = await readFile(join(f.config.feed.directory, prefix + target));
      await writeFile(join(f.config.feed.directory, prefix + initial), original);
      await writeFile(join(f.config.feed.directory, prefix + target), original.toString().replace('Old 1001', 'Updated 1001'));
    }
    await maintainArchive(f.config, f.store, 'update', target);
    const saved = f.store.db.prepare('SELECT en FROM feed_archives WHERE path=?').get(target) as { en: string };
    assert.match(saved.en, /Updated 1001/);
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_archives').get() as { n: number }).n, 1);
  } finally { await f.cleanup(); }
});

test('archive import preserves its scanned bytes across backup and rolls back partial commits', async () => {
  const f = await fixture(); try {
    const originals = await archive(f, 'hackernews', 1);
    const asset = Buffer.from([0, 255, 0, 17]);
    await writeFile(join(f.config.feed.directory, 'asset.bin'), asset);
    const backup = f.store.backup.bind(f.store);
    f.store.backup = async path => {
      await backup(path);
      await writeFile(join(f.config.feed.directory, 'asset.bin'), 'Changed while backing up');
      await writeFile(join(f.config.feed.directory, 'hackernews/2026-10/09/item-1.md'), 'Changed while backing up');
    };
    f.store.db.exec("CREATE TRIGGER reject_archive BEFORE INSERT ON feed_archive_files BEGIN SELECT RAISE(ABORT,'fixture failure'); END");
    await assert.rejects(importArchives(f.config, f.store), /fixture failure/);
    for (const table of ['feed_archives', 'feed_archive_files', 'feed_item_paths', 'items']) assert.equal((f.store.db.prepare(`SELECT count(*) n FROM ${table}`).get() as { n: number }).n, 0);
    assert.equal(f.store.meta('selection_archive_manifest'), undefined);
    f.store.db.exec('DROP TRIGGER reject_archive');
    for (const [path, body] of originals) await writeFile(join(f.config.feed.directory, path), body);
    await writeFile(join(f.config.feed.directory, 'asset.bin'), asset);
    await importArchives(f.config, f.store);
    assert.deepEqual((f.store.db.prepare("SELECT body FROM feed_archive_files WHERE path='asset.bin'").get() as { body: Buffer }).body, asset);
    assert.equal((f.store.db.prepare('SELECT en FROM feed_archives').get() as { en: string }).en, originals.get('hackernews/2026-10/09/item-1.md'));
    assert.deepEqual(f.store.db.prepare('PRAGMA database_list').all().map(row => (row as { name: string }).name), ['main']);
  } finally { await f.cleanup(); }
});

test('archive import does not stamp a changed configuration onto its earlier snapshot', async () => {
  const f = await fixture(); try {
    await archive(f, 'hackernews', 1);
    const initial = await archiveManifestSignature(f.config), backup = f.store.backup.bind(f.store);
    f.store.backup = async path => {
      await backup(path);
      const topics = JSON.parse(await readFile(f.config.feed.topics, 'utf8'));
      topics.topics[0].name.en = 'Updated topic';
      await writeFile(f.config.feed.topics, JSON.stringify(topics));
    };
    await importArchives(f.config, f.store);
    assert.equal(f.store.meta('selection_archive_manifest'), initial);
    assert.notEqual(await archiveManifestSignature(f.config), initial);
  } finally { await f.cleanup(); }
});

test('historical Reddit windows score only candidates belonging to that window', async () => {
  const f = await fixture(1); try {
    save(f.store, [item('reddit', 't3_new'), item('reddit', 't3_old', { publishedAt: '2026-09-20T00:00:00Z' })]);
    const http = new Http(f.store);
    http.get = async url => ({ url, status: 200, headers: {}, fetchedAt: at, body: feed(url.includes('t=month') ? [entry('old'), entry('new')] : [entry('new')]) });
    const reports = await rankItems(f.config, f.store, { history: true, source: 'reddit', at }, http);
    assert.ok(reports.every(row => row.status === 'selected'));
    const candidates = candidatesFor(f.store, f.config.sources[1]!);
    assert.equal(candidates.find(row => row.item.id === 't3_new')!.ranking!.window, 'week');
    assert.equal(candidates.find(row => row.item.id === 't3_new')!.ranking!.score, 100);
    assert.equal(candidates.find(row => row.item.id === 't3_old')!.ranking!.window, 'month');
  } finally { await f.cleanup(); }
});

test('stale cached HN evidence cannot overwrite newer metrics or the item ranking', async () => {
  const f = await fixture(); try {
    const newer = '2026-10-13T06:00:00Z';
    save(f.store, [item('hackernews', '1', { observedAt: newer, metrics: { score: 100, comments: 20 } })]);
    const http = new Http(f.store);
    http.get = async url => ({ url, status: 200, headers: {}, fetchedAt: at, body: JSON.stringify({ id: 1, type: 'story', score: 1, descendants: 0 }) });
    await rankItems(f.config, f.store, { source: 'hackernews', history: true, at: '2026-10-13T08:00:00Z' }, http);
    const current = f.store.items('hackernews')[0]!;
    assert.equal(current.metrics.score, 100);
    assert.deepEqual(current.ranking, candidatesFor(f.store, f.config.sources[0]!)[0]!.ranking);
  } finally { await f.cleanup(); }
});

test('ranking and native metric updates roll back together on a database write failure', async () => {
  const f = await fixture(); try {
    save(f.store, [item('hackernews', '1')]);
    const before = candidatesFor(f.store, f.config.sources[0]!)[0]!.ranking;
    f.store.db.exec("CREATE TRIGGER reject_metric_update BEFORE UPDATE ON items BEGIN SELECT RAISE(ABORT,'Injected ranking write failure'); END;");
    const http = new Http(f.store);
    http.get = async url => ({ url, status: 200, headers: {}, fetchedAt: at, body: JSON.stringify({ id: 1, type: 'story', score: 100, descendants: 20 }) });
    const reports = await rankItems(f.config, f.store, { source: 'hackernews', history: true, at }, http);
    assert.equal(reports[0]!.status, 'deferred');
    assert.deepEqual(candidatesFor(f.store, f.config.sources[0]!)[0]!.ranking, before);
    assert.equal(f.store.items('hackernews')[0]!.metrics.score, 10);
  } finally { await f.cleanup(); }
});

test('ordinary reconciliation does not parse a cold history or lose timezone/window boundaries', async () => {
  const f = await fixture(); try {
    const history = Array.from({ length: 2000 }, (_, index) => item('hackernews', String(10000 + index), { publishedAt: '2025-01-01T00:00:00Z', observedAt: '2025-01-01T00:00:00Z', metadata: { marker: 'cold-history' } }));
    f.store.saveCollection('hackernews', 'frontpage', 'primary', { items: history, raw: [], coverage: { status: 'complete', to: at, notes: [] } }, '');
    save(f.store, [
      item('hackernews', 'start', { publishedAt: '2026-10-07T00:00:00+08:00' }),
      item('hackernews', 'before', { publishedAt: '2026-10-06T23:59:59.999+08:00' }),
      item('hackernews', 'observed', { basis: 'observed', publishedAt: '2025-01-01T00:00:00Z', observedAt: '2026-10-08T00:00:00+08:00' }),
      item('hackernews', 'after', { publishedAt: '2026-10-14T00:00:00+08:00' }),
    ]);
    const parse = JSON.parse; let coldParses = 0;
    JSON.parse = (value, ...args) => { if (String(value).includes('cold-history')) coldParses++; return parse(value, ...args); };
    try { reconcileSelection(f.config, f.store, { source: 'hackernews', at }); } finally { JSON.parse = parse; }
    assert.equal(coldParses, 0);
    assert.ok(f.store.isSelected('hackernews', 'start')); assert.ok(f.store.isSelected('hackernews', 'observed'));
    assert.ok(!f.store.isSelected('hackernews', 'before')); assert.ok(!f.store.isSelected('hackernews', 'after'));
  } finally { await f.cleanup(); }
});

test('a valid empty Reddit top feed fills unknown rankings chronologically without fabricated votes', async () => {
  const f = await fixture(1); try {
    save(f.store, [item('reddit', 't3_old'), item('reddit', 't3_new', { publishedAt: '2026-10-09T02:00:00Z' })]);
    const http = new Http(f.store); http.get = async url => ({ url, status: 200, headers: {}, fetchedAt: at, body: '<feed><title>Empty ranking</title></feed>' });
    const reports = await rankItems(f.config, f.store, { source: 'reddit', history: true, at }, http);
    assert.equal(reports[0]!.status, 'selected'); assert.equal(reports[0]!.unknown, 2); assert.deepEqual(reports[0]!.kept, ['t3_new']);
    assert.equal((f.store.db.prepare("SELECT score FROM feed_selection WHERE id='t3_new'").get() as { score: number | null }).score, null);
  } finally { await f.cleanup(); }
});

test('an expired lease during HN fetching refuses the whole ranking batch', async () => {
  const f = await fixture(); try {
    save(f.store, Array.from({ length: 8 }, (_, i) => item('hackernews', String(i + 1))));
    f.store.acquireLease('ranking-test'); let requests = 0;
    const http = new Http(f.store); http.get = async url => {
      if (++requests === 8) f.store.db.prepare("UPDATE job_lease SET expires='1970-01-01T00:00:00Z'").run();
      return { url, status: 200, headers: {}, fetchedAt: at, body: JSON.stringify({ id: Number(url.match(/(\d+)\.json/)![1]), type: 'story', score: 100, descendants: 20 }) };
    };
    await assert.rejects(rankItems(f.config, f.store, { source: 'hackernews', history: true, at }, http), /Lost database job lease/);
    assert.ok(f.store.items('hackernews').every(row => row.metrics.score === 10));
    assert.ok(candidatesFor(f.store, f.config.sources[0]!).every(row => row.ranking!.score === hnScore(10, 2)));
  } finally { await f.cleanup(); }
});

test('older cached evidence cannot revive a newer inactive HN story', async () => {
  const f = await fixture(); try {
    save(f.store, [item('hackernews', '1')]);
    f.store.markRankingInactive('hackernews', '1', '2026-10-13T06:00:00Z');
    const { http } = rankingHttp(f.store);
    const reports = await rankItems(f.config, f.store, { source: 'hackernews', history: true, at: '2026-10-13T08:00:00Z' }, http);
    assert.deepEqual(reports[0]!.kept, []);
    assert.equal(f.store.items('hackernews')[0]!.metadata!.rankingInactiveAt, '2026-10-13T06:00:00.000Z');
  } finally { await f.cleanup(); }
});

test('an archive path reserved by a different identity fails before backup or import writes', async () => {
  const f = await fixture(); try {
    const originals = await archive(f, 'hackernews', 1);
    f.store.db.prepare("INSERT INTO feed_item_paths VALUES ('hackernews','other-id','2026-10-09',1)").run();
    await assert.rejects(importArchives(f.config, f.store), /conflicts/);
    await assert.rejects(readdir(join(f.root, 'ranking-backups')), { code: 'ENOENT' });
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_archives').get() as { n: number }).n, 0);
    for (const [path, body] of originals) assert.equal(await readFile(join(f.config.feed.directory, path), 'utf8'), body);
  } finally { await f.cleanup(); }
});

test('explicitly excluded archive identities remain private when rendering', async () => {
  const f = await fixture(2); try {
    await archive(f, 'hackernews', 3); const { http } = rankingHttp(f.store);
    await rankItems(f.config, f.store, { source: 'hackernews', history: true, at }, http);
    f.store.db.prepare("INSERT INTO feed_excluded VALUES ('hackernews','1003')").run();
    await writeSite(f.config, f.store);
    for (const prefix of ['', '_translations/zh-CN/']) await assert.rejects(readFile(join(f.config.feed.directory, prefix + 'hackernews/2026-10/09/item-3.md')), { code: 'ENOENT' });
    assert.ok(f.store.db.prepare("SELECT 1 FROM feed_archives WHERE id='1003'").get());
  } finally { await f.cleanup(); }
});

test('reconciliation prepares a fixed number of statements as the candidate set grows', async () => {
  const counts: number[] = [];
  for (const size of [2, 500]) {
    const f = await fixture(); try {
      const rows = Array.from({ length: size }, (_, i) => item('hackernews', String(i + 1)));
      f.store.saveCollection('hackernews', 'frontpage', 'primary', { items: rows, raw: [], coverage: { status: 'complete', to: at, notes: [] } }, '');
      const prepare = f.store.db.prepare.bind(f.store.db); let count = 0;
      f.store.db.prepare = ((sql: string) => { count++; return prepare(sql); }) as typeof f.store.db.prepare;
      reconcileSelection(f.config, f.store, { source: 'hackernews', at }); counts.push(count);
    } finally { await f.cleanup(); }
  }
  assert.ok(counts[1]! <= counts[0]! + 2, JSON.stringify(counts));
});

test('official dead/deleted HN stories leave the candidate set without inventing missing metrics', async () => {
  const f = await fixture(2); try {
    const originals = await archive(f, 'hackernews', 3);
    const { http } = rankingHttp(f.store), get = http.get;
    http.get = async (...args) => args[0].includes('/item/1001') ? { url: args[0], status: 200, headers: {}, fetchedAt: at, body: JSON.stringify({ id: 1001, type: 'story', dead: true, score: 12 }) } : get(...args);
    const reports = await rankItems(f.config, f.store, { history: true, source: 'hackernews', at }, http);
    assert.equal(reports[0]!.status, 'selected'); assert.equal(reports[0]!.kept.length, 2); assert.ok(!reports[0]!.kept.includes('1001'));
    await writeSite(f.config, f.store);
    for (const [path, body] of originals) assert.equal(await readFile(join(f.config.feed.directory, path), 'utf8'), body);
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_archives').get() as { n: number }).n, 3);
    assert.equal(f.store.items('hackernews').find(row => row.id === '1001')!.metrics.comments, undefined);
  } finally { await f.cleanup(); }
});

test('ranking commands persist an origin cooldown and retry successfully after it expires', async () => {
  const f = await fixture(1); try {
    await archive(f, 'reddit', 3); let calls = 0;
    const http = new Http(f.store); http.get = async () => { calls++; throw new HttpError('Rate limited by www.reddit.com', 429, '2026-10-13T05:00:00Z'); };
    let reports = await rankItems(f.config, f.store, { source: 'reddit', history: true, at }, http);
    assert.ok(f.store.meta('ranking_retry:https://www.reddit.com'), 'an HTTP 429 stores its origin retry time');
    assert.equal(calls, 1); assert.equal(reports[0]!.status, 'deferred');
    reports = await rankItems(f.config, f.store, { source: 'reddit', history: true, at: '2026-10-13T04:01:00Z' }, http);
    assert.equal(calls, 1); assert.equal(reports[0]!.status, 'deferred');
    const good = rankingHttp(f.store);
    reports = await rankItems(f.config, f.store, { source: 'reddit', history: true, at: '2026-10-13T06:00:00Z' }, good.http);
    assert.equal(reports[0]!.status, 'selected'); assert.equal(reports[0]!.kept.length, 1);
  } finally { await f.cleanup(); }
});

test('collection reconciles after all communities, preserving last valid scores on fallback', async () => {
  const f = await fixture(1); try {
    const reddit = f.config.sources[1]!;
    const rows = ['large', 'small'].map((stream, i) => item('reddit', 't3_' + stream, { stream, observedAt: new Date().toISOString(), publishedAt: new Date().toISOString(), ranking: redditRanking(i + 1, 2, at, 'week') }));
    const registry = { ...adapters, feed: async (context: Parameters<typeof adapters.feed>[0]): Promise<Collection> => ({ items: [rows[context.stream.id === 'large' ? 0 : 1]!], raw: [], ranking: { method: 'reddit-rss-percentile', window: 'week', size: 2 }, coverage: { status: 'partial', to: context.now, notes: ['snapshot'] } }) };
    await collect(f.config, f.store, 'reddit', false, registry);
    assert.ok(f.store.isSelected('reddit', 't3_large')); assert.ok(!f.store.isSelected('reddit', 't3_small'));
    const score = candidatesFor(f.store, reddit).find(row => row.item.id === 't3_large')!.ranking!.score;
    save(f.store, [{ ...rows[0]!, ranking: undefined, metrics: { rank: 100 } }]);
    assert.equal(candidatesFor(f.store, reddit).find(row => row.item.id === 't3_large')!.ranking!.score, score);
  } finally { await f.cleanup(); }
});

test('rank --dry-run has no persistent database, archive, queue or runner changes', async () => {
  const f = await fixture(2); try {
    await archive(f, 'hackernews', 3); await importArchives(f.config, f.store);
    for (const candidate of candidatesFor(f.store, f.config.sources[0]!)) {
      const url = 'https://hacker-news.firebaseio.com/v0/item/' + candidate.item.id + '.json';
      f.store.saveCache({ url, status: 200, headers: {}, fetchedAt: new Date().toISOString(), body: JSON.stringify({ id: Number(candidate.item.id), type: 'story', score: 100, descendants: 10 }) });
    }
    const configPath = join(f.root, 'config.json'); await writeFile(configPath, JSON.stringify(f.config));
    const before = f.store.db.serialize(), content = await readFile(join(f.config.feed.directory, 'hackernews/2026-10/09/item-1.md'));
    const result = await promisify(execFile)(process.execPath, ['--import', 'tsx', resolve('src/cli.ts'), 'rank', '--history', '--source', 'hackernews', '--dry-run', '--config', configPath], { timeout: 15000 });
    assert.equal(JSON.parse(result.stdout)[0].kept.length, 2);
    assert.equal(createHash('sha256').update(f.store.db.serialize()).digest('hex'), createHash('sha256').update(before).digest('hex'));
    assert.deepEqual(await readFile(join(f.config.feed.directory, 'hackernews/2026-10/09/item-1.md')), content);
    assert.ok(!(await readdir(f.root)).includes('runner'));
  } finally { await f.cleanup(); }
});
