import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { load } from 'cheerio';
import { z } from 'zod';

export interface FooterConfig {
  website: {
    contacts?: { label: string; url: string }[];
    footer?: { links?: { label: string; url: string; locale_urls?: Record<string, string> }[] };
  };
}

export function inspectFooter(html: string, file: string, config: FooterConfig) {
  const $ = load(html), footer = $('footer.site-footer');
  const refresh = $('meta[http-equiv]').filter((_, node) => $(node).attr('http-equiv')?.toLowerCase() === 'refresh');
  // Only the theme's bare redirect document is exempt; a themed page with a
  // refresh tag must still have its footer. Raw HTML is allowlisted separately.
  if (!footer.length && !$('body[class], .site-header, .note-header').length &&
      /^0;\s*url=.+/.test(refresh.attr('content') ?? '') && $('meta[name="robots"]').attr('content') === 'noindex' &&
      $('link[rel="canonical"]').length === 1 && $('body > main > p > a[href]').length === 1) return { kind: 'redirect' as const };
  assert.equal(footer.length, 1, 'Expected one theme footer: ' + file);
  const contacts = config.website.contacts ?? [], links = config.website.footer?.links ?? [];
  const locale = $('html').attr('lang');
  assert.ok(locale, 'Missing page language: ' + file);
  assert.equal($('.site-footer__contacts').length, contacts.length ? 1 : 0, file);
  assert.equal(footer.find('.site-footer__contacts a').length, contacts.length, file);
  footer.find('.site-footer__contacts a').each((index, node) => {
    assert.equal($(node).attr('href'), contacts[index]!.url, file);
    assert.equal($(node).attr('aria-label') ?? $(node).text(), contacts[index]!.label, file);
  });
  assert.equal(footer.find('.site-footer__links a').length, links.length, file);
  if (links.length && ['en', 'zh-CN'].includes(locale)) assert.equal(footer.find('#footer-sites-title').text(), locale === 'en' ? 'Sites' : '站点', file);
  footer.find('.site-footer__links a').each((index, node) => {
    const expected = links[index]!, localized = Object.entries(expected.locale_urls ?? {}).find(([key]) => key.toLowerCase() === locale.toLowerCase())?.[1];
    assert.equal($(node).text(), expected.label, file);
    assert.equal($(node).attr('href'), localized ?? expected.url, file);
    assert.equal($(node).attr('target'), undefined, file);
  });
  assert.equal(footer.find('.site-footer__github').length, 1, file);
  assert.equal(footer.find('.site-footer__github').attr('href'), 'https://github.com/wowfun/jekyll-obsidian', file);
  assert.equal($('[class*="minimal-contact"]').length, 0, file);
  return { kind: 'page' as const, locale, article: $('.note-header').length > 0 };
}

const rawManifest = z.object({ schema_version: z.literal(1), files: z.array(z.string()), documents: z.array(z.object({ route: z.string(), output: z.string() }).strict()) }).strict();

export async function checkFooterPages(output: string, config: FooterConfig) {
  const manifest = await readFile(join(output, 'assets/website/raw-html.v1.json'), 'utf8').catch(error => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  const raw = new Set<string>();
  if (manifest !== undefined) {
    const parsed = rawManifest.parse(JSON.parse(manifest));
    for (const { output: path } of parsed.documents) {
      assert.ok(path.startsWith('/') && path.endsWith('.html') && !path.includes('\\') && path.slice(1).split('/').every(part => part && part !== '.' && part !== '..') && parsed.files.includes(path), 'Invalid raw HTML output: ' + path);
      raw.add(path.slice(1));
    }
  }
  const pages: { file: string; relative: string; locale: string; article: boolean }[] = [];
  const exemptions: { path: string; reason: 'raw-html' | 'redirect' }[] = [];
  async function walk(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.name.endsWith('.html')) {
        const path = relative(output, file).split(sep).join('/');
        if (raw.has(path)) { exemptions.push({ path, reason: 'raw-html' }); continue; }
        const result = inspectFooter(await readFile(file, 'utf8'), file, config);
        if (result.kind === 'redirect') exemptions.push({ path, reason: 'redirect' });
        else pages.push({ file, relative: path, locale: result.locale, article: result.article });
      }
    }
  }
  await walk(output);
  assert.ok(pages.length, 'No generated theme pages found: ' + output);
  return { pages, exemptions };
}
