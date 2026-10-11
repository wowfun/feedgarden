import test from 'node:test';
import assert from 'node:assert/strict';
import { Http } from '../src/http.js';
import { Store } from '../src/store.js';
import { getEventListeners } from 'node:events';

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
