import { chromium } from '@playwright/test';
import { DateTime } from 'luxon';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir,mkdtemp,readFile,writeFile } from 'node:fs/promises';
import { join,resolve } from 'node:path';
import { promisify } from 'node:util';
import { editConfig,setup } from '../src/app/index.js';
import { targetSchema } from '../src/contracts/configuration.js';
import type { Item } from '../src/contracts/items.js';
import { loadInstance } from '../src/instance/index.js';
import { openInstance } from '../src/storage/index.js';
import { staticServer } from '../src/ui/index.js';

const directory = resolve('.local/acceptance/ui');
await mkdir(directory, { recursive: true });
const root = await mkdtemp(join(directory, 'run-'));
await setup({ workspace: root });
let loaded = loadInstance({ workspace: root });
const output = join(root, 'export'),
  target = targetSchema.parse({
    id: 'preview',
    repository: 'unused-local-preview',
    format: 'jekyll',
    managedPrefix: 'content',
    output,
    ui: { title: 'Feedgarden UI smoke', url: 'http://127.0.0.1' },
  });
await editConfig(loaded.paths.configFile, ['targets'], [target]);
loaded = loadInstance({ workspace: root });
const at = DateTime.now()
  .setZone(loaded.config.timezone)
  .minus({ days: 1 })
  .startOf('day')
  .plus({ hours: 12 })
  .toUTC()
  .toISO()!;
const item: Item = {
  source: 'hackernews',
  id: '42',
  stream: 'frontpage',
  channel: 'fixture',
  title: 'Feedgarden UI smoke',
  url: 'https://example.invalid/evidence',
  publishedAt: at,
  observedAt: at,
  basis: 'published',
  text: 'Fixture evidence only.',
  metrics: {},
};
const store = openInstance(loaded.config);
try {
  store.saveCollection(
    item.source,
    item.stream,
    item.channel,
    { items: [item], raw: [], coverage: { status: 'complete', to: at, notes: [] } },
    '',
  );
  const copy = {
    source: item.source,
    id: item.id,
    topics: [],
    en: { title: item.title, summary: 'Fixture evidence only.' },
    'zh-CN': { title: '界面验证', summary: '仅使用测试资料。' },
  };
  store.jobs.acceptSummary(
      item.source,
      item.id,
      'fixture',
      JSON.stringify({ item, copy, firstSeen: at, date: at, dateBasis: 'published', updated: at }),
      at,
    );
} finally {
  store.close();
}
await mkdir(join(output, 'clippings'), { recursive: true });
await writeFile(
  join(output, 'clippings/example.md'),
  '---\ntitle: Shared clipping\nlang: zh-CN\npublished: ' + at + '\n---\n\n一份共享摘录。\n',
);
const invoke = async (...args: string[]) =>
  JSON.parse(
    (
      await promisify(execFile)(
        process.execPath,
        [resolve('dist/src/cli.js'), '--workspace', root, ...args],
        { timeout: 600000, windowsHide: true, maxBuffer: 8_000_000 },
      )
    ).stdout,
  );
const exported = await invoke('export', '--target', 'preview');
assert.equal(exported.state, 'completed');
const built = await invoke('ui', 'build', '--target', 'preview');
assert.equal(built.state, 'completed');
assert.ok(built.runId);
const site = built.result.site;
const server = staticServer(site);
await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  const base = 'http://127.0.0.1:' + (server.address() as { port: number }).port,
    page = await browser.newPage({ viewport: { width: 1365, height: 900 } }),
    errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [prefix, title] of [
    ['', 'Feedgarden UI smoke'],
    ['zh-CN/', '界面验证'],
  ]) {
    await page.goto(base + '/' + prefix, { waitUntil: 'networkidle' });
    assert.ok((await page.locator('body').textContent())!.includes(title!));
    await page.screenshot({ path: join(root, prefix ? 'home.zh-CN.png' : 'home.en.png'), fullPage: true });
    const html = await readFile(join(site, prefix!, 'clippings/example/index.html'), 'utf8');
    assert.match(html, /一份共享摘录/);
    assert.doesNotMatch(html, /translation-fallback/);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await new Promise<void>((done, fail) => server.close((error) => (error ? fail(error) : done())));
}
await writeFile(
  join(root, 'receipt.json'),
  JSON.stringify(
    { site, exportRun: exported.runId, buildRun: built.runId, browser: 'passed', liveProviders: false },
    null,
    2,
  ),
);
console.log('Trusted packaged UI validation passed: ' + root);
