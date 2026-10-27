import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectFooter, checkFooterPages } from '../scripts/footer-check.js';

const config = { website: { contacts: [{ label: 'Contact', url: 'https://example.com/contact' }], footer: { links: [{ label: 'Garden', url: 'https://example.com/', locale_urls: { 'zh-cn': 'https://example.com/zh/' } }] } } };
const footer = '<footer data-extra="true" class="extra site-footer"><ul class="site-footer__contacts"><li><a href="https://example.com/contact">Contact</a></li></ul><h2 id="footer-sites-title">Sites</h2><ul class="site-footer__links"><li><a href="https://example.com/">Garden</a></li></ul><a class="site-footer__github" href="https://github.com/wowfun/jekyll-obsidian">GitHub</a></footer>';
const page = '<html lang="en"><body class="theme-minimal"><main class="note-header">Note</main>' + footer + '</body></html>';
const redirect = '<html><head><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=/target/"><link rel="canonical" href="/target/"></head><body><main><p><a href="/target/">Target</a></p></main></body></html>';

test('footer audit accepts extra attributes/classes and derives contacts and localized links from configuration', () => {
  assert.deepEqual(inspectFooter(page, 'article/index.html', config), { kind: 'page', locale: 'en', article: true });
  const chinese = page.replace('lang="en"', 'lang="zh-CN"').replace('>Sites<', '>站点<').replace('href="https://example.com/"', 'href="https://example.com/zh/"');
  assert.equal(inspectFooter(chinese, 'zh-CN/article/index.html', config).kind, 'page');
  assert.throws(() => inspectFooter(page, 'article/index.html', { website: { ...config.website, contacts: [] } }));
  assert.throws(() => inspectFooter(page.replace(footer, ''), 'article/index.html', config), /Expected one theme footer/);
  assert.throws(() => inspectFooter(page.replace(footer, footer + footer), 'article/index.html', config), /Expected one theme footer/);
  assert.equal(inspectFooter(redirect, 'redirect.html', config).kind, 'redirect');
  assert.throws(() => inspectFooter(redirect.replace('<body>', '<body class="theme-minimal">'), 'broken-article.html', config), /Expected one theme footer/);
});

test('footer audit checks every generated page and exempts only declared raw HTML and bare redirects', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-footer-audit-'));
  try {
    await mkdir(join(root, 'article')); await mkdir(join(root, 'assets/website'), { recursive: true });
    await writeFile(join(root, 'index.html'), page); await writeFile(join(root, 'article/index.html'), page.replace(footer, ''));
    await assert.rejects(checkFooterPages(root, config), /Expected one theme footer: .*article/);
    await writeFile(join(root, 'article/index.html'), page);
    await writeFile(join(root, 'raw.html'), '<h1>Authored HTML</h1>'); await writeFile(join(root, 'redirect.html'), redirect);
    await assert.rejects(checkFooterPages(root, config), /Expected one theme footer: .*raw.html/);
    await writeFile(join(root, 'assets/website/raw-html.v1.json'), JSON.stringify({ schema_version: 1, documents: [{ route: '/raw.html', output: '/raw.html' }], files: ['/raw.html'] }));
    const result = await checkFooterPages(root, config);
    assert.equal(result.pages.length, 2);
    assert.deepEqual(result.exemptions.sort((a, b) => a.path.localeCompare(b.path)), [{ path: 'raw.html', reason: 'raw-html' }, { path: 'redirect.html', reason: 'redirect' }]);
  } finally { await rm(root, { recursive: true, force: true }); }
});
