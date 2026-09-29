import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { configSchema, loadConfig } from '../src/config.js';
import { Store } from '../src/store.js';
import { collect } from '../src/collect.js';
import { adapters } from '../src/channels/index.js';
import { parseFeed, parseFollowBuilders, parseProductHunt } from '../src/channels/parsers.js';
import { Http, HttpError } from '../src/http.js';
import { periodFor } from '../src/period.js';
import { select, roundRobin } from '../src/selection.js';
import { generateReport, batches } from '../src/reports.js';
import { validateCopies, type AgentResult } from '../src/agent.js';
import { apply as dshPlugin } from '../src/dsh-plugin.mjs';
import { writeSite } from '../src/site.js';
import { assertManagedPaths } from '../src/publish.js';
import type { Item, Collection, Copy } from '../src/types.js';

const config = () => configSchema.parse({ version: 1, agent: { model: 'deepseek/deepseek-flash' }, sources: [{ id: 'hackernews', name: 'Hacker News', intervalHours: 1, frequencies: ['daily', 'weekly'], streams: [{ id: 'main', channels: [{ id: 'primary', kind: 'hn-api' }, { id: 'backup', kind: 'feed', url: 'https://example.test/rss' }] }] }] });
const item = (id: string, overrides: Partial<Item> = {}): Item => ({ id, source: 'hackernews', stream: 'main', channel: 'primary', title: 'Title ' + id, text: 'Supplied facts.', url: 'https://example.test/' + id, publishedAt: '2026-09-28T03:00:00.000Z', observedAt: '2026-09-28T12:00:00.000Z', basis: 'published', metrics: { score: 10 }, ...overrides });
const collection = (items: Item[], cursor = 'checkpoint'): Collection => ({ items, cursor, raw: [{ url: 'https://example.test/rss', status: 200, body: '<rss/>', fetchedAt: '2026-09-28T12:00:00.000Z', headers: {} }], coverage: { status: 'complete', to: '2026-09-28T12:00:00.000Z', notes: [] } });
const copies = (items: Item[]): Copy[] => items.map(({ id, title, text }) => ({ id, en: { title, summary: text }, 'zh-CN': { title: '中文 ' + title, summary: text ? '提供的事实。' : '' } }));

test('channel failure retains its cursor, stores raw evidence, and uses the backup; valid empty stops fallback', async () => {
  const store = new Store(':memory:');
  try {
    store.saveCollection('hackernews', 'main', 'primary', collection([item('old')], 'old'), '');
    let backupCalls = 0;
    await collect(config(), store, undefined, false, { ...adapters, 'hn-api': async c => { c.http.raw.push({ url: 'https://example.test', body: 'failed', status: 503, fetchedAt: c.now, headers: {} }); throw new Error('unavailable'); }, feed: async () => { backupCalls++; return collection([item('new', { channel: 'backup' })], 'new'); } });
    assert.equal(backupCalls, 1); assert.equal(store.channel('hackernews', 'main', 'primary')?.cursor, 'old');
    assert.equal(store.channel('hackernews', 'main', 'backup')?.cursor, 'new');
    assert.equal((store.db.prepare('SELECT count(*) count FROM raw_responses').get() as { count: number }).count, 3);
    await collect(config(), store, undefined, false, { ...adapters, 'hn-api': async () => collection([]), feed: async () => { throw new Error('must not call'); } });
    assert.equal(store.channel('hackernews', 'main', 'primary')?.status, 'complete');
  } finally { store.close(); }
});

test('collection persistence is atomic and versions exclude metric-only updates', () => {
  const store = new Store(':memory:');
  try {
    store.saveCollection('hackernews', 'main', 'primary', collection([item('a')]), '');
    store.saveCollection('hackernews', 'main', 'primary', collection([item('a', { metrics: { score: 99 } })]), '');
    assert.equal(store.items('hackernews').length, 1);
    assert.equal((store.db.prepare('SELECT count(*) count FROM item_versions').get() as { count: number }).count, 1);
    assert.throws(() => store.saveCollection('hackernews', 'main', 'primary', collection([item('b'), item('bad', { id: undefined as unknown as string })], 'bad'), ''));
    assert.equal(store.items('hackernews').length, 1);
    assert.equal(store.channel('hackernews', 'main', 'primary')?.cursor, 'checkpoint');
  } finally { store.close(); }
});

