import { storagePaths } from '../src/storage-paths.js';
import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, rename, stat, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { clippingImages } from '../src/clipping-images.js';
import { downloadImage, imageType } from '../src/image-download.js';
import { fetchClippings } from '../src/fetch-clippings.js';
import { runnerLock } from '../src/runner-lock.js';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3gAAAABJRU5ErkJggg==', 'base64');
// Two complete frames and a loop extension, retained byte for byte.
const gif = Buffer.from('47494638396101000100800000000000ffffff21ff0b4e45545343415045322e30030100000021f904000a0000002c000000000100010000020244010021f904000a0000002c00000000010001000002024c01003b', 'hex');
const hash = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const resolver = async () => [{ address: '8.8.8.8', family: 4 }];
const response = (bytes: Buffer = gif, headers = {}) => new Response(new Uint8Array(bytes), { headers });
const unreachable: typeof fetch = async () => { throw new Error('Unexpected network request'); };
const fetchCli = fileURLToPath(new URL('../scripts/fetch-clippings.ts', import.meta.url));
const loader = new URL('../node_modules/tsx/dist/loader.mjs', import.meta.url).href;
async function fixture(t: TestContext) {
  const root = await mkdtemp(join(tmpdir(), 'fetch-clippings-'));
  t.after(async () => { await rm(root, { recursive: true, force: true }); });
  const clips = join(root, 'content/clippings'); await mkdir(clips, { recursive: true });
  const config = { feed: { directory: join(root, 'content'), topics: 'unused' }, storage: { root: join(root, 'storage') } };
  return { root, clips, config, article: join(clips, '文章 with spaces.md') };
}

test('concrete Markdown offsets preserve frontmatter, formatting and non-image constructs', () => {
  const source = '\uFEFF---\r\nsource_title: "![cover](https://example.com/cover)"\r\n---\r\n中文 ![a *b*](<https://example.com/a?utm_x=1&amp;sig=2>\r\n  "Title")\r\n' +
    '[link](https://example.com/link) `![code](https://example.com/code)`\r\n\r\n```md\r\n![fenced](https://example.com/fence)\r\n```\r\n\r\n    ![indent](https://example.com/indent)\r\n\r\n' +
    '<!-- ![comment](https://example.com/comment) -->\r\n%% ![ofm](https://example.com/ofm) %%\r\n<img src="https://example.com/html">\r\n![[https://example.com/wiki]]\r\n';
  const found = clippingImages(source);
  assert.deepEqual(found.urls, ['https://example.com/a?utm_x=1&sig=2']);
  assert.equal(found.rewrite(new Map([[found.urls[0]!, 'assets/a.gif']])), source.replace('https://example.com/a?utm_x=1&amp;sig=2', 'assets/a.gif'));
});
test('an unclosed OFM comment hides images through EOF without moving preceding offsets', () => {
  const source = '中文 `%%` ![before](https://example.com/before)\r\n' +
    '%% ![closed](https://example.com/closed) %%\r\n![between](https://example.com/between)\r\n' +
    '%% unclosed\r\n![hidden](https://example.com/hidden)\r\n![reference][img]\r\n\r\n[img]: https://example.com/ref';
  const found = clippingImages(source);
  assert.deepEqual(found.urls, ['https://example.com/before', 'https://example.com/between']);
  assert.equal(found.rewrite(new Map(found.urls.map(url => [url, 'assets/local.png']))),
    source.replace('https://example.com/before', 'assets/local.png').replace('https://example.com/between', 'assets/local.png'));
});

test('reference images handle shortcut/collapsed/full forms and retain shared ordinary links', () => {
  const source = '![A][IMG]\r\n![img][]\r\n![img]\r\n[link][img]\r\n\r\n[img]: <https://example.com/a> \'A "title"\'\r\n\r\n![only]\n\n[only]: https://example.com/b "kept"\n';
  const found = clippingImages(source);
  const result = found.rewrite(new Map(found.urls.map((url, i) => [url, `assets/${i}.png`])));
  assert.equal(result, '![A](<assets/0.png> "A \\"title\\"")\r\n![img](<assets/0.png> "A \\"title\\"")\r\n![img](<assets/0.png> "A \\"title\\"")\r\n[link][img]\r\n\r\n[img]: <https://example.com/a> \'A "title"\'\r\n\r\n![only]\n\n[only]: assets/1.png "kept"\n');
});

