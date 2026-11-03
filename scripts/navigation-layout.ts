import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';

export type NavigationLayout = 'top' | 'sidebar';
const browseDialog = 'dialog[data-dialog="browse"]';

export function parseNavigationLayout(value?: string): NavigationLayout | undefined {
  if (value === undefined) return undefined;
  if (value !== 'top' && value !== 'sidebar') throw new Error('--navigation-layout must be top or sidebar, got ' + JSON.stringify(value));
  return value;
}

export function previewNavigationConfig<T extends { website: { navigation?: Record<string, unknown> } }>(config: T, layout?: NavigationLayout): T {
  const copy = structuredClone(config);
  if (layout !== undefined) copy.website.navigation = { ...copy.website.navigation, layout };
  return copy;
}

export function verifyNavigationLayout(value: string | null, expected: NavigationLayout): NavigationLayout {
  const rendered = value;
  assert.ok(rendered === 'top' || rendered === 'sidebar', 'Unknown rendered navigation layout: ' + JSON.stringify(rendered));
  assert.equal(rendered, expected, 'Rendered navigation layout does not match configuration');
  return rendered;
}

export async function openSiteControls(page: Page): Promise<void> {
  // Match the upstream sidebar.css drawer breakpoint; desktop keeps its trigger hidden.
  if (!await page.evaluate(() => document.body.dataset.navigationLayout === 'sidebar' && matchMedia('(max-width: 1080px)').matches)) return;
  const menu = page.locator('.site-topbar [data-dialog-open="browse"]');
  const drawer = page.locator(browseDialog);
  await menu.waitFor({ state: 'visible' });
  if (!await drawer.isVisible()) await menu.click();
  await drawer.waitFor({ state: 'visible' });
}

export async function closeSiteControls(page: Page): Promise<void> {
  const drawer = page.locator(browseDialog);
  if (await drawer.isVisible()) {
    await drawer.locator('[data-dialog-close]').click();
    await drawer.waitFor({ state: 'hidden' });
  }
}
