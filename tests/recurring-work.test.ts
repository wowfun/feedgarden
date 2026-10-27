import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../src/store.js';
import { Http } from '../src/http.js';
import { adapters } from '../src/channels/index.js';
import { collect } from '../src/collect.js';
import { configSchema } from '../src/config.js';
import { summarize, acceptedItems, type Generator } from '../src/items.js';
import { writeSite } from '../src/site.js';
import { applyTopics } from '../src/topics.js';
import type { Item } from '../src/types.js';

const at = '2026-10-10T00:00:00.000Z';
const topics = { version: 1 as const, topics: [{ id: 'coding', name: { en: 'Coding', 'zh-CN': '编程' }, description: 'Tools', aliases: [], deprecated: false }] };
const item = (id: string): Item => ({ source: 'one', id, stream: 'main', channel: 'feed', title: 'Title ' + id, text: 'Supplied source facts', url: 'https://example.test/' + id, publishedAt: at, observedAt: at, basis: 'published', metrics: {} });
const generator: Generator = async (_agent, input, _repair, directory) => ({ output: { contractVersion: 2, newTopics: [], items: input.items.map(row => ({ source: row.source, id: row.id, topics: ['coding'], en: { title: row.title, summary: row.text }, 'zh-CN': { title: row.title, summary: row.text } })) }, directory: directory!, events: [], usage: [] });
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-recurring-'));
  await writeFile(join(root, 'topics.json'), JSON.stringify(topics));
  const config = configSchema.parse({ version: 2, storage: { root: root }, feed: { directory: join(root, 'content'), topics: join(root, 'topics.json') }, agent: { model: 'deepseek/deepseek-flash' }, sources: [{ id: 'one', name: 'One', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }] }] });
  const store = new Store(':memory:'); store.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
  const save = (rows: Item[]) => store.saveCollection('one', 'main', 'feed', { items: rows, raw: [], coverage: { status: 'complete', to: at, notes: [] } }, '');
  return { root, config, store, save, cleanup: async () => { store.close(); await rm(root, { recursive: true, force: true }); } };
}

test('all attempted HN failures reject a truncated candidate snapshot', async () => {
  const store = new Store(':memory:');
  try {
    const config = configSchema.parse({ version: 2, agent: { model: 'deepseek/deepseek-flash' }, sources: [{ id: 'hackernews', name: 'HN', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'hn', kind: 'hn-api', limit: 2 }] }] }] });
    const source = config.sources[0]!, stream = source.streams[0]!, channel = stream.channels[0]!;
    const http = new Http(store, async url => String(url).includes('topstories') ? Response.json([1, 2, 3, 4]) : new Response('Unavailable', { status: 403 }));
    await assert.rejects(adapters['hn-api']({ source, stream, channel, store, http, now: at, since: at }), /All HN item requests failed/);
  } finally { store.close(); }
});

test('200 replaces stale validators while 304 retains its cached representation headers', async () => {
  const store = new Store(':memory:'); let calls = 0;
  try {
    const http = new Http(store, async (_url, init) => {
      const headers = new Headers(init?.headers);
      if (calls++ === 0) return new Response('first', { headers: { etag: 'old', 'last-modified': 'yesterday', 'content-type': 'text/html' } });
      if (calls === 2) { assert.equal(headers.get('if-none-match'), 'old'); return new Response('second', { headers: { 'content-type': 'text/plain' } }); }
      assert.equal(headers.get('if-none-match'), null); assert.equal(headers.get('if-modified-since'), null);
      return new Response(null, { status: 304 });
    });
    await http.get('https://example.test/page'); const changed = await http.get('https://example.test/page');
    assert.equal(changed.headers.etag, undefined); assert.equal(changed.headers['last-modified'], undefined);
    const unchanged = await http.get('https://example.test/page');
    assert.equal(unchanged.body, 'second'); assert.match(unchanged.headers['content-type']!, /text\/plain/);
  } finally { store.close(); }
});

