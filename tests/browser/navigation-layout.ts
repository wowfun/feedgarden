import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from '@playwright/test';
import { closeSiteControls,openSiteControls } from '../../scripts/navigation-layout.js';

test('site controls wait for the mobile trigger and close the same dialog', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(1000);
    await page.setContent(`<body data-navigation-layout="sidebar">
      <header class="site-topbar"><button hidden data-dialog-open="browse" onclick="document.querySelector('dialog').showModal()">Browse</button></header>
      <dialog data-dialog="browse"><button data-dialog-close onclick="this.closest('dialog').close()">Close</button></dialog></body>`);
    await page.evaluate(() => setTimeout(() => document.querySelector<HTMLButtonElement>('[data-dialog-open]')!.hidden = false, 200));
    await openSiteControls(page);
    assert.equal(await page.locator('dialog').isVisible(), true);
    await openSiteControls(page);
    await closeSiteControls(page);
    assert.equal(await page.locator('dialog').isVisible(), false);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('[data-dialog-open]').evaluate(node => node.setAttribute('hidden', ''));
    await openSiteControls(page);
    assert.equal(await page.locator('dialog').isVisible(), false);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.setContent('<body data-navigation-layout="top"><header class="site-header">Top layout</header></body>');
    await openSiteControls(page);
    await closeSiteControls(page);
    await page.locator('body').evaluate(node => node.dataset.navigationLayout = 'sidebar');
    await assert.rejects(openSiteControls(page), /data-dialog-open/);
  } finally { await browser.close(); }
});