test('resumed collection records its actual attempt time separately from the fixed coverage endpoint', async () => {
  const c = config(), store = new Store(':memory:');
  const rangeEnd = '2026-01-01T00:00:00.000Z';
  const before = Date.now();
  try {
    await collect(c, store, undefined, false, { ...adapters, 'hn-api': async () => ({ items: [], raw: [], cursor: '', coverage: { status: 'complete', to: rangeEnd, notes: [] } }) });
    const state = store.channel('hackernews', 'main', 'primary')!;
    assert.ok(Date.parse(state.last_attempt) >= before);
    assert.equal(state.last_success, rangeEnd, 'incremental collection must still start from the covered range');
    assert.ok(!select(c.sources[0]!, periodFor(c.sources[0]!, 'daily', '2026-01-01'), store, 50, new Date().toISOString()).coverage.notes.some(note => note.includes('unavailable')));
  } finally { store.close(); }
});

test('HTTP recognizes challenge pages and conditional responses', async () => {
  const store = new Store(':memory:'); let count = 0;
  try {
    const http = new Http(store, async (_url, init) => {
      if (count++ === 0) return new Response('<rss><channel/></rss>', { headers: { etag: 'v1' } });
      assert.equal((init?.headers as Record<string, string>)['If-None-Match'], 'v1');
      return new Response(null, { status: 304 });
    });
    assert.equal((await http.get('https://example.test/rss')).body, (await http.get('https://example.test/rss')).body);
    assert.equal(http.raw.length, 2);
    await assert.rejects(new Http(store, async () => new Response('Verify you are human')).get('https://example.test/block'), HttpError);
    await assert.rejects(new Http(store, async () => new Response('wait', { status: 429, headers: { 'Retry-After': '30' } })).get('https://example.test/rate'), error => error instanceof HttpError && !!error.retryAt && Date.parse(error.retryAt) > Date.now());
  } finally { store.close(); }
});

test('a host rate limit defers other streams without issuing another request', async () => {
  const store = new Store(':memory:'); let requests = 0;
  const http = new Http(store, async url => {
    requests++;
    return String(url).includes('limited.test') ? new Response('wait', { status: 429, headers: { 'Retry-After': '120' } }) : new Response('ok');
  });
  try {
    let retryAt: string | undefined;
    await assert.rejects(http.get('https://limited.test/first'), error => {
      if (!(error instanceof HttpError)) return false;
      retryAt = error.retryAt; return !!retryAt;
    });
    await assert.rejects(http.get('https://limited.test/second'), error => error instanceof HttpError && error.retryAt === retryAt);
    assert.equal(requests, 1, 'streams sharing a host must share its cooldown');
    assert.equal((await http.get('https://available.test/feed')).body, 'ok'); assert.equal(requests, 2);
  } finally { store.close(); }
});

test('arXiv first publication, new-only RSS and version-free identity survive normalization', () => {
  const context = { source: 'arxiv', stream: 'cs.AI', channel: 'rss', observedAt: '2026-09-29T00:00:00.000Z' };
  const rss = '<rss xmlns:arxiv="https://arxiv.org"><channel><item><title>A paper</title><link>https://arxiv.org/abs/2609.12345v2</link><pubDate>Mon, 28 Sep 2026 00:00:00 GMT</pubDate><arxiv:announce_type>new</arxiv:announce_type></item><item><title>Replacement</title><link>https://arxiv.org/abs/2609.00001</link><arxiv:announce_type>replace</arxiv:announce_type></item></channel></rss>';
  const result = parseFeed(rss, context);
  assert.equal(result.length, 1); assert.equal(result[0]?.id, '2609.12345'); assert.equal(result[0]?.publishedAt, '2026-09-28T00:00:00.000Z');
  assert.equal(result[0]?.metadata?.announcementDate, true); assert.equal(result[0]?.basis, 'published');
  assert.throws(() => parseFeed('<html>Not a feed</html>', context));
});

test('weekly periods cross years and Pacific days honor DST', () => {
  const source = config().sources[0]!;
  const weekly = periodFor(source, 'weekly', '2025-12-29');
  assert.equal(weekly.start, '2025-12-28T16:00:00.000Z'); assert.equal(weekly.end, '2026-01-04T16:00:00.000Z');
  const day = periodFor({ ...source, timezone: 'America/Los_Angeles' }, 'daily', '2026-11-01');
  assert.equal(Date.parse(day.end) - Date.parse(day.start), 25 * 3600_000);
  assert.throws(() => periodFor(source, 'weekly', '2026-09-29'));
});