test('a stream with every enabled channel cooling down is deferred, without a false failure', async () => {
  const f = await fixture();
  try {
    const stream = f.config.sources[0]!.streams[0]!;
    stream.channels.push({ ...stream.channels[0]!, id: 'disabled', enabled: false });
    f.store.saveCollection('one', 'main', 'feed', { items: [], raw: [], coverage: { status: 'failed', to: at, notes: ['rate limited'] } }, '9999-01-01T00:00:00Z', at);
    f.store.saveCollection('one', 'main', 'disabled', { items: [], raw: [], coverage: { status: 'complete', to: at, notes: [] } }, '', '2026-10-10T01:00:00Z');
    const result = await collect(f.config, f.store, undefined, true, { ...adapters, feed: async () => { throw new Error('cooldown must not make requests'); } });
    assert.deepEqual(result, [{ source: 'one', stream: 'main', status: 'deferred', reason: 'Channels are cooling down' }]);
  } finally { await f.cleanup(); }
});
test('a later failed fallback cannot postpone a due primary, while a successful round sets the stream cadence', async () => {
 const f=await fixture();
 try {
  const stream=f.config.sources[0]!.streams[0]!;stream.channels.push({...stream.channels[0]!,id:'fallback'});
  f.store.saveCollection('one','main','feed',{items:[],raw:[],coverage:{status:'failed',to:at,notes:[]}},'2000-01-01T00:00:00Z',at);
  f.store.saveCollection('one','main','fallback',{items:[],raw:[],coverage:{status:'failed',to:at,notes:[]}},'9999-01-01T00:00:00Z','2026-10-10T01:00:00Z');
  const channels:string[]=[];
  const result=await collect(f.config,f.store,undefined,true,{...adapters,feed:async c=>{channels.push(c.channel.id);return {items:[],raw:[],coverage:{status:'complete',to:c.now,notes:[]}};}});
  assert.deepEqual(channels,['feed']);assert.equal(result[0]?.status,'complete');
  assert.deepEqual(await collect(f.config,f.store,undefined,true,{...adapters,feed:async()=>{throw new Error('Successful stream should wait');}}),[{source:'one',stream:'main',status:'deferred',reason:'Collection interval has not elapsed'}]);
 } finally {await f.cleanup();}
});
test('sources sharing an origin reuse robots policy instead of resetting it between sources', async () => {
 const f=await fixture();
 try {
  f.config.sources.push({...f.config.sources[0]!,id:'two'});let robots=0,pages=0;
  await collect(f.config,f.store,undefined,false,{...adapters,feed:async c=>{
   c.http.get=async url=>{const isRobots=url.endsWith('/robots.txt');if(isRobots)robots++;else pages++;return {url,status:200,headers:{},body:isRobots?'User-agent: *\nDisallow: /private':'Public source text',fetchedAt:c.now};};
   await c.http.page('https://shared.example.test/article',0);
   await assert.rejects(c.http.page('https://shared.example.test/private',0),/robots.txt disallows/);
   return {items:[],raw:[],coverage:{status:'complete',to:c.now,notes:[]}};
  }});
  assert.equal(robots,1);assert.equal(pages,2);
 } finally {await f.cleanup();}
});

test('unchanged planning performs no enrichment or job writes; item and policy changes remain observable', async () => {
  const f = await fixture(); let prepared = 0;
  const prepare = async (row: Item) => { prepared++; return row; };
  try {
    f.save([item('a'), item('b'), item('c')]);
    await summarize(f.config, f.store, {}, generator, at, prepare); assert.equal(prepared, 3);
    const changes = f.store.db.prepare('SELECT total_changes() n').get() as { n: number };
    await summarize(f.config, f.store, {}, () => { throw new Error('unchanged items must not call agent'); }, at, prepare);
    assert.equal(prepared, 3); assert.deepEqual(f.store.db.prepare('SELECT total_changes() n').get(), changes);
    const old = acceptedItems(f.store).find(row => row.item.id === 'b')!.copy;
    f.save([{ ...item('b'), metrics: { score: 99 } }]);
    await summarize(f.config, f.store, {}, generator, at, prepare); assert.equal(prepared, 4);
    assert.deepEqual(acceptedItems(f.store).find(row => row.item.id === 'b')!.copy, old);
    f.config.agent.effort = 'low';
    assert.equal((await summarize(f.config, f.store, {}, generator, at, prepare)).generated, 3); assert.equal(prepared, 7);
  } finally { await f.cleanup(); }
});