test('protocol-relative image references use HTTPS and preserve signed query bytes', () => {
  const source = '![cdn](//cdn.example.com/a?sig=A%2fB&x=1&x=2)';
  const parsed = clippingImages(source);
  assert.deepEqual(parsed.urls, ['https://cdn.example.com/a?sig=A%2fB&x=1&x=2']);
  assert.equal(parsed.rewrite(new Map([[parsed.urls[0]!, 'assets/a.gif']])), '![cdn](assets/a.gif)');
});
test('duplicate definitions follow CommonMark first-definition semantics and alt syntax is preserved', () => {
  const source = '![a [nested]](https://example.com/a_(b) "T") ![same][ID]\n\n[id]: https://example.com/a_(b)\n[id]: https://example.com/unused\n';
  const parsed = clippingImages(source);
  assert.deepEqual(parsed.urls, ['https://example.com/a_(b)']);
  assert.equal(parsed.rewrite(new Map([[parsed.urls[0]!, 'assets/file.gif']])), source.replaceAll('https://example.com/a_(b)', 'assets/file.gif'));
});
test('an ordinary reference link with an image label retains its own definition', () => {
  const source = '[![small][inner]][shared] ![large][shared]\n\n[inner]: https://example.com/small\n[shared]: https://example.com/large\n';
  const found = clippingImages(source), result = found.rewrite(new Map(found.urls.map(url => [url, 'assets/local.png'])));
  assert.equal(result, '[![small][inner]][shared] ![large](<assets/local.png>)\n\n[inner]: assets/local.png\n[shared]: https://example.com/large\n');
});
test('manual invocation requires a target and dry-run neither networks nor writes storage', async t => {
  const f = await fixture(t);
  await writeFile(f.article, '![x](https://example.com/a)');
  const result = await fetchClippings(f.config, { all: true, dryRun: true, fetch: unreachable });
  assert.equal(result[0]!.status, 'dry-run'); assert.deepEqual(result[0]!.urls, ['https://example.com/a']);
  assert.equal(existsSync(storagePaths(f.config.storage).state), false); assert.equal(existsSync(join(f.clips, 'assets')), false);
  const help = spawnSync(process.execPath, ['--import', loader, fetchCli], { encoding: 'utf8', cwd: f.root });
  assert.equal(help.status, 0); assert.match(help.stdout, /Usage:/);
});
test('GIF bytes, nested Unicode/space paths, URL dedup and content dedup survive repeated runs', async t => {
  const f = await fixture(t), nested = join(f.clips, '子 目录/next.md'); await mkdir(join(f.clips, '子 目录'));
  const original = '---\r\nsource_title: Preserve me\r\n---\r\n![a](https://example.com/a) ![b](https://example.com/a "title")\r\n';
  await writeFile(f.article, original); await writeFile(nested, '![c](https://example.com/different-url)');
  let calls = 0;
  const results = await fetchClippings(f.config, { all: true, fetch: async () => { calls++; return response(); }, resolve: resolver });
  assert.ok(results.every(row => row.status === 'updated')); assert.equal(calls, 2);
  const asset = `assets/${hash(gif)}.gif`;
  assert.deepEqual(await readFile(join(f.clips, asset)), gif);
  assert.equal(await readFile(f.article, 'utf8'), original.replaceAll('https://example.com/a', asset));
  assert.equal(await readFile(nested, 'utf8'), `![c](../${asset})`);
  const manifest = JSON.parse(await readFile(join(f.clips, 'assets/manifest.json'), 'utf8'));
  assert.equal(Object.keys(manifest.images).length, 2);
  assert.deepEqual(manifest.images['https://example.com/a'], { originalUrl: 'https://example.com/a', finalUrl: 'https://example.com/a', path: asset, mediaType: 'image/gif' });
  assert.deepEqual((await readdir(join(f.clips, 'assets'))).sort(), [`${hash(gif)}.gif`, 'manifest.json'].sort());
  const before = await stat(f.article), manifestBefore = await stat(join(f.clips, 'assets/manifest.json'));
  await fetchClippings(f.config, { all: true, fetch: unreachable });
  assert.equal((await stat(f.article)).mtimeMs, before.mtimeMs); assert.equal((await stat(join(f.clips, 'assets/manifest.json'))).mtimeMs, manifestBefore.mtimeMs);
  // A newly copied original URL reuses the local image without DNS.
  await writeFile(nested, '![new](https://example.com/a)');
  const preview = await fetchClippings(f.config, { all: true, dryRun: true, fetch: unreachable });
  assert.deepEqual(preview.find(row => row.path === f.article)!.urls, []);
  assert.deepEqual(preview.find(row => row.path === nested)!.urls, ['https://example.com/a']);
  assert.equal(await readFile(nested, 'utf8'), '![new](https://example.com/a)');
  assert.equal((await stat(join(f.clips, 'assets/manifest.json'))).mtimeMs, manifestBefore.mtimeMs);
  assert.equal((await fetchClippings(f.config, { paths: [nested], fetch: unreachable }))[0]!.status, 'updated');
  assert.equal(existsSync(storagePaths(f.config.storage).database), false);
});
test('signature controls type independently of extension/header and animation bytes remain untouched', () => {
  assert.deepEqual(imageType(gif), { extension: 'gif', mediaType: 'image/gif' });
  assert.equal(imageType(png).extension, 'png');
  const acTL = Buffer.alloc(20); acTL.writeUInt32BE(8); acTL.write('acTL', 4);
  assert.equal(imageType(Buffer.concat([png.subarray(0, 33), acTL, png.subarray(33)])).extension, 'apng');
  assert.equal(imageType(Buffer.from('RIFF0000WEBPVP8X')).extension, 'webp');
  const bmp = Buffer.alloc(26); bmp.write('BM'); bmp.writeUInt32LE(40, 14); assert.equal(imageType(bmp).extension, 'bmp');
  const avif = Buffer.alloc(24); avif.writeUInt32BE(24); avif.write('ftypmif1', 4); avif.write('avifavis', 16); assert.equal(imageType(avif).extension, 'avif');
  for (const text of ['<svg/>', '<html>Not image</html>', 'GIF89a', 'RIFF0000WAVEdata']) assert.throws(() => imageType(Buffer.from(text)), /Unsupported/);
});

