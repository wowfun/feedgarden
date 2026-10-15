import test from 'node:test';
import assert from 'node:assert/strict';
import { Http } from '../src/http.js';
import { Store } from '../src/store.js';
import { publicAddress } from '../src/public-url.js';
import { resolvePublicTarget } from '../src/public-url.js';
import { publicDispatcher } from '../src/public-http.js';
import { createServer as httpServer } from 'node:http';
import { createServer as httpsServer } from 'node:https';
import { connect } from 'node:net';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import type { AddressInfo } from 'node:net';

test('public requests carry their validated connection dispatcher and original Host', async () => {
  const store = new Store(':memory:');
  try {
    const http = new Http(store, async (url, init) => {
      assert.equal(String(url), 'https://1.1.1.1/article');
      assert.ok((init as RequestInit & { dispatcher?: unknown }).dispatcher, 'validated address must control the connection');
      assert.equal(new Headers(init?.headers).get('host'), '1.1.1.1');
      return new Response('Public article');
    });
    assert.equal((await http.get('https://1.1.1.1/article', 0, 'fetch', true)).body, 'Public article');
  } finally { store.close(); }
});

test('public addresses exclude special-purpose IPv6 and embedded IPv4 transports', () => {
  for (const address of ['2001::1', '2001:2::1', '2001:10::1', '2001:20::1', '2001:30::1', '5f00::1', '64:ff9b:1::7f00:1', '2002:7f00:1::1', '100::1', '100:0:0:1::1', '3fff::1', '::127.0.0.1', 'fec0::1']) {
    assert.equal(publicAddress(address), false, address);
  }
  for (const address of ['8.8.8.8', '2606:4700:4700::1111', '2001:4860:4860::8888']) assert.equal(publicAddress(address), true, address);
});

test('public dispatchers fail closed for proxy protocols that bypass the pinned pool factory', () => {
  assert.throws(() => publicDispatcher({ url: 'https://publisher.example/article', address: '8.8.8.8' }, {
    httpProxy: 'socks5://127.0.0.1:1080', httpsProxy: 'socks5://127.0.0.1:1080', noProxy: '',
  }), /HTTP\(S\) proxy/);
});

test('direct and NO_PROXY connections retain Host, SNI and CA verification without another hostname lookup', async () => {
  const cert = await readFile(new URL('./fixtures/public-http/cert.pem', import.meta.url));
  const key = await readFile(new URL('./fixtures/public-http/key.pem', import.meta.url));
  const observed: unknown[] = [];
  const origin = httpsServer({ cert, key }, (req, res) => {
    observed.push({ host: req.headers.host, servername: (req.socket as import('node:tls').TLSSocket).servername });
    res.end('Public article');
  });
  origin.listen(0, '127.0.0.1'); await once(origin, 'listening');
  const port = (origin.address() as AddressInfo).port;
  try {
    for (const noProxy of ['*', 'publisher.example:' + port, '.example']) {
      const url = 'https://publisher.example:' + port + '/article';
      // Loopback stands in for an already validated destination in this
      // transport-only fixture; policy tests above independently reject it.
      const dispatcher = publicDispatcher({ url, address: '127.0.0.1' }, {
        httpProxy: 'http://127.0.0.1:1', httpsProxy: 'http://127.0.0.1:1', noProxy,
        connect: { ca: cert, lookup() { throw new Error('Destination DNS must not run again'); } },
      });
      try {
        const response = await fetch(url, { headers: { Host: 'publisher.example:' + port }, dispatcher } as RequestInit);
        assert.equal(await response.text(), 'Public article');
      } finally { await dispatcher.destroy(); }
    }
    assert.deepEqual(observed, Array.from({ length: 3 }, () => ({ host: 'publisher.example:' + port, servername: 'publisher.example' })));
    const dispatcher = publicDispatcher({ url: 'https://wrong.example:' + port, address: '127.0.0.1' }, { noProxy: '*', connect: { ca: cert } });
    try {
      await assert.rejects(fetch('https://wrong.example:' + port, { headers: { Host: 'wrong.example:' + port }, dispatcher } as RequestInit),
        error => (error as Error & { cause?: { code?: string } }).cause?.code === 'ERR_TLS_CERT_ALTNAME_INVALID');
    } finally { await dispatcher.destroy(); }
  } finally { origin.closeAllConnections(); origin.close(); await once(origin, 'close'); }
});