test('policy changes prepare recent and unaccepted items while preserving aged accepted evidence', async () => {
  const f = await fixture();
  const old = '2026-01-01T00:00:00.000Z';
  const prepared: string[] = [];
  const prepare = async (row: Item) => {
    prepared.push(row.id);
    return { ...row, metadata: { ...row.metadata, articleFetchedAt: at } };
  };
  try {
    f.save([{ ...item('old'), observedAt: old, publishedAt: old }]);
    await summarize(f.config, f.store, {}, generator, at, prepare);
    const accepted = f.store.db.prepare('SELECT * FROM feed_summaries WHERE id=?').get('old');
    const job = f.store.db.prepare('SELECT * FROM feed_jobs WHERE id=?').get('old');
    prepared.length = 0;
    f.save([item('recent'), { ...item('unaccepted'), observedAt: old, publishedAt: old }]);
    f.config.agent.effort = 'low';
    const result = await summarize(f.config, f.store, {}, generator, at, prepare);
    assert.equal(result.generated, 2);
    assert.deepEqual(prepared.sort(), ['recent', 'unaccepted']);
    assert.deepEqual(f.store.db.prepare('SELECT * FROM feed_summaries WHERE id=?').get('old'), accepted);
    assert.deepEqual(f.store.db.prepare('SELECT * FROM feed_jobs WHERE id=?').get('old'), job);
    assert.equal(acceptedItems(f.store).length, 3);
  } finally { await f.cleanup(); }
});

test('zero-day refresh windows still allow first processing and explicit historical refresh or rebuild', async () => {
  const f = await fixture(); let prepared = 0;
  const prepare = async (row: Item, _store: Store, _http: Http, refresh = false) => {
    prepared++;
    assert.equal(refresh, prepared > 1);
    return row;
  };
  try {
    f.config.collection.enrichmentRefreshDays = 0;
    f.save([{ ...item('old'), observedAt: '2026-01-01T00:00:00.000Z' }]);
    assert.equal((await summarize(f.config, f.store, {}, generator, at, prepare)).generated, 1);
    f.config.agent.effort = 'low';
    assert.equal((await summarize(f.config, f.store, {}, () => { throw new Error('Aged accepted item must stay untouched'); }, at, prepare)).generated, 0);
    assert.equal(prepared, 1);
    assert.equal((await summarize(f.config, f.store, { refresh: true }, generator, at, prepare)).generated, 1);
    assert.equal((await summarize(f.config, f.store, { rebuild: true }, generator, at, prepare)).generated, 1);
    assert.equal(prepared, 3);
  } finally { await f.cleanup(); }
});

test('policy refresh eligibility uses the first-observation instant and excludes the exact window boundary', async () => {
  const f = await fixture(); const prepared: string[] = [];
  const prepare = async (row: Item) => { prepared.push(row.id); return row; };
  try {
    f.config.collection.enrichmentRefreshDays = 8;
    f.save([
      { ...item('boundary'), observedAt: '2026-10-03T00:00:00Z' },
      { ...item('offset-boundary'), observedAt: '2026-10-03T08:00:00+08:00' },
      { ...item('inside'), observedAt: '2026-10-03T00:00:00.001Z' },
    ]);
    await summarize(f.config, f.store, {}, generator, at, prepare);
    prepared.length = 0;
    f.config.collection.enrichmentRefreshDays = 7;
    await summarize(f.config, f.store, {}, () => { throw new Error('Unchanged copy must be reused'); }, at, prepare);
    assert.deepEqual(prepared, ['inside']);
  } finally { await f.cleanup(); }
});

