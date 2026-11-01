import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { resolvePublicTarget } from '../../src/platform/http/destination.js';

function configure(t: TestContext, endpoint: string) {
  const previous = process.env.FEEDGARDEN_DNS_OVER_HTTPS;
  process.env.FEEDGARDEN_DNS_OVER_HTTPS = endpoint;
  t.after(() => {
    if (previous === undefined) delete process.env.FEEDGARDEN_DNS_OVER_HTTPS;
    else process.env.FEEDGARDEN_DNS_OVER_HTTPS = previous;
  });
}

test('configured DoH resolves public destinations and shares concurrent A/AAAA queries', async t => {
  configure(t, 'https://resolver.example/dns-query');
  const queries: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string | URL, init: RequestInit) => {
    const url = new URL(String(input)), type = Number(url.searchParams.get('type'));
    queries.push(url.searchParams.get('name')! + ':' + type);
    assert.equal(url.origin, 'https://resolver.example');
    assert.equal(new Headers(init.headers).get('accept'), 'application/dns-json');
    assert.equal(init.redirect, 'error');
    assert.ok(init.signal);
    return Response.json({ Status: 0, Question: [{ name: 'publisher.example.', type }],
      Answer: type === 1 ? [{ name: 'publisher.example.', type: 1, TTL: 60, data: '8.8.8.8' }] : [] });
  });
  const results = await Promise.all(Array.from({ length: 5 }, () => resolvePublicTarget('https://publisher.example/article')));
  assert.ok(results.every(result => result.address === '8.8.8.8'));
  assert.deepEqual(queries.sort(), ['publisher.example:1', 'publisher.example:28']);
  assert.equal((await resolvePublicTarget('https://publisher.example/another')).address, '8.8.8.8');
  assert.equal(queries.length, 2);
});

test('DoH answers still reject private, mixed, fake and malformed addresses', async t => {
  for (const address of ['127.0.0.1', '198.18.0.1', '2001:2::1', 'not-an-address']) {
    await t.test(address, async t => {
      configure(t, 'https://resolver.example/' + encodeURIComponent(address));
      t.mock.method(globalThis, 'fetch', async (input: string | URL) => {
        const type = Number(new URL(String(input)).searchParams.get('type'));
        return Response.json({ Status: 0, Question: [{ name: 'publisher.example', type }],
          Answer: type === 1 ? [{ type: 1, TTL: 0, data: '8.8.8.8' }, { type: address.includes(':') ? 28 : 1, TTL: 0, data: address }] : [] });
      });
      await assert.rejects(resolvePublicTarget('https://publisher.example'), /non-public|invalid.*address/i);
    });
  }
});

test('DoH fails closed on query errors or mismatched questions and never falls back to system DNS', async t => {
  for (const failure of ['http', 'dns', 'question', 'truncated', 'json', 'large']) {
    await t.test(failure, async t => {
      configure(t, 'https://resolver.example/' + failure);
      t.mock.method(globalThis, 'fetch', async (input: string | URL) => {
        if (failure === 'http') return new Response('unavailable', { status: 503 });
        if (failure === 'json') return new Response('{');
        if (failure === 'large') return new Response(' '.repeat(70_000));
        const type = Number(new URL(String(input)).searchParams.get('type'));
        return Response.json({ Status: failure === 'dns' ? 2 : 0, TC: failure === 'truncated',
          Question: [{ name: failure === 'question' ? 'another.example' : 'publisher.example', type }], Answer: [] });
      });
      await assert.rejects(resolvePublicTarget('https://publisher.example'), /DNS-over-HTTPS/);
    });
  }
});

test('resolver configuration requires HTTPS without credentials or fragments and literal destinations bypass DNS', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('No request expected'); });
  for (const endpoint of ['not a URL', 'http://resolver.example/query', 'https://user:secret@resolver.example/query', 'https://resolver.example/query#fragment']) {
    configure(t, endpoint);
    await assert.rejects(resolvePublicTarget('https://publisher.example'), /DNS-over-HTTPS.*HTTPS|DNS-over-HTTPS.*credentials/);
  }
  assert.equal((await resolvePublicTarget('https://8.8.8.8')).address, '8.8.8.8');
  await assert.rejects(resolvePublicTarget('https://127.0.0.1'), /non-public/);
});

test('DoH cache refreshes at the answer TTL and caps long TTLs at sixty seconds', async t => {
  configure(t, 'https://resolver.example/ttl');
  let now = 0, queries = 0, address = '8.8.8.8', ttl = 2;
  t.mock.method(Date, 'now', () => now);
  t.mock.method(globalThis, 'fetch', async (input: string | URL) => {
    queries++;
    const url = new URL(String(input)), type = Number(url.searchParams.get('type'));
    return Response.json({ Status: 0, Question: [{ name: 'publisher.example', type }],
      Answer: type === 1 ? [{ type: 1, TTL: ttl, data: address }] : [] });
  });
  assert.equal((await resolvePublicTarget('https://publisher.example')).address, '8.8.8.8');
  address = '1.1.1.1'; ttl = 3600; now = 1999;
  assert.equal((await resolvePublicTarget('https://publisher.example')).address, '8.8.8.8');
  assert.equal(queries, 2);
  now = 2000;
  assert.equal((await resolvePublicTarget('https://publisher.example')).address, '1.1.1.1');
  assert.equal(queries, 4);
  address = '9.9.9.9'; now = 61_999;
  assert.equal((await resolvePublicTarget('https://publisher.example')).address, '1.1.1.1');
  now = 62_000;
  assert.equal((await resolvePublicTarget('https://publisher.example')).address, '9.9.9.9');
  assert.equal(queries, 6);
});

test('a failed DoH query is evicted so the same hostname can recover immediately', async t => {
  configure(t, 'https://resolver.example/retry');
  let failing = true, queries = 0;
  t.mock.method(globalThis, 'fetch', async (input: string | URL) => {
    queries++;
    const type = Number(new URL(String(input)).searchParams.get('type'));
    if (failing && type === 1) return new Response('Unavailable', { status: 503 });
    return Response.json({ Status: 0, Question: [{ name: 'publisher.example', type }],
      Answer: type === 1 ? [{ type: 1, TTL: 60, data: '8.8.8.8' }] : [] });
  });
  await assert.rejects(resolvePublicTarget('https://publisher.example'), /DNS-over-HTTPS/);
  failing = false;
  assert.equal((await resolvePublicTarget('https://publisher.example')).address, '8.8.8.8');
  assert.equal(queries, 4);
});
