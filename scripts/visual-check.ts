import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, join, sep } from 'node:path';
import { chromium } from '@playwright/test';

const root = resolve('.jekyll-obsidian-cache/site'), output = resolve('.local/notes/0929/visual');
await mkdir(output, { recursive: true });
const mime: Record<string, string> = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url!, 'http://localhost');
    if (!url.pathname.startsWith('/feedgarden/')) { response.writeHead(404).end(); return; }
    let path = resolve(root, '.' + decodeURIComponent(url.pathname.slice('/feedgarden'.length)));
    if (!path.startsWith(root + sep) && path !== root) throw new Error('Invalid path');
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    response.setHeader('Content-Type', mime[extname(path)] ?? 'application/octet-stream'); response.end(await readFile(path));
  } catch { response.writeHead(404).end(); }
});
await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
const address = server.address(); assert.ok(address && typeof address !== 'string');
const origin = process.env.FEEDGARDEN_LIVE_ORIGIN ?? 'http://127.0.0.1:' + address.port;
const browser = await chromium.launch({ headless: true });
const checks: unknown[] = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const size = viewport.width > 600 ? 'desktop' : 'mobile';
    for (const locale of ['en', 'zh-CN']) {
      const context = await browser.newContext({ viewport }), page = await context.newPage(), errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      const prefix = '/feedgarden/' + (locale === 'en' ? '' : locale + '/');
      const response = await page.goto(origin + prefix); assert.equal(response?.status(), 200);
      assert.equal(await page.locator('html').getAttribute('lang'), locale);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('main table tbody tr').count(), 8);
      const reportHref = await page.locator('main table tbody tr').filter({ hasText: 'OpenAI' }).locator('a').nth(1).getAttribute('href'); assert.ok(reportHref);
      const longReport = page.locator('main table tbody tr').filter({ hasText: 'Hacker News' }).locator('a').nth(1);
      const longReportHref = await longReport.count() ? await longReport.getAttribute('href') : undefined;
      await page.screenshot({ path: join(output, 'home-' + locale + '-' + size + '.png'), fullPage: true });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Home overflows viewport');
      const brand = page.locator('.site-mark__name');
      assert.ok(await brand.evaluate(element => element.clientHeight < 24), 'Brand wraps onto a second line');
      assert.ok(await brand.evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'Feedgarden brand is truncated');
      await page.locator('[data-search-open]:visible').first().click();
      await page.locator('[data-search-input]').fill('OpenAI');
      await page.locator('[data-search-results] a').first().waitFor();
      await page.keyboard.press('Escape');
      await page.goto(origin + reportHref);
      assert.equal(await page.locator('h1').count(), 1);
      assert.ok(await page.locator('main h2').count() >= 1);
      if (locale === 'zh-CN') assert.match(await page.locator('[data-search-open]:visible').first().textContent() ?? '', /搜索/);
      const markdown = await page.locator('[data-markdown-url]').getAttribute('data-markdown-url'); assert.ok(markdown);
      const download = await page.request.get(origin + markdown); assert.equal(download.status(), 200); assert.match(await download.text(), /OpenAI/);
      await page.locator('[data-language-switcher] summary').click();
      const other = locale === 'en' ? 'zh-CN' : 'en';
      assert.equal(await page.locator('[data-language-switcher] a[lang="' + other + '"]').getAttribute('href'), '/feedgarden/' + (other === 'en' ? '' : other + '/') + reportHref.slice(prefix.length));
      await page.locator('[data-language-switcher] summary').click();
      await page.screenshot({ path: join(output, 'report-' + locale + '-' + size + '.png'), fullPage: true });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Report overflows viewport');
      for (const path of [prefix + 'openai/', reportHref.replace(/[^/]+\/$/, ''), prefix + 'feed.xml']) assert.equal((await page.request.get(origin + path)).status(), 200, path);
      const feed = await (await page.request.get(origin + prefix + 'feed.xml')).text(); assert.match(feed, /<entry>/);
      if (longReportHref) {
        await page.goto(origin + longReportHref);
        const count = await page.locator('.note-content h2').count(); assert.ok(count > 0 && count <= 50);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Long report overflows viewport');
        await page.screenshot({ path: join(output, 'long-report-' + locale + '-' + size + '.png') });
      }
      const arxiv = await page.request.get(origin + prefix + 'arxiv/2026/2026-09-21-Weekly/');
      if (arxiv.status() === 200) {
        await page.goto(arxiv.url());
        assert.equal(await page.locator('.note-content [data-math-style]').count(), 0, 'Plain report punctuation became math');
        await page.screenshot({ path: join(output, 'weekly-' + locale + '-' + size + '.png') });
      }
      assert.deepEqual(errors, []);
      checks.push({ locale, size, origin, search: 'passed', markdown: 'passed', languageSwitch: 'passed', archives: 'passed', feed: 'passed', overflow: 'none', scriptErrors: errors });
      await context.close();
    }
  }
  await writeFile(join(output, 'checks.json'), JSON.stringify(checks, null, 2));
  console.log(JSON.stringify(checks, null, 2));
} finally { await browser.close(); await new Promise<void>(done => server.close(() => done())); }