test('policy changes rekey unfinished historical revisions without replacing their last accepted copy on failure', async () => {
  const f = await fixture();
  const historical = { ...item('old'), observedAt: '2026-01-01T00:00:00.000Z' };
  try {
    f.save([historical]);
    await summarize(f.config, f.store, {}, generator, at);
    f.save([{ ...historical, text: 'Changed historical facts' }]);
    await summarize(f.config, f.store, {}, async () => { throw new Error('Transport disconnected'); }, at);
    const before = f.store.db.prepare('SELECT cache_key FROM feed_jobs WHERE id=?').get('old') as { cache_key: string };
    assert.equal(acceptedItems(f.store)[0]!.item.text, historical.text);
    f.config.agent.effort = 'low';
    const result = await summarize(f.config, f.store, {}, generator, '2026-10-10T00:20:00.000Z');
    assert.equal(result.generated, 1);
    const after = f.store.db.prepare('SELECT cache_key FROM feed_jobs WHERE id=?').get('old') as { cache_key: string };
    assert.notEqual(after.cache_key, before.cache_key, 'current model policy must determine the accepted cache identity');
    assert.equal(acceptedItems(f.store)[0]!.item.text, 'Changed historical facts');
  } finally { await f.cleanup(); }
});

test('unchanged rendering preserves the tree and topics; metadata, locale and recovery changes invalidate it', async () => {
  const f = await fixture();
  try {
    f.save([item('a')]); await summarize(f.config, f.store, {}, generator, at);
    await writeSite(f.config, f.store); const path = join(f.config.feed.directory, 'one/2026-10/10/item-1.md'), before = await stat(path);
    await writeSite(f.config, f.store); const after = await stat(path); assert.equal(after.ino, before.ino);
    const topicBefore = await stat(f.config.feed.topics); await applyTopics(f.config.feed.topics, topics); assert.equal((await stat(f.config.feed.topics)).ino, topicBefore.ino);
    f.config.sources[0]!.name = 'Renamed'; await writeSite(f.config, f.store); assert.match(await readFile(join(f.config.feed.directory, '_locale.yml'), 'utf8'), /Renamed/);
    const accepted = f.store.db.prepare('SELECT accepted FROM feed_summaries').get() as { accepted: string };
    const record = JSON.parse(accepted.accepted); record.item.url = 'https://example.test/new';
    f.store.db.prepare('UPDATE feed_summaries SET accepted=?').run(JSON.stringify(record)); await writeSite(f.config, f.store);
    assert.match(await readFile(path, 'utf8'), /example.test\/new/);
  } finally { await f.cleanup(); }
});

test('host pacing waits for response completion; zero-spacing API calls can still overlap', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(at) });
  const store = new Store(':memory:'); let requests = 0, close!: () => void, started!: () => void;
  const firstStarted = new Promise<void>(resolve => { started = resolve; });
  try {
    const http = new Http(store, async () => {
      requests++;
      if (requests === 1) return new Response(new ReadableStream({ start(controller) { close = () => controller.close(); started(); } }));
      return new Response('second');
    });
    const first = http.get('https://paced.test/first', 25); await firstStarted;
    t.mock.timers.tick(100);
    const second = http.get('https://paced.test/second');
    await new Promise<void>(resolve => setImmediate(resolve)); assert.equal(requests, 1, 'the first body is still open');
    close(); await first; t.mock.timers.tick(100); await second; assert.equal(requests, 2);
    let release!: () => void;
    const both = new Promise<void>(resolve => { release = resolve; }); let concurrent = 0;
    const api = new Http(store, async () => { if (++concurrent === 2) release(); await both; return new Response('ok'); });
    await Promise.all([api.get('https://api.test/a'), api.get('https://api.test/b')]); assert.equal(concurrent, 2);
  } finally { store.close(); }
});