test('JPEG signatures require a complete header segment and end marker', () => {
  // A complete 1x1 JPEG; signature checks do not decode pixels.
  const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABgf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCLAGVxf//Z', 'base64');
  assert.equal(imageType(jpeg).extension, 'jpg');
  for (const bytes of [Buffer.from([255, 216, 255, 224]), jpeg.subarray(0, -2),
    Buffer.from('ffd8ffe0ffff4a46494600ffd9', 'hex'), Buffer.from('ffd8ff003c68746d6c3effd9', 'hex')]) {
    assert.throws(() => imageType(bytes), /Unsupported/);
  }
});

test('cyclic error causes retain the original failure without recursion overflow', async () => {
  const error = new Error('Permanent download failure'); error.cause = error;
  await assert.rejects(downloadImage('https://example.com/image', { resolve: resolver, fetch: async () => { throw error; } }), candidate => candidate === error);
});
test('no-extension signed URLs and every redirect retain query bytes, public validation and pinned dispatcher', async () => {
  const observed: string[] = [], hosts: string[] = [];
  const result = await downloadImage('https://example.com/image?utm_token=a%2Fb&gclid=2&sig=A+B&x=1&x=2', {
    resolve: async host => { hosts.push(host); return resolver(); },
    fetch: async (url, init) => {
      observed.push(String(url)); assert.ok((init as RequestInit & { dispatcher: unknown }).dispatcher); assert.equal(init?.redirect, 'manual');
      return observed.length === 1 ? new Response(null, { status: 302, headers: { Location: 'https://cdn.example.com/no-extension?fbclid=abc&sig=%2f' } }) : response(png, { 'content-type': 'text/plain' });
    },
  });
  assert.deepEqual(hosts, ['example.com', 'cdn.example.com']);
  assert.deepEqual(observed, ['https://example.com/image?utm_token=a%2Fb&gclid=2&sig=A+B&x=1&x=2', 'https://cdn.example.com/no-extension?fbclid=abc&sig=%2f']);
  assert.equal(result.extension, 'png'); assert.equal(result.finalUrl, observed[1]); assert.deepEqual(result.bytes, png);
});
test('private redirect targets are refused and redirect count is bounded', async () => {
  let calls = 0;
  await assert.rejects(downloadImage('https://example.com/a', { resolve: resolver, fetch: async () => { calls++; return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/private' } }); } }), /non-public/);
  assert.equal(calls, 1); calls = 0;
  await assert.rejects(downloadImage('https://example.com/a', { resolve: resolver, fetch: async () => { calls++; return new Response(null, { status: 307, headers: { location: '/loop' } }); } }), /maximum 3/);
  assert.equal(calls, 4);
});

test('redirects without a Location and successful responses without a body fail without retrying', async () => {
  for (const [status, message] of [[302, /redirect has no Location/], [204, /response has no body/]] as const) {
    let calls = 0;
    await assert.rejects(downloadImage('https://example.com/a', { resolve: resolver, fetch: async () => {
      calls++; return new Response(null, { status });
    } }), message);
    assert.equal(calls, 1);
  }
});
test('non-HTTP redirects are rejected before DNS or a second request', async () => {
  for (const location of ['ftp://cdn.example.com/image.gif', 'file:///private/image.gif', 'data:image/png;base64,AAAA']) {
    let requests = 0, resolutions = 0;
    await assert.rejects(downloadImage('https://example.com/a', {
      resolve: async () => { resolutions++; return resolver(); },
      fetch: async () => { requests++; return new Response(null, { status: 302, headers: { location } }); },
    }), /Invalid public URL/);
    assert.equal(requests, 1); assert.equal(resolutions, 1);
  }
});

test('timeouts and temporary status errors retry twice; permanent and oversized responses do not', async () => {
  let calls = 0;
  await downloadImage('https://example.com/a', { resolve: resolver, retryDelayMs: 0, fetch: async () => { calls++; return calls < 3 ? new Response(null, { status: 503 }) : response(); } });
  assert.equal(calls, 3); calls = 0;
  const keepAlive = setInterval(() => {}, 1000);
  try {
    await assert.rejects(downloadImage('https://example.com/a', { resolve: resolver, timeoutMs: 10, retryDelayMs: 0, fetch: async () => { calls++; return new Promise(() => {}); } }), { name: 'TimeoutError' });
  } finally { clearInterval(keepAlive); }
  assert.equal(calls, 3);
  for (const fake of [() => new Response(null, { status: 404 }), () => response(gif, { 'content-length': '999' }), () => response(gif)]) {
    calls = 0;
    await assert.rejects(downloadImage('https://example.com/a', { resolve: resolver, maxBytes: 16, fetch: async () => { calls++; return fake(); } }), /HTTP 404|exceeds/);
    assert.equal(calls, 1);
  }
});
test('one failed image keeps its complete article while other articles finish with concurrency at most three', async t => {
  const f = await fixture(t), second = join(f.clips, 'z.md');
  const original = Array.from({ length: 5 }, (_, i) => `![${i}](https://example.com/${i})`).join('\n');
  await writeFile(f.article, original); await writeFile(second, '![good](https://example.com/good)');
  let active = 0, maximum = 0;
  const result = await fetchClippings(f.config, { all: true, resolve: resolver, fetch: async url => {
    active++; maximum = Math.max(maximum, active); await new Promise(resolve => setTimeout(resolve, 10)); active--;
    return String(url).endsWith('/2') ? new Response('<svg/>') : response();
  } });
  assert.equal(maximum, 3); assert.equal(result.filter(row => row.status === 'failed').length, 1);
  assert.equal(await readFile(f.article, 'utf8'), original); assert.match(await readFile(second, 'utf8'), /assets\/.*\.gif/);
});
for (const action of ['edit', 'rename', 'delete', 'interrupt']) test(`concurrent ${action} abandons the article commit and supports rerun`, async t => {
  const f = await fixture(t), original = '![a](https://example.com/a)', cancellation = new AbortController();
  await writeFile(f.article, original);
  const run = fetchClippings(f.config, { all: true, resolve: resolver, signal: cancellation.signal, fetch: async () => {
    if (action === 'edit') await writeFile(f.article, original + '\nUser edit');
    if (action === 'rename') await rename(f.article, f.article + '.renamed');
    if (action === 'delete') await rm(f.article);
    if (action === 'interrupt') cancellation.abort(new Error('simulated interruption'));
    return response();
  } });
  if (action === 'interrupt') await assert.rejects(run, /interruption/);
  else assert.equal((await run)[0]!.status, 'failed');
  if (action === 'edit') assert.equal(await readFile(f.article, 'utf8'), original + '\nUser edit');
  if (action === 'rename' || action === 'delete') assert.equal(existsSync(f.article), false);
  await writeFile(f.article, original);
  assert.equal((await fetchClippings(f.config, { paths: [f.article], resolve: resolver, fetch: async () => response() }))[0]!.status, 'updated');
});
test('shared runner lock and unfinished content exchange prevent mutation without opening the database', async t => {
  const f = await fixture(t); await writeFile(f.article, '![a](https://example.com/a)');
  const release = await runnerLock(storagePaths(f.config.storage).runner, new AbortController());
  try { await assert.rejects(fetchClippings(f.config, { all: true, fetch: unreachable }), { code: 'ELOCKED' }); } finally { await release(); }
  await writeFile(storagePaths(f.config.storage).contentJournal, '{}');
  await assert.rejects(fetchClippings(f.config, { all: true, fetch: unreachable }), /recovery is pending/);
  assert.equal(existsSync(storagePaths(f.config.storage).database), false);
});
test('paths are confined to clippings and malformed manifests fail closed', async t => {
  const f = await fixture(t); await writeFile(f.article, '![a](https://example.com/a)');
  await assert.rejects(fetchClippings(f.config, { paths: [join(f.root, 'content')] }), /inside configured clippings/);
  await mkdir(join(f.clips, 'assets')); await writeFile(join(f.clips, 'assets/manifest.json'), '{"version":99}');
  await assert.rejects(fetchClippings(f.config, { all: true }), /Invalid/);
  assert.equal(await readFile(f.article, 'utf8'), '![a](https://example.com/a)');
});

test('explicit asset and empty selections fail while full scans skip attachments', async t => {
  const f = await fixture(t), assets = join(f.clips, 'assets'), empty = join(f.clips, 'empty');
  await mkdir(assets); await mkdir(empty);
  await writeFile(join(assets, 'note.md'), '![private](https://example.com/a)');
  await writeFile(join(empty, 'photo.gif'), gif);
  for (const path of [assets, join(assets, 'note.md')]) {
    await assert.rejects(fetchClippings(f.config, { paths: [path], dryRun: true, fetch: unreachable }), /assets.*cannot be selected/i);
  }
  await assert.rejects(fetchClippings(f.config, { paths: [empty], dryRun: true, fetch: unreachable }), /No Markdown files selected/);
  assert.deepEqual(await fetchClippings(f.config, { all: true, dryRun: true, fetch: unreachable }), []);
  await writeFile(f.article, '![local](assets/photo.gif)');
  const result = await fetchClippings(f.config, { all: true, dryRun: true, fetch: unreachable });
  assert.deepEqual(result.map(row => row.path), [f.article]);
  if (process.platform === 'win32') {
    const selected = await fetchClippings(f.config, { paths: [f.clips.toUpperCase()], dryRun: true, fetch: unreachable });
    assert.equal(selected.length, 1, 'Case-insensitive root selection must still skip its assets subtree');
  }
  assert.equal(existsSync(storagePaths(f.config.storage).state), false);
  const configPath = join(f.root, 'config.json');
  await writeFile(configPath, JSON.stringify({ version: 2, ...f.config, agent: {}, sources: [{ id: 'news', name: 'News', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }] }] }));
  for (const path of [assets, join(assets, 'note.md'), empty]) {
    const result = spawnSync(process.execPath, ['--import', loader, fetchCli, '--config', configPath, '--dry-run', path], { cwd: f.root, encoding: 'utf8' });
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /assets.*cannot be selected|No Markdown files selected/i);
  }
});

test('Clippings selection rejects linked directories for both explicit paths and full scans', async t => {
  const f = await fixture(t), outside = join(f.root, 'outside'), linked = join(f.clips, 'linked');
  await mkdir(outside); await writeFile(join(outside, 'private.md'), '![a](https://example.com/a)');
  await symlink(outside, linked, process.platform === 'win32' ? 'junction' : 'dir');
  for (const selection of [{ all: true }, { paths: [join(linked, 'private.md')] }]) {
    await assert.rejects(fetchClippings(f.config, { ...selection, fetch: unreachable }), /must not contain symbolic links/);
  }
  assert.equal(await readFile(join(outside, 'private.md'), 'utf8'), '![a](https://example.com/a)');
  assert.equal(existsSync(join(f.clips, 'assets')), false);
});

test('linked cached asset directories cannot read or overwrite external files', async t => {
  const f = await fixture(t), outside = join(f.root, 'outside'), original = '![a](https://example.com/a)';
  await writeFile(f.article, original); await mkdir(outside);
  const manifest = '{"version":1,"images":{}}\n';
  await writeFile(join(outside, 'manifest.json'), manifest);
  await symlink(outside, join(f.clips, 'assets'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(fetchClippings(f.config, { all: true, fetch: unreachable }), /must not contain symbolic links/);
  assert.equal(await readFile(f.article, 'utf8'), original);
  assert.equal(await readFile(join(outside, 'manifest.json'), 'utf8'), manifest);
});

test('manifest URL-key mismatch fails before downloading or rewriting the article', async t => {
  const f = await fixture(t), original = '![a](https://example.com/a)';
  await writeFile(f.article, original); await mkdir(join(f.clips, 'assets'));
  const manifest = JSON.stringify({ version: 1, images: { 'https://example.com/a': {
    originalUrl: 'https://example.com/b', finalUrl: 'https://example.com/a', path: `assets/${hash(gif)}.gif`, mediaType: 'image/gif'
  } } });
  await writeFile(join(f.clips, 'assets/manifest.json'), manifest);
  await assert.rejects(fetchClippings(f.config, { all: true, fetch: unreachable }), /URL does not match its key/);
  assert.equal(await readFile(f.article, 'utf8'), original);
  assert.equal(await readFile(join(f.clips, 'assets/manifest.json'), 'utf8'), manifest);
});
test('custom CLI config and multiple paths report partial failure with a nonzero exit and no database', async t => {
  const f = await fixture(t), other = join(f.clips, 'local.md'), configPath = join(f.root, 'custom.json');
  await writeFile(f.article, '![private](http://127.0.0.1/image)'); await writeFile(other, '![local](assets/existing.png)');
  await writeFile(configPath, JSON.stringify({ version: 2, ...f.config, agent: {}, sources: [{ id: 'news', name: 'News', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }] }] }));
  const cli = spawnSync(process.execPath, ['--import', loader, fetchCli, '--config', configPath, f.article, other], { encoding: 'utf8', cwd: f.root });
  assert.equal(cli.status, 1); assert.match(cli.stdout, /unchanged:.*local.md/); assert.match(cli.stderr, /non-public/);
  assert.equal(await readFile(f.article, 'utf8'), '![private](http://127.0.0.1/image)'); assert.equal(existsSync(storagePaths(f.config.storage).database), false);
});
test('a completed attachment left before manifest commit is reusable after interruption', async t => {
  const f = await fixture(t), assets = join(f.clips, 'assets'); await mkdir(assets);
  await writeFile(join(assets, hash(gif) + '.gif'), gif); await mkdir(join(assets, '.fetch-interrupted'));
  await writeFile(join(assets, '.fetch-interrupted', 'partial'), Buffer.from('partial'));
  await writeFile(f.article, '![again](https://example.com/a)');
  const result = await fetchClippings(f.config, { all: true, resolve: resolver, fetch: async () => response() });
  assert.equal(result[0]!.status, 'updated'); assert.deepEqual(await readFile(join(assets, hash(gif) + '.gif')), gif);
  assert.equal(await readFile(join(assets, '.fetch-interrupted', 'partial'), 'utf8'), 'partial');
});
test('cached non-image attachments are rejected without replacing existing bytes or the article', async t => {
  const f = await fixture(t), original = '![a](https://example.com/a)'; await writeFile(f.article, original);
  await fetchClippings(f.config, { all: true, resolve: resolver, fetch: async () => response() });
  await writeFile(f.article, original); await writeFile(join(f.clips, `assets/${hash(gif)}.gif`), Buffer.from('corrupt'));
  const result = await fetchClippings(f.config, { all: true, fetch: unreachable });
  assert.equal(result[0]!.status, 'failed'); assert.match(result[0]!.error!, /Unsupported image signature/);
  assert.equal(await readFile(f.article, 'utf8'), original); assert.equal(await readFile(join(f.clips, `assets/${hash(gif)}.gif`), 'utf8'), 'corrupt');
});
test('a locally edited image is reused without recording or comparing size and sha256', async t => {
  const f = await fixture(t), url = 'https://example.com/a', original = `![a](${url})`;
  await writeFile(f.article, original);
  await fetchClippings(f.config, { all: true, resolve: resolver, fetch: async () => response() });
  const manifestPath = join(f.clips, 'assets/manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')), asset = manifest.images[url];
  const edited = Buffer.concat([gif, Buffer.from('local image edit')]);
  await writeFile(join(f.clips, asset.path), edited);
  await writeFile(f.article, original);
  const result = await fetchClippings(f.config, { all: true, fetch: unreachable });
  assert.equal(result[0]!.status, 'updated', result[0]!.error);
  assert.equal(await readFile(f.article, 'utf8'), `![a](${asset.path})`);
  assert.deepEqual(await readFile(join(f.clips, asset.path)), edited);
  assert.deepEqual(JSON.parse(await readFile(manifestPath, 'utf8')).images[url], {
    originalUrl: url, finalUrl: url, path: `assets/${hash(gif)}.gif`, mediaType: 'image/gif',
  });
});