test('HTTP and HTTPS proxy CONNECT use the validated IP while origin Host and TLS remain unchanged', async () => {
  const cert = await readFile(new URL('./fixtures/public-http/cert.pem', import.meta.url));
  const key = await readFile(new URL('./fixtures/public-http/key.pem', import.meta.url));
  const requests: unknown[] = [], tunnels: string[] = [], sockets = new Set<import('node:stream').Duplex>();
  const plain = httpServer((req, res) => { requests.push({ host: req.headers.host }); res.end('Public article'); });
  plain.listen(0, '127.0.0.1'); await once(plain, 'listening');
  const origin = httpsServer({ cert, key }, (req, res) => {
    requests.push({ host: req.headers.host, servername: (req.socket as import('node:tls').TLSSocket).servername });
    res.end('Public article');
  });
  origin.listen(0, '127.0.0.1'); await once(origin, 'listening');
  const proxy = httpServer(), secureProxy = httpsServer({ cert, key });
  const tunnel = (req: import('node:http').IncomingMessage, socket: import('node:stream').Duplex, head: Buffer) => {
    tunnels.push(req.url!); sockets.add(socket);
    const upstream = connect(((req.url!.endsWith(':80') ? plain : origin).address() as AddressInfo).port, '127.0.0.1'); sockets.add(upstream);
    upstream.on('error', () => socket.destroy()); socket.on('error', () => upstream.destroy());
    upstream.once('connect', () => {
      socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length) upstream.write(head);
      socket.pipe(upstream).pipe(socket);
    });
  };
  proxy.on('connect', tunnel); secureProxy.on('connect', tunnel);
  proxy.listen(0, '127.0.0.1'); await once(proxy, 'listening');
  secureProxy.listen(0, '127.0.0.1'); await once(secureProxy, 'listening');
  const proxyUrl = 'http://127.0.0.1:' + (proxy.address() as AddressInfo).port;
  const resolver = async () => [{ address: '8.8.8.8', family: 4 }];
  try {
    const target = await resolvePublicTarget('https://publisher.example/article', resolver);
    const dispatcher = publicDispatcher(target, { httpProxy: proxyUrl, httpsProxy: proxyUrl, noProxy: '', requestTls: { ca: cert } });
    try { assert.equal(await (await fetch(target.url, { dispatcher, headers: { Host: 'publisher.example' } } as RequestInit)).text(), 'Public article'); }
    finally { await dispatcher.destroy(); }
    assert.deepEqual(tunnels, ['8.8.8.8:443']);
    assert.deepEqual(requests, [{ host: 'publisher.example', servername: 'publisher.example' }]);
    // Exercise the entire production Http path in a fresh process whose
    // environment proxy and trusted fixture CA are set before module loading.
    const { stdout } = await promisify(execFile)(process.execPath, ['--import', 'tsx', 'tests/fixtures/public-http/request.ts'], {
      env: { ...process.env, HTTP_PROXY: proxyUrl, HTTPS_PROXY: proxyUrl, NO_PROXY: '', http_proxy: proxyUrl, https_proxy: proxyUrl, no_proxy: '', NODE_EXTRA_CA_CERTS: fileURLToPath(new URL('./fixtures/public-http/cert.pem', import.meta.url)) },
      timeout: 15000,
    });
    assert.deepEqual(JSON.parse(stdout), { body: 'Public article', resolutions: 1 });
    assert.deepEqual(tunnels, ['8.8.8.8:443', '8.8.8.8:443']);
    assert.deepEqual(requests[1], { host: 'publisher.example', servername: 'publisher.example' });
    const httpTarget = await resolvePublicTarget('http://publisher.example/article', resolver);
    const httpDispatcher = publicDispatcher(httpTarget, { httpProxy: proxyUrl, httpsProxy: proxyUrl, noProxy: '' });
    try { assert.equal(await (await fetch(httpTarget.url, { dispatcher: httpDispatcher } as RequestInit)).text(), 'Public article'); }
    finally { await httpDispatcher.destroy(); }
    assert.equal(tunnels[2], '8.8.8.8:80'); assert.deepEqual(requests[2], { host: 'publisher.example' });
    const secureProxyUrl = 'https://publisher.example:' + (secureProxy.address() as AddressInfo).port;
    for (const address of ['8.8.8.8', '2606:4700:4700::1111']) {
      const dispatcher = publicDispatcher({ ...target, address }, {
        httpProxy: secureProxyUrl, httpsProxy: secureProxyUrl, noProxy: '', requestTls: { ca: cert },
        proxyTls: { ca: cert, autoSelectFamily: false, lookup(_host, _options, callback) { callback(null, '127.0.0.1', 4); } },
      });
      try { assert.equal(await (await fetch(target.url, { dispatcher } as RequestInit)).text(), 'Public article'); }
      finally { await dispatcher.destroy(); }
    }
    assert.deepEqual(tunnels.slice(3), ['8.8.8.8:443', '[2606:4700:4700::1111]:443']);
    assert.deepEqual(requests.slice(3), Array.from({ length: 2 }, () => ({ host: 'publisher.example', servername: 'publisher.example' })));
  } finally {
    for (const socket of sockets) socket.destroy();
    proxy.close(); secureProxy.close(); origin.closeAllConnections(); origin.close(); plain.closeAllConnections(); plain.close();
    await Promise.all([once(proxy, 'close'), once(secureProxy, 'close'), once(origin, 'close'), once(plain, 'close')]);
  }
});

test('redirects resolve independently and reject a newly private answer before fetching it', async () => {
  const store = new Store(':memory:'); let resolutions = 0, requests = 0;
  try {
    const http = new Http(store, async () => { requests++; return new Response(null, { status: 302, headers: { location: '/next' } }); }, undefined,
      async () => [{ address: ++resolutions === 1 ? '8.8.8.8' : '127.0.0.1', family: 4 }]);
    await assert.rejects(http.get('https://publisher.example/start', 0, 'fetch', true), /non-public address/);
    assert.equal(resolutions, 2); assert.equal(requests, 1);
  } finally { store.close(); }
});