test('follow-builders reads nested account timelines and rejects unknown feed layouts', () => {
  const context = { source: 'x', stream: 'swyx', channel: 'sample', observedAt: '2026-09-29T12:00:00.000Z' };
  const result = parseFollowBuilders(JSON.stringify({ generatedAt: context.observedAt, x: [{ handle: 'swyx', tweets: [{ id: '1234', text: 'A post', createdAt: context.observedAt, likes: 8 }] }] }), context);
  assert.equal(result.items[0]?.id, '1234'); assert.equal(result.items[0]?.metrics.score, 8);
  assert.throws(() => parseFollowBuilders(JSON.stringify({ generatedAt: context.observedAt, items: [] }), context));
});

test('selection caps output, freezes scores and round-robins accounts without duplicate IDs', () => {
  const c = config(), source = c.sources[0]!, store = new Store(':memory:');
  try {
    const items = Array.from({ length: 70 }, (_, index) => item(String(index), { metrics: { score: index } }));
    store.saveCollection(source.id, 'main', 'primary', collection(items), '');
    const period = periodFor(source, 'daily', '2026-09-28');
    const first = select(source, period, store, 50, '2026-09-29T12:00:00.000Z');
    assert.equal(first.items.length, 50); assert.equal(first.items[0]?.id, '69');
    store.saveCollection(source.id, 'main', 'primary', collection([item('0', { metrics: { score: 10000 }, observedAt: '2026-09-30T00:00:00.000Z' })]), '');
    assert.equal(select(source, period, store, 50, '2026-09-30T12:00:00.000Z', first).items[0]?.id, '69');
    assert.deepEqual(roundRobin([item('a', { stream: 'one' }), item('b', { stream: 'one' }), item('c', { stream: 'two' }), item('a', { stream: 'two' })], ['one', 'two'], 3).map(item => item.id), ['a', 'c', 'b']);
  } finally { store.close(); }
});

test('report regeneration caches bilingual text and seals without another Agent call; rendered files mirror IDs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-test-')), c = config(), store = new Store(':memory:');
  c.storage.directory = root; c.reports.directory = join(root, 'reports');
  const source = c.sources[0]!, period = periodFor(source, 'daily', '2026-09-28'); let calls = 0;
  const generator = async (_config: unknown, items: Item[]): Promise<AgentResult> => { calls++; return { copies: copies(items), directory: root, events: [], usage: [] }; };
  try {
    store.saveCollection(source.id, 'main', 'primary', collection([item('a', { url: 'https://example.test/a?q=(version)' })]), '');
    assert.equal(await generateReport(c, source, period, store, false, generator, '2026-09-29T02:00:00.000Z'), 'generated');
    assert.equal(await generateReport(c, source, period, store, false, generator, '2026-09-29T03:00:00.000Z'), 'unchanged');
    await generateReport(c, source, period, store, false, generator, period.seal); assert.equal(calls, 1);
    await writeSite(c, store);
    const en = await readFile(join(c.reports.directory, 'hackernews/2026/2026-09-28.md'), 'utf8');
    const zh = await readFile(join(c.reports.directory, '_translations/zh-CN/hackernews/2026/2026-09-28.md'), 'utf8');
    assert.match(en, /https:\/\/example.test\/a/); assert.match(zh, /https:\/\/example.test\/a/);
    assert.match(en, /q=%28version%29/); assert.match(zh, /q=%28version%29/);
    assert.doesNotMatch(zh.split('---')[1]!, /content_type|date:/);
    assert.equal(JSON.parse(await readFile(join(c.reports.directory, '_locale.yml'), 'utf8')).name, 'English');
  } finally { store.close(); await rm(root, { recursive: true }); }
});

test('bounded input, bilingual contract, daily budget and publication scope fail closed', () => {
  assert.equal(batches(Array.from({ length: 25 }, (_, index) => item(String(index))), 10, 24000, 4000).length, 3);
  assert.throws(() => validateCopies({ items: copies([item('b')]) }, [item('a')]));
  assert.throws(() => validateCopies({ items: copies([item('a')]) }, [item('a', { text: '' })]));
  assert.throws(() => assertManagedPaths(['reports/a.md', '.local/feedgarden.sqlite']));
  const store = new Store(':memory:');
  try { store.startCall('test', 'model', 1); assert.throws(() => store.startCall('test', 'model', 1)); } finally { store.close(); }
});

test('online SQLite backup includes WAL state and an active lease excludes another runner', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-backup-')), store = new Store(join(root, 'source.sqlite'));
  try {
    store.acquireLease('one'); assert.throws(() => store.acquireLease('two')); store.releaseLease('one'); store.acquireLease('two');
    store.saveCollection('hackernews', 'main', 'primary', collection([item('a')]), '');
    await store.backup(join(root, 'backup.sqlite'));
    const restored = new Store(join(root, 'backup.sqlite'));
    try { assert.equal(restored.items('hackernews')[0]?.id, 'a'); } finally { restored.close(); }
  } finally { store.close(); await rm(root, { recursive: true }); }
});

