import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Page } from '@playwright/test';

// Check the downloaded file against the already-built publication, without
// regenerating content from the local database or requesting external sources.
export async function checkArchiveExport(page: Page, root: string, output: string, artifact: string, locale: string): Promise<number> {
  const initialUrl = page.url();
  const manifestUrl = await page.locator('[data-paged-archive]').getAttribute('data-archive-url');
  assert.ok(manifestUrl);
  const manifest = await (await page.request.get(new URL(manifestUrl, initialUrl).href)).json();
  assert.equal(manifest.export_max_days, 7);
  await page.locator('[data-archive-export-open]').click();
  const panel = page.locator('[data-dialog="export"]');
  await panel.locator('[data-export-download]').waitFor({state: 'visible'});
  await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>('[data-export-download]')!.disabled);
  const start = await panel.locator('[data-export-start]').inputValue(), end = await panel.locator('[data-export-end]').inputValue();
  assert.equal((Date.parse(end) - Date.parse(start)) / 86400000, 6);
  assert.equal(await panel.locator('[data-export-limit]').textContent(), locale === 'en' ? 'Up to 7 days, including both dates.' : '最多 7 天，包含起止两天。');
  assert.ok(await panel.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
  const button = (await panel.locator('[data-export-download]').boundingBox())!;
  assert.ok(button.y + button.height <= page.viewportSize()!.height, 'Download stays visible while filters scroll');
  await page.screenshot({path: join(output, artifact + '.png')});
  const downloadEvent = page.waitForEvent('download');
  await panel.locator('[data-export-download]').click();
  const download = await downloadEvent;
  assert.equal(download.suggestedFilename(), `feedgarden-${locale}-${start}_${end}.md`);
  const path = join(output, artifact + '.md'); await download.saveAs(path);
  const markdown = await readFile(path, 'utf8');
  const cards: {id: string; display_date: string | null; markdown_url: string}[] = [];
  for (const chunk of manifest.chunks) {
    const resource = new URL(chunk, new URL(manifestUrl, initialUrl));
    cards.push(...(await (await page.request.get(resource.href)).json()).cards);
  }
  const selected = cards.filter(card => card.display_date && card.display_date >= start && card.display_date <= end);
  assert.equal(new Set(selected.map(card => card.id)).size, selected.length);
  assert.equal((markdown.match(/^(?:Article|站内文章): </gm) || []).length, selected.length);
  let offset = 0;
  for (const card of selected) {
    const pathname = decodeURIComponent(new URL(card.markdown_url, initialUrl).pathname);
    assert.ok(pathname.startsWith('/feedgarden/'));
    const published = (await readFile(resolve(root, '.' + pathname.slice('/feedgarden'.length)), 'utf8')).replace(/\r\n?/g, '\n').trimEnd();
    const position = markdown.indexOf(published, offset);
    assert.ok(position >= offset, `Full published Markdown missing or out of order: ${card.id}`);
    offset = position + published.length;
  }
  await panel.locator('[data-dialog-close]').click();
  assert.equal(page.url(), initialUrl);
  return selected.length;
}