test('identical response bodies are deduplicated without erasing versions, observations or distinct HTTP metadata', () => {
  const store = new Store(':memory:');
  try {
    const raw = { url: 'https://example.test/feed', status: 200, body: 'identical evidence', headers: { etag: 'first' }, fetchedAt: at };
    const save = (response: typeof raw) => store.saveCollection('one', 'main', 'feed', { items: [item('a')], raw: [response], coverage: { status: 'complete', to: at, notes: [] } }, '');
    save(raw); save({ ...raw, fetchedAt: '2026-10-10T01:00:00.000Z' });
    assert.equal((store.db.prepare('SELECT count(*) n FROM raw_responses').get() as { n: number }).n, 1);
    assert.equal((store.db.prepare('SELECT count(*) n FROM observations').get() as { n: number }).n, 2);
    save({ ...raw, headers: { etag: 'second' } });
    assert.equal((store.db.prepare('SELECT count(*) n FROM raw_responses').get() as { n: number }).n, 2);
    assert.equal((store.db.prepare('SELECT count(*) n FROM item_versions').get() as { n: number }).n, 1);
  } finally { store.close(); }
});

test('periodic enrichment expires by first observation; changed historical content and explicit refresh still run', async () => {
  const f = await fixture(); let prepared = 0;
  const prepare = async (row: Item) => { prepared++; return row; };
  try {
    f.config.sources[0]!.id = 'hackernews';
    const row = { ...item('100'), source: 'hackernews', url: 'https://news.ycombinator.com/item?id=100' };
    const save = (updated: Item) => f.store.saveCollection('hackernews', 'main', 'feed', { items: [updated], raw: [], coverage: { status: 'complete', to: updated.observedAt, notes: [] } }, '');
    save(row); await summarize(f.config, f.store, {}, generator, at, prepare); assert.equal(prepared, 1);
    save({ ...row, observedAt: '2026-10-10T00:30:00.000Z' });
    await summarize(f.config, f.store, {}, generator, '2026-10-10T00:30:00.000Z', prepare); assert.equal(prepared, 1);
    await summarize(f.config, f.store, {}, generator, '2026-10-10T01:00:00.000Z', prepare); assert.equal(prepared, 2);
    await summarize(f.config, f.store, {}, generator, '2026-10-18T00:00:00.000Z', prepare); assert.equal(prepared, 2, 'expired queued refresh is discarded');
    save({ ...row, text: 'Changed historical facts' });
    await summarize(f.config, f.store, {}, generator, '2026-10-18T00:00:00.000Z', prepare); assert.equal(prepared, 3);
    await summarize(f.config, f.store, { refresh: true }, generator, '2026-10-18T00:00:00.000Z', async (input, _store, _http, refresh) => { assert.equal(refresh, true); prepared++; return input; });
    assert.equal(prepared, 4);
  } finally { await f.cleanup(); }
});

test('extraction cache reuses positive and negative results and replaces changed bytes without duplicate bodies', () => {
  const store = new Store(':memory:'); let parses = 0;
  try {
    const parse = () => { parses++; return { text: 'extracted article', media: [] }; };
    assert.deepEqual(store.extracted('article', 'HTML v1', parse), store.extracted('article', 'HTML v1', parse)); assert.equal(parses, 1);
    store.extracted('article', 'HTML v2', parse); assert.equal(parses, 2);
    const missing = () => { parses++; return null; };
    assert.equal(store.extracted('missing', 'no article', missing), null); assert.equal(store.extracted('missing', 'no article', missing), null); assert.equal(parses, 3);
    assert.equal((store.db.prepare('SELECT count(*) n FROM enrichment_extractions').get() as { n: number }).n, 2);
  } finally { store.close(); }
});