test('DSH plugin restricts all other capabilities and ignores model-controlled paths', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-plugin-'));
  let guard: (exec: { name: string }) => string | undefined = () => ''; const tools = new Map<string, any>(); let ready = false;
  try {
    await writeFile(join(root, 'input.json'), '{"items":[]}'); await writeFile(join(root, 'SKILL.md'), 'trusted skill');
    await dshPlugin({ tools: { guard: (fn: typeof guard) => { guard = fn; }, register: (tool: any) => tools.set(tool.name, tool) }, provide: () => { ready = true; } }, { directory: root });
    assert.equal(ready, true); assert.ok(guard({ name: 'bash' })); assert.ok(guard({ name: 'read' })); assert.equal(guard({ name: 'feedgarden_result' }), undefined);
    assert.match(await tools.get('feedgarden_input').execute(), /trusted skill/);
    await tools.get('feedgarden_result').execute({ json: '{"items":[]}', path: '/tmp/should-not-write' });
    assert.equal(await readFile(join(root, 'result.json'), 'utf8'), '{"items":[]}');
    assert.deepEqual((await readdir(root)).sort(), ['SKILL.md', 'input.json', 'result.json']);
  } finally { await rm(root, { recursive: true }); }
});

test('JSONC supports comments and trailing commas; JSON stays strict', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-config-'));
  try {
    const body = JSON.stringify(config()).replace(/}$/, ',}');
    await writeFile(join(root, 'config.jsonc'), '// comment\n' + body);
    assert.equal(loadConfig(join(root, 'config.jsonc')).version, 1);
    await writeFile(join(root, 'config.json'), '// comment\n' + body);
    assert.throws(() => loadConfig(join(root, 'config.json')));
  } finally { await rm(root, { recursive: true }); }
});

test('arXiv resumes an interrupted fixed range from its committed page without losing earlier items', async () => {
  const c = loadConfig(), source = c.sources.find(source => source.id === 'arxiv')!, stream = source.streams[0]!, channel = stream.channels[0]!, store = new Store(':memory:');
  const now = '2026-09-29T12:00:00.000Z', since = '2026-09-22T12:00:00.000Z';
  const page = (id: number) => `<feed><totalResults>2</totalResults><entry><id>${id}</id><title>LLM paper</title><link href="https://arxiv.org/abs/2609.${id}"/><published>2026-09-28T00:00:00Z</published></entry></feed>`;
  let calls = 0;
  const http = new Http(store); http.get = async url => { if (calls++) throw new Error('connection lost'); return { url, body: page(1), status: 200, headers: {}, fetchedAt: now }; };
  try {
    const first = await adapters['arxiv-api']({ source, stream, channel, store, http, now, since });
    assert.equal(first.coverage.status, 'partial'); assert.equal(first.items.length, 1);
    store.saveCollection(source.id, stream.id, channel.id, first, now);
    http.get = async url => { assert.match(url, /start=1&/); assert.match(decodeURIComponent(url), /202609221200 TO 202609291200/); return { url, body: page(2), status: 200, headers: {}, fetchedAt: now }; };
    const second = await adapters['arxiv-api']({ source, stream, channel, store, http, now: '2026-09-30T12:00:00.000Z', since: now });
    store.saveCollection(source.id, stream.id, channel.id, second, now);
    assert.equal(second.coverage.status, 'complete'); assert.equal(second.cursor, ''); assert.equal(store.items('arxiv').length, 2);
  } finally { store.close(); }
});

test('dated Product Hunt cards retain their own votes and tagline; Reddit boilerplate is not article text', () => {
  const context = { source: 'producthunt', stream: 'daily', channel: 'leaderboard', observedAt: '2026-09-29T12:00:00Z' };
  const result = parseProductHunt('<section><div><span><a href="/products/test">1. Test</a></span><span>A provided tagline</span></div><button data-test="vote-button"><p>572</p></button></section>', context, '2026-09-28');
  assert.equal(result[0]?.text, 'A provided tagline'); assert.equal(result[0]?.metrics.votes, 572); assert.equal(result[0]?.metadata?.leaderboardDate, '2026-09-28');
  const feed = '<feed><entry><id>id</id><title>Only title</title><link href="https://reddit.com/r/test/comments/123"/><content>&lt;span&gt;submitted by user&lt;/span&gt; [link] [comments]</content></entry></feed>';
  assert.equal(parseFeed(feed, { ...context, source: 'reddit' })[0]?.text, '');
});

