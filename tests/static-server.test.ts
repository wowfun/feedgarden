import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { staticServer } from '../scripts/static-server.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

test('preview error handling does not write headers twice after a response failure', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-static-')), server = staticServer(root);
  try {
    await writeFile(join(root, 'index.html'), 'Home');
    let ended = false;
    const response = {
      headersSent: false,
      writeHead() { assert.equal(this.headersSent, false); this.headersSent = true; return this; },
      end(bytes?: Buffer) { if (bytes) throw new Error('Response failed after headers'); ended = true; }
    };
    const handler = server.listeners('request')[0]! as (request: IncomingMessage, response: ServerResponse) => Promise<void>;
    await assert.doesNotReject(handler({ url: '/' } as IncomingMessage, response as unknown as ServerResponse));
    assert.equal(ended, true);
  } finally { server.close(); await rm(root, { recursive: true, force: true }); }
});

for (const base of ['', '/feedgarden/']) test(`preview server serves pages, Markdown and image bytes under ${base || '/'}`, async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-static-')), server = staticServer(root, base);
  try {
    await mkdir(join(root, '中文 空格'));
    await writeFile(join(root, 'index.html'), '<h1>Home</h1>');
    await writeFile(join(root, '中文 空格/index.html'), '<h1>Article</h1>');
    const cases = [
      ['article.md', 'text/plain; charset=utf-8'], ['photo.jpeg', 'image/jpeg'], ['animated.gif', 'image/gif'],
      ['image.png', 'image/png'], ['image.webp', 'image/webp'], ['image.avif', 'image/avif'],
      ['image.apng', 'image/apng'], ['image.bmp', 'image/bmp'], ['script.js', 'text/javascript'],
    ] as const;
    const bytes = Buffer.from([0, 255, 13, 10, 128]);
    for (const [name] of cases) await writeFile(join(root, name), bytes);
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const address = server.address(); assert.ok(address && typeof address !== 'string');
    const origin = `http://127.0.0.1:${address.port}`, prefix = base.replace(/\/$/, '') + '/';
    assert.equal(await (await fetch(origin + prefix)).text(), '<h1>Home</h1>');
    assert.equal(await (await fetch(origin + prefix + encodeURIComponent('中文 空格') + '/')).text(), '<h1>Article</h1>');
    if (base) {
      const redirect = await fetch(origin + '/', { redirect: 'manual' });
      assert.equal(redirect.status, 302); assert.equal(redirect.headers.get('location'), prefix);
      assert.equal((await fetch(origin + '/feedgarden-extra/')).status, 404);
    }
    for (const [name, type] of cases) {
      const response = await fetch(origin + prefix + name);
      assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), type);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
    }
    for (const path of ['missing', '%ZZ', '..%2foutside', '..%5coutside']) {
      assert.equal((await fetch(origin + prefix + path)).status, 404, path);
    }
  } finally {
    await new Promise<void>(done => server.close(() => done()));
    await rm(root, { recursive: true, force: true });
  }
});

test('preview server rejects non-local base paths', () => {
  for (const base of ['relative', 'https://example.com', '//example.com', '/base?q=1', '/base#hash']) {
    assert.throws(() => staticServer('.', base), /root-relative/);
  }
});

for (const base of ['', '/feedgarden']) test(`404 fallback stays inside the site after encoded path normalization under ${base || '/'}`, async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'feedgarden-static-boundary-')), root = join(temporary, 'site');
  await mkdir(join(root, 'zh-CN'), { recursive: true });
  const server = staticServer(root, base);
  try {
    await writeFile(join(temporary, '404.html'), 'OUTSIDE SITE');
    await writeFile(join(root, '404.html'), 'Site not found');
    await writeFile(join(root, 'zh-CN/404.html'), '找不到页面');
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const address = server.address(); assert.ok(address && typeof address !== 'string');
    const cases: [string, string][] = [
      ['..%2fmissing', ''],
      ['..%2fsite%2fmissing', 'Site not found'],
      ['..%2fsite%2fzh-CN%2fmissing', '找不到页面'],
      ['zh-CN%2f..%2fmissing', 'Site not found'],
    ];
    if (process.platform === 'win32') cases.push(['..%5csite%5cmissing', 'Site not found'], ['..%5csite%5czh-CN%5cmissing', '找不到页面']);
    for (const [path, expected] of cases) {
      const response: Response = await fetch(`http://127.0.0.1:${address.port}${base}/${path}`);
      assert.equal(response.status, 404, path); assert.equal(await response.text(), expected, path);
    }
  } finally {
    await new Promise<void>(done => server.close(() => done()));
    await rm(temporary, { recursive: true, force: true });
  }
});

for (const base of ['', '/feedgarden']) test(`missing routes serve the localized 404 shell with status 404 under ${base || '/'}`, async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-static-')), server = staticServer(root, base);
  try {
    await mkdir(join(root, 'zh-CN'));
    const english = '<html lang="en"><main>Page not found</main><footer class="site-footer">Sites</footer></html>';
    const chinese = '<html lang="zh-CN"><main>找不到页面</main><footer class="site-footer">站点</footer></html>';
    await writeFile(join(root, '404.html'), english); await writeFile(join(root, 'zh-CN/404.html'), chinese);
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const address = server.address(); assert.ok(address && typeof address !== 'string');
    const origin = `http://127.0.0.1:${address.port}`;
    for (const [path, expected] of [['missing/deep/', english], ['zh-CN/missing/deep/', chinese], ['unknown/missing', english]]) {
      const response = await fetch(`${origin}${base}/${path}`);
      assert.equal(response.status, 404); assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
      assert.equal(await response.text(), expected);
    }
    const malformed = await fetch(`${origin}${base}/%ZZ`);
    assert.equal(malformed.status, 404); assert.equal(await malformed.text(), '');
  } finally { await new Promise<void>(done => server.close(() => done())); await rm(root, { recursive: true, force: true }); }
});
