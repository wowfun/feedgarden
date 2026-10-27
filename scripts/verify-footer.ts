import { loadConfig } from '../src/config.js';
import { validationDirectory } from './validation-paths.js';
import assert from 'node:assert/strict';
import { cp, mkdir, readFile, writeFile, mkdtemp, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { load } from 'cheerio';
import { chromium, expect } from '@playwright/test';
import { parse, stringify } from 'yaml';
import { validationTheme } from './validation-theme.js';
import { checkFooterPages } from './footer-check.js';
import { staticServer } from './static-server.js';

const { values } = parseArgs({ options: { config: { type: 'string' }, gem: { type: 'string' }, 'personal-site': { type: 'string' }, port: { type: 'string' }, 'personal-port': { type: 'string' }, help: { type: 'boolean' } } });
if (values.help) {
  console.log('Usage: npm run verify:footer -- [--config FILE] [--gem PATH] [--personal-site PATH] [--port 58002] [--personal-port 58000]\nVerify isolated content copies with the frozen published theme by default, or an explicit local gem. Optional second site enables paired previews. No database or publication access.');
  process.exit(0);
}
function port(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const result = Number(value);
  if (!/^\d+$/.test(value) || !Number.isInteger(result) || result < 1 || result > 65535) throw new Error('Preview ports must be integers from 1 to 65535');
  return result;
}
const definitions = [
  ...(values['personal-site'] ? [{ name: 'personal', path: resolve(values['personal-site']), port: port(values['personal-port'], 58000) }] : []),
  { name: 'feedgarden', path: process.cwd(), port: port(values.port, 58002) },
];
if (new Set(definitions.map(site => site.port)).size !== definitions.length) throw new Error('Preview ports must differ');
const sites = await Promise.all(definitions.map(async site => {
  const config = parse(await readFile(join(site.path, '.github/jekyll-obsidian.yml'), 'utf8'));
  return { ...site, config, baseurl: String(config.baseurl ?? '').replace(/\/$/, ''), contacts: (config.website.contacts ?? []).length };
}));
const base = join(validationDirectory(loadConfig(values.config)), 'footer');
await mkdir(base, { recursive: true });
const root = await mkdtemp(join(base, 'run-')), builder = await validationTheme(root, values.gem);
const builds: Record<string, string> = {}, evidence: unknown[] = [], audits: unknown[] = [];

const browser = await chromium.launch({ headless: true });
try {
  for (const site of sites) {
    const host = join(root, site.name);
    const config = structuredClone(site.config);
    config.url = `http://127.0.0.1:${site.port}`;
    delete config.website.analytics;
    delete config.website.comments;
    await mkdir(join(host, '.github'), { recursive: true });
    await writeFile(join(host, '.github/jekyll-obsidian.yml'), stringify(config, { version: '1.1' }));
    await cp(join(site.path, config.website.source), join(host, config.website.source), { recursive: true });
    // Reuse only read-only imported-document caches, never the source database or live site output.
    const cache = join(site.path, '.jekyll-obsidian-cache/github-markdown');
    if (await stat(cache).then(() => true, () => false)) await cp(cache, join(host, '.jekyll-obsidian-cache/github-markdown'), { recursive: true });
    // Real hosts retain their configured theme and feature contract. Both themes
    // are covered by the upstream footer compiler, integration and browser tests.
    for (const theme of [config.website.theme ?? 'minimal']) {
      console.log(`Building ${site.name}/${theme}: ${host}`);
      await builder.build(host);
      const output = join(root, `${site.name}-${theme}`);
      await cp(join(host, '.jekyll-obsidian-cache/site'), output, { recursive: true });
      builds[`${site.name}-${theme}`] = output;
      const { pages, exemptions } = await checkFooterPages(output, config);
      audits.push({ site: site.name, theme, checkedPages: pages.length, exemptions });
      const articleRoutes: Record<string, string> = {}, archiveRoutes: Record<string, string> = {};
      for (const { file, relative, locale, article } of pages) {
        const $ = load(await readFile(file, 'utf8'));
        const route = site.baseurl + '/' + relative.replace(/index\.html$/, '');
        if (article && !articleRoutes[locale]) articleRoutes[locale] = route;
        const home = site.baseurl + '/' + (locale === (config.lang ?? 'en') ? '' : locale + '/');
        if (route !== home && $('[data-paged-archive]').length && !archiveRoutes[locale]) archiveRoutes[locale] = route;
        // Only the copied preview output maps configured site origins/base paths
        // to local ports. The input configuration and authored files stay intact.
        $('.site-footer a[href]').each((_, node) => {
          const href = $(node).attr('href')!;
          if (!/^https?:\/\//.test(href)) return;
          const url = new URL(href);
          const target = [...sites].sort((a, b) => b.baseurl.length - a.baseurl.length).find(candidate =>
            candidate.config.url && new URL(candidate.config.url).origin === url.origin &&
            (url.pathname === candidate.baseurl || url.pathname.startsWith(candidate.baseurl + '/')));
          if (target) $(node).attr('href', `http://127.0.0.1:${target.port}${url.pathname}${url.search}${url.hash}`);
        });
        await writeFile(file, $.html());
      }
      const casesBefore = evidence.length;
      const server = staticServer(output, site.baseurl);
      await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
      const address = server.address(); assert.ok(address && typeof address !== 'string');
      const origin = `http://127.0.0.1:${address.port}`;
      try {
        for (const width of [1440, 390]) for (const locale of (config.website.i18n?.enabled ? config.website.i18n.locales : undefined) ?? [config.lang ?? 'en']) for (const scheme of ['light', 'dark'] as const) {
          const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme });
          await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
          const page = await context.newPage();
          const prefix = site.baseurl + '/' + (locale === (config.lang ?? 'en') ? '' : locale + '/');
          const routes = [
            { route: prefix, status: 200, kind: 'home' },
            ...(articleRoutes[locale] ? [{ route: articleRoutes[locale]!, status: 200, kind: 'article' }] : []),
            ...(archiveRoutes[locale] ? [{ route: archiveRoutes[locale]!, status: 200, kind: 'archive' }] : []),
            { route: prefix + '__feedgarden_missing_footer_check__/', status: 404, kind: 'not-found' },
          ];
          for (const [index, { route, status, kind }] of routes.entries()) {
            const response = await page.goto(origin + route);
            assert.equal(response?.status(), status, `Unexpected preview status: ${site.name}/${theme} ${route}`);
            await expect(page.locator('html')).toHaveAttribute('lang', locale);
            await expect(page.locator('.site-header')).toHaveCount(1);
            await expect(page.locator('footer.site-footer')).toHaveCount(1);
            if (kind === 'not-found') {
              const errorPage = load(await readFile(join(output, locale === (config.lang ?? 'en') ? '' : locale, '404.html'), 'utf8'));
              await expect(page.locator('h1')).toHaveText(errorPage('h1').text());
            }
            await expect(page.locator('html')).toHaveAttribute('data-color-scheme', scheme);
            if (await page.locator('[data-paged-archive]').count()) {
              await expect(page.locator('[data-archive-page-status]').first()).not.toHaveText('');
              await expect(page.locator('[data-paged-archive]')).not.toHaveAttribute('aria-busy', 'true');
            }
            await expect(page.locator('.site-footer__contacts a')).toHaveCount(site.contacts);
            const footer = page.locator('.site-footer');
            await footer.scrollIntoViewIfNeeded();
            await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${site.name}/${theme} overflow at ${route}`);
            const links = page.locator('.site-footer__main a');
            for (const link of await links.all()) {
              const box = await link.boundingBox(); assert.ok(box && box.height >= 44 && box.width >= 24);
            }
            const sections = await page.locator('.site-footer__section').all();
            if (sections.length === 2) {
              const a = (await sections[0]!.boundingBox())!, b = (await sections[1]!.boundingBox())!;
              if (width === 390) assert.ok(b.y >= a.y + a.height);
              else assert.ok(Math.abs(b.y - a.y) < 2 && b.x > a.x + a.width);
            }
            const toolbar = page.locator('.mobile-toolbar');
            if (await toolbar.isVisible()) {
              const footerBox = (await footer.boundingBox())!, toolbarBox = (await toolbar.boundingBox())!;
              assert.ok(footerBox.y + footerBox.height <= toolbarBox.y + 1, `${site.name}/${theme} ${route} ${width}/${scheme}: footer bottom ${footerBox.y + footerBox.height}, toolbar top ${toolbarBox.y}`);
            }
            await footer.locator('a').first().focus();
            await page.keyboard.press('Tab');
            await page.keyboard.press('Shift+Tab');
            const focused = page.locator('.site-footer a:focus-visible');
            await expect(focused).toHaveCount(1);
            await expect(focused).toHaveCSS('outline-style', 'solid');
            await expect(focused).toHaveCSS('outline-width', '2px');
            if (await page.locator('.translation-fallback').count()) await expect(page.locator('.translation-fallback')).not.toBeVisible({ timeout: 6000 });
            const screenshot = `${site.name}-${theme}-${locale}-${width}-${scheme}-${index}.png`;
            await page.screenshot({ path: join(root, screenshot) });
            evidence.push({ site: site.name, theme, locale, width, scheme, route, status, kind, screenshot, checks: 'explicit localized URLs, unique contacts, responsive columns, 44px touch height, focus, no overflow or toolbar overlap' });
          }
          await context.close();
        }
      } finally { await new Promise<void>(done => server.close(() => done())); }
      console.log(`Verified ${site.name}/${theme}: ${pages.length} rendered footers and ${evidence.length - casesBefore} browser cases`);
    }
  }
} finally { await browser.close(); }
await writeFile(join(root, 'results.json'), JSON.stringify({ theme: builder.identity, builds, audits, evidence }, null, 2) + '\n');
await writeFile(join(base, 'current.json'), JSON.stringify({ root, builds }, null, 2) + '\n');
console.log('Footer validation passed: ' + root);