test('failed late revision retains the published bilingual version, then retries the late item', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-late-')), c = config(), store = new Store(':memory:'); c.storage.directory = root;
  const source = c.sources[0]!, period = periodFor(source, 'daily', '2026-09-28');
  const generator = async (_config: unknown, items: Item[]): Promise<AgentResult> => ({ copies: copies(items), directory: root, events: [], usage: [] });
  try {
    store.saveCollection(source.id, 'main', 'primary', collection([item('a')]), '');
    await generateReport(c, source, period, store, false, generator, period.due);
    store.saveCollection(source.id, 'main', 'primary', collection([item('late')]), '');
    await assert.rejects(generateReport(c, source, period, store, false, async () => { throw new Error('format error'); }, period.seal));
    const key = 'hackernews:daily:2026-09-28';
    assert.equal(store.report(key)?.state, 'ready'); assert.equal(store.report(key)?.copies.length, 1);
    await generateReport(c, source, period, store, false, generator, period.seal);
    assert.equal(store.report(key)?.state, 'sealed'); assert.equal(store.report(key)?.copies.length, 2);
  } finally { store.close(); await rm(root, { recursive: true }); }
});

test('HTML respects robots rules and large real-style escaped RSS is bounded without accepting DTDs', async () => {
  const store = new Store(':memory:'); let requests = 0;
  try {
    const http = new Http(store, async () => { requests++; return new Response('User-agent: *\nDisallow: /private\nAllow: /news'); });
    await assert.rejects(http.page('https://example.test/private'), /robots.txt disallows/); assert.equal(requests, 1);
    const content = '&lt;p&gt;Supplied fact&lt;/p&gt;'.repeat(1200);
    const xml = '<feed><entry><id>large</id><title>A title</title><link href="https://example.test"/><content>' + content + '</content></entry></feed>';
    assert.ok(parseFeed(xml, {source:'openai',stream:'news',channel:'rss',observedAt:'2026-09-29T00:00:00Z'})[0]?.text.includes('Supplied fact'));
    assert.throws(()=>parseFeed('<!DOCTYPE feed [<!ENTITY x "large">]><feed/>',{source:'openai',stream:'news',channel:'rss',observedAt:''}), /DTD/);
  } finally { store.close(); }
});

test('GitHub weekly ranking aggregates last daily snapshots without summing rolling stars', () => {
  const source=loadConfig().sources.find(s=>s.id==='github')!,store=new Store(':memory:');
  try {
    for(const [observedAt,ids] of [['2026-09-21T01:00:00Z',['early']],['2026-09-21T12:00:00Z',['a','b']],['2026-09-22T12:00:00Z',['b','c']]] as [string,string[]][]) {
      store.saveCollection('github','trending','trending',collection(ids.map((id,index)=>item(id,{source:'github',stream:'trending',channel:'trending',publishedAt:observedAt,observedAt,basis:'observed',metrics:{rank:index+1,starsWindow:100}}))), '');
    }
    const result=select(source,periodFor(source,'weekly','2026-09-21'),store,50,'2026-09-29T00:00:00Z');
    assert.deepEqual(result.items.map(i=>i.id),['b','a','c']);assert.equal(result.frozenScores.b,1.5);assert.equal(result.items[0]?.metrics.starsWindow,100);
  } finally {store.close();}
});

test('a failed frozen task recovered after seal remains eligible for its final late-item evaluation', async () => {
  const root=await mkdtemp(join(tmpdir(),'feedgarden-recovery-')),c=config(),s=new Store(':memory:');c.storage.directory=root;
  const source=c.sources[0]!,period=periodFor(source,'daily','2026-09-28'),key='hackernews:daily:2026-09-28';
  const generator=async(_config:unknown,items:Item[]):Promise<AgentResult>=>({copies:copies(items),directory:root,events:[],usage:[]});
  try {
    s.saveCollection(source.id,'main','primary',collection([item('first')]),'');
    await assert.rejects(generateReport(c,source,period,s,false,async()=>{throw new Error('offline');},period.due));
    s.saveCollection(source.id,'main','primary',collection([item('late')]),'');
    await generateReport(c,source,period,s,false,generator,period.seal);
    assert.equal(s.report(key)?.state,'ready');assert.equal(s.report(key)?.copies.length,1);
    await generateReport(c,source,period,s,false,generator,period.seal);
    assert.equal(s.report(key)?.state,'sealed');assert.equal(s.report(key)?.copies.length,2);
  } finally {s.close();await rm(root,{recursive:true});}
});
