import test from 'node:test';
import assert from 'node:assert/strict';
import { Http, HttpError } from '../src/http.js';
import { Store } from '../src/store.js';
import { configSchema } from '../src/config.js';
import { collect } from '../src/collect.js';
import { adapters } from '../src/channels/index.js';
import { getEventListeners } from 'node:events';

test('rate limits accept epoch and relative resets, honor Retry-After, and bound malformed delays', async t => {
  const now = Date.parse('2026-10-13T00:00:00Z');
  t.mock.timers.enable({ apis: ['Date'], now });
  const cases: [string, Record<string, string>, number][] = [
    ['api.github.com', { 'x-ratelimit-reset': String(now / 1000 + 45) }, 45],
    ['other-api.test', { 'x-ratelimit-reset': String(now / 1000 + 60) }, 60],
    ['oauth.reddit.com', { 'x-ratelimit-reset': '90.5' }, 90.5],
    ['other-api.test', { 'x-ratelimit-reset': String(now / 1000 - 20) }, 1],
    ['other-api.test', { 'retry-after': '30', 'x-ratelimit-reset': String(now / 1000 + 60) }, 30],
    ['other-api.test', { 'retry-after': new Date(now + 120_000).toUTCString() }, 120],
    ['other-api.test', { 'retry-after': 'invalid', 'x-ratelimit-reset': String(now / 1000 + 60) }, 60],
    ['other-api.test', { 'retry-after': '1'.repeat(100) }, 86400],
    ['other-api.test', { 'x-ratelimit-reset': 'not-a-number' }, 1800],
    ['other-api.test', { 'x-ratelimit-reset': String(now + 60_000) }, 1800],
    ['api.github.com', { 'x-ratelimit-reset': String(now + 60_000) }, 1800],
  ];
  for (const [host, headers, seconds] of cases) {
    const store = new Store(':memory:'); let calls = 0;
    try {
      const http = new Http(store, async () => { calls++; return new Response('wait', { status: 429, headers }); });
      const check = (error: unknown) => error instanceof HttpError && error.retryAt === new Date(now + seconds * 1000).toISOString();
      await assert.rejects(http.get(`https://${host}/one`), check, JSON.stringify(headers));
      await assert.rejects(http.get(`https://${host}/two`), check);
      assert.equal(calls, 1);
    } finally { store.close(); }
  }
});

test('collection persists the bounded reset and resumes when the saved cooldown expires', async t => {
  const now = Date.parse('2026-10-13T00:00:00Z');
  t.mock.timers.enable({ apis: ['Date'], now });
  const config = configSchema.parse({ version: 2, agent: { model: 'fixture' }, sources: [{ id: 'one', name: 'One', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }] }] });
  const store = new Store(':memory:'); let calls = 0;
  const registry: typeof adapters = { ...adapters, feed: async c => {
    calls++;
    if (calls === 1) await new Http(store, async () => new Response('wait', { status: 429, headers: { 'x-ratelimit-reset': String(now / 1000 + 60) } })).get('https://other-api.test/feed');
    return { items: [], raw: [], coverage: { status: 'complete', to: c.now, notes: [] } };
  } };
  try {
    await collect(config, store, undefined, true, registry);
    assert.equal(store.channel('one', 'main', 'feed')?.next_attempt, new Date(now + 60_000).toISOString());
    assert.deepEqual(await collect(config, store, undefined, true, registry), [{ source: 'one', stream: 'main', status: 'deferred', reason: 'Channels are cooling down' }]);
    assert.equal(calls, 1);
    t.mock.timers.tick(61_000);
    assert.equal((await collect(config, store, undefined, true, registry))[0]?.status, 'complete');
    assert.equal(calls, 2);
  } finally { store.close(); }
});

test('fetch aborts oversized declared and streamed byte counts before EOF', async () => {
  for (const declared of [true, false]) {
    const store = new Store(':memory:'); let pulls = 0, cancelled = false;
    const response = new Response(new ReadableStream<Uint8Array>({
      pull(controller) { pulls++; if (pulls <= 20) controller.enqueue(new Uint8Array(1_000_000)); else controller.close(); },
      cancel() { cancelled = true; },
    }), { headers: declared ? { 'content-length': '20000000' } : {} });
    try {
      await assert.rejects(new Http(store, async () => response).get('https://example.test/large'), /12 MB/);
      assert.ok(cancelled); assert.ok(pulls < 20);
      if (declared) assert.ok(pulls <= 1);
      assert.equal(store.cache('https://example.test/large'), undefined);
    } finally { store.close(); }
  }
});

test('fetch counts UTF-8 bytes and decodes characters split across chunks', async () => {
  const store = new Store(':memory:');
  try {
    const bytes = new TextEncoder().encode('测'.repeat(4_000_001));
    await assert.rejects(new Http(store, async () => new Response(bytes)).get('https://example.test/unicode-large'), /12 MB/);
    const encoded = new TextEncoder().encode('英文与中文🙂');
    let index = 0;
    const response = new Response(new ReadableStream({ pull(controller) { if (index < encoded.length) controller.enqueue(encoded.subarray(index, ++index)); else controller.close(); } }));
    const http = new Http(store, async (_url, init) => { assert.ok(init?.signal); return response; });
    assert.equal((await http.get('https://example.test/unicode')).body, '英文与中文🙂');
    const cached = new Http(store, async () => new Response(null, { status: 304 }));
    assert.equal((await cached.get('https://example.test/unicode')).body, '英文与中文🙂');
  } finally { store.close(); }
});

test('runner cancellation interrupts host spacing without issuing another request', async () => {
  const store = new Store(':memory:'), cancellation = new AbortController(); let calls = 0;
  const reason = new Error('Lost database job lease');
  try {
    const http = new Http(store, async () => { calls++; return new Response('ok'); }, cancellation.signal);
    await http.get('https://example.test/first', 60_000);
    const pending = http.get('https://example.test/second');
    cancellation.abort(reason);
    await assert.rejects(pending, /abort|Lost database job lease/i);
    assert.equal(calls, 1);
  } finally { store.close(); }
});

test('cancelling a queued host request detaches its abort listener while the preceding body remains open', async () => {
  const store = new Store(':memory:'), cancellation = new AbortController(); let calls = 0, close!: () => void, started!: () => void;
  const firstStarted = new Promise<void>(resolve => { started = resolve; });
  try {
    const http = new Http(store, async () => {
      calls++;
      return new Response(new ReadableStream({ start(controller) { close = () => controller.close(); started(); } }));
    }, cancellation.signal);
    const first = http.get('https://example.test/first', 50); await firstStarted;
    const queued = http.get('https://example.test/second');
    await new Promise<void>(resolve => setImmediate(resolve));
    assert.ok(getEventListeners(cancellation.signal, 'abort').length > 0);
    cancellation.abort(new Error('Stop queued work'));
    await assert.rejects(queued, /Stop queued work/);
    assert.equal(getEventListeners(cancellation.signal, 'abort').length, 0);
    assert.equal(calls, 1);
    close(); await first;
  } finally { store.close(); }
});
