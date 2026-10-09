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
import { apply as dshPlugin } from '../src/dsh-plugin.mjs';
import { assertManagedPaths } from '../src/publish.js';
import type { Item, Collection } from '../src/types.js';

const config = () => configSchema.parse({ version: 2, agent: { model: 'deepseek/deepseek-flash' }, sources: [{ id: 'hackernews', name: 'Hacker News', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'primary', kind: 'hn-api' }, { id: 'backup', kind: 'feed', url: 'https://example.test/rss' }] }] }] });
const item = (id: string, overrides: Partial<Item> = {}): Item => ({ id, source: 'hackernews', stream: 'main', channel: 'primary', title: 'Title ' + id, text: 'Supplied facts.', url: 'https://example.test/' + id, publishedAt: '2026-09-28T03:00:00.000Z', observedAt: '2026-09-28T12:00:00.000Z', basis: 'published', metrics: { score: 10 }, ...overrides });
const collection = (items: Item[], cursor = 'checkpoint'): Collection => ({ items, cursor, raw: [{ url: 'https://example.test/rss', status: 200, body: '<rss/>', fetchedAt: '2026-09-28T12:00:00.000Z', headers: {} }], coverage: { status: 'complete', to: '2026-09-28T12:00:00.000Z', notes: [] } });


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

test('follow-builders reads nested account timelines and rejects unknown feed layouts', () => {
  const context = { source: 'x', stream: 'swyx', channel: 'sample', observedAt: '2026-09-29T12:00:00.000Z' };
  const result = parseFollowBuilders(JSON.stringify({ generatedAt: context.observedAt, x: [{ handle: 'swyx', tweets: [{ id: '1234', text: 'A post', createdAt: context.observedAt, likes: 8 }] }] }), context);
  assert.equal(result.items[0]?.id, '1234'); assert.equal(result.items[0]?.metrics.score, 8);
  assert.throws(() => parseFollowBuilders(JSON.stringify({ generatedAt: context.observedAt, items: [] }), context));
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
    await writeFile(join(root, 'input.json'), '{"contractVersion":2,"topics":{"version":1,"topics":[]},"items":[]}'); await writeFile(join(root, 'SKILL.md'), 'trusted skill');
    await dshPlugin({ tools: { guard: (fn: typeof guard) => { guard = fn; }, register: (tool: any) => tools.set(tool.name, tool) }, provide: () => { ready = true; } }, { directory: root });
    assert.equal(ready, true); assert.ok(guard({ name: 'bash' })); assert.ok(guard({ name: 'read' })); assert.equal(guard({ name: 'feedgarden_result' }), undefined);
    assert.match(await tools.get('feedgarden_input').execute(), /trusted skill/);
    await tools.get('feedgarden_result').execute({ json: '{"contractVersion":2,"items":[],"newTopics":[]}', path: '/tmp/should-not-write' });
    assert.equal(await readFile(join(root, 'result.json'), 'utf8'), '{"contractVersion":2,"items":[],"newTopics":[]}');
    assert.deepEqual((await readdir(root)).sort(), ['SKILL.md', 'input.json', 'result.json']);
  } finally { await rm(root, { recursive: true }); }
});

test('JSONC supports comments and trailing commas; JSON stays strict', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-config-'));
  try {
    const body = JSON.stringify(config()).replace(/}$/, ',}');
    await writeFile(join(root, 'config.jsonc'), '// comment\n' + body);
    assert.equal(loadConfig(join(root, 'config.jsonc')).version, 2);
    await writeFile(join(root, 'config.json'), '// comment\n' + body);
    assert.throws(() => loadConfig(join(root, 'config.json')));
  } finally { await rm(root, { recursive: true }); }
});

test('arXiv resumes an interrupted fixed range from its committed page without losing earlier items', async () => {
  const c = configSchema.parse({version:2,agent:{model:'deepseek/deepseek-flash'},sources:[{id:'arxiv',name:'arXiv',intervalHours:6,streams:[{id:'cs.AI',channels:[{id:'atom',kind:'arxiv-api'}]}]}]}), source = c.sources[0]!, stream = source.streams[0]!, channel = stream.channels[0]!, store = new Store(':memory:');
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
