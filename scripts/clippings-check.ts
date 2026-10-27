import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium, expect, type Page } from '@playwright/test';
import { checkArchiveExport } from './archive-export-check.js';
import { staticServer } from './static-server.js';

export async function checkClippings(root: string, output: string, fixture: boolean): Promise<void> {
  root = resolve(root); await mkdir(output, { recursive: true });
  const server = staticServer(root, '/feedgarden');
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const origin = 'http://127.0.0.1:' + address.port, browser = await chromium.launch({ headless: true });
  const ready = async (page: Page) => {
    await page.waitForFunction(() => document.querySelector('[data-paged-archive]') && !document.querySelector('[data-paged-archive]')!.hasAttribute('aria-busy') && document.querySelector('[data-archive-page-status]')?.textContent && document.querySelector('[data-archive-status]')?.textContent === '');
  };
  const evidence: unknown[] = [];
  try {
    for (const width of [1440, 390]) for (const locale of ['en', 'zh-CN']) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      const page = await context.newPage(), errors: string[] = [];
      const imageRequests: string[] = [];
      page.on('request', request => { if (request.resourceType() === 'image') imageRequests.push(request.url()); });
      page.on('pageerror', error => errors.push(error.message));
      const prefix = '/feedgarden/' + (locale === 'en' ? '' : 'zh-CN/'), other = locale === 'en' ? 'zh-CN' : 'en';
      await page.goto(origin + prefix); await ready(page);
      const ids = await page.locator('.site-header [data-navigation-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-navigation-id')));
      assert.ok(ids.includes('home'), 'Home navigation must be present');
      assert.ok(ids.indexOf('clippings') > ids.indexOf('home'));
      if (ids.includes('podcasts')) assert.ok(ids.indexOf('clippings') < ids.indexOf('podcasts'));
      if (fixture) {
        await expect(page.locator('[data-filter-item]')).toHaveCount(50);
        const manifest = await (await page.request.get(origin + (await page.locator('[data-paged-archive]').getAttribute('data-archive-url'))!)).json();
        assert.deepEqual(manifest.tab_sources, ['arxiv']);
        await page.goto(origin + prefix + '?source=clippings'); await ready(page);
        await expect(page.locator('[data-filter-item]')).toHaveCount(50);
        await expect(page.locator('.blog-ledger__main strong').first()).toHaveText('Clipping 051');
      }
      await page.goto(origin + prefix + 'clippings/'); await ready(page);
      await expect(page.locator('.translation-fallback')).toHaveCount(0);
      if (!fixture) {
        const count = await page.locator('[data-filter-item]').count();
        assert.ok(count <= 50);
        if (!count) await expect(page.locator('[data-archive-empty]')).toBeVisible();
        if (count) {
          await page.locator('[data-archive-reading-toggle]').click();
          const images = page.locator('.archive-reading__body img');
          await expect(images.first()).toBeVisible();
          for (const image of await images.all()) {
            await image.scrollIntoViewIfNeeded();
            await expect(image).toHaveAttribute('src', /\/assets\/vault\/clippings\/assets\//);
            await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
          }
          await page.locator('[data-archive-export-open]').scrollIntoViewIfNeeded();
          await checkArchiveExport(page, root, output, `images-export-${locale}-${width}`, locale);
          const exported = await readFile(join(output, `images-export-${locale}-${width}.md`), 'utf8');
          assert.doesNotMatch(exported, /assets\.claude\.com/);
          assert.match(exported, /https:\/\/sinputer\.top\/feedgarden\/assets\/vault\/clippings\/assets\//);
        }
      } else {
        await expect(page.locator('[data-filter-item]')).toHaveCount(50);
        await page.locator('[data-archive-page="next"]').click(); await ready(page);
        await expect(page.locator('[data-filter-item]')).toHaveCount(2);
        await expect(page.locator('.blog-ledger__main strong')).toHaveText(['Clipping 001', 'Clipping 000']);
        await page.goto(origin + prefix + 'clippings/?topic=coding'); await ready(page);
        await expect(page.locator('[data-filter-item]')).toHaveCount(26);
        await page.goto(origin + prefix + 'clippings/'); await ready(page);
        const rows = page.locator('[data-filter-item]'), save = rows.first().locator('[data-favorite-toggle]');
        await save.click(); await expect(save).toHaveAttribute('aria-pressed', 'true');
        await page.locator('[data-archive-reading-toggle]').click();
        await expect(rows.first().locator('.archive-reading__body')).toContainText('共享正文 051');
        assert.equal(await checkArchiveExport(page, root, output, `export-${locale}-${width}`, locale), 52);
        await page.goto(origin + prefix + 'clippings/clip-051/');
        await expect(page.locator('h1')).toHaveText('Clipping 051');
        await expect(page.locator('.note-content')).toHaveAttribute('lang', 'zh-CN');
        await expect(page.locator('.note-content')).toContainText('共享正文 051');
        await expect(page.locator('.note-content img')).toHaveCount(2);
        for (const image of await page.locator('.note-content img').all()) await expect(image).toHaveAttribute('src', '/feedgarden/assets/vault/clippings/assets/animated.gif');
        await page.locator('[data-copy-page]:visible').first().click();
        await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('https://sinputer.top/feedgarden/assets/vault/clippings/assets/animated.gif');
        await expect(page.locator('.translation-fallback')).toHaveCount(0);
        await expect(page.locator('[data-page-actions] [data-favorite-toggle]')).toHaveAttribute('aria-pressed', 'true');
        await page.locator('[data-language-switcher] summary').click();
        await page.locator(`[data-language-switcher] a[lang="${other}"]`).click();
        await expect(page.locator('html')).toHaveAttribute('lang', other);
        await expect(page.locator('.note-content')).toContainText('共享正文 051');
        await expect(page.locator('.translation-fallback')).toHaveCount(0);
        await page.screenshot({ path: join(output, `shared-article-${locale}-${width}.png`) });
        await page.goto(origin + prefix + 'favorites/'); await ready(page);
        await expect(page.locator('.blog-ledger__main strong')).toHaveText(['Clipping 051']);
        await page.locator('[data-search-open]:visible').first().click();
        await page.locator('[data-search-input]').fill('Clipping 051');
        await expect(page.locator('[data-search-results]')).toContainText('Clipping 051');
        await page.keyboard.press('Escape');
        await page.goto(origin + prefix + 'clippings/'); await ready(page);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: join(output, `clippings-${locale}-${width}.png`) });
      assert.deepEqual(errors, []);
      assert.ok(imageRequests.every(url => !url.includes('assets.claude.com')));
      evidence.push({ locale, width, fixture, checks: fixture ? 'home, tab, chronological pagination, topic filter, shared body, language switch, search, favorites, full reading, export' : 'tab order, archive or empty state, no fallback, no overflow, hosted images in full reading and Markdown export', scriptErrors: errors, imageRequests });
      await context.close();
    }
    await writeFile(join(output, 'checks.json'), JSON.stringify(evidence, null, 2) + '\n');
  } finally { await browser.close(); await new Promise<void>(done => server.close(() => done())); }
}
