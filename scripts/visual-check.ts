import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, join, sep } from 'node:path';
import { chromium, expect, type Page } from '@playwright/test';
import { z } from 'zod';
import { validationDirectory } from './validation-paths.js';
import { checkArchiveExport } from './archive-export-check.js';
const root=resolve(process.env.FEEDGARDEN_VISUAL_ROOT??'.jekyll-obsidian-cache/site'),output=join(validationDirectory, 'visual');
const fixture=process.env.FEEDGARDEN_VISUAL_FIXTURE==='1';const artifactPrefix=fixture?'fixture-':'production-';await mkdir(output,{recursive:true});
const daySelector='[data-filter-list] > section > details[data-ledger-day]';
const ledgerMessageSchema=z.object({
 ledger_date:z.string().min(1),ledger_date_year:z.string().min(1),ledger_months:z.string().min(1),
 ledger_entry:z.string().min(1),ledger_entries:z.string().min(1),undated:z.string().min(1)
});
const loadLedgerMessages=async(locale:'en'|'zh-CN')=>ledgerMessageSchema.parse(JSON.parse(await readFile(new URL('../config/locales/'+locale+'.json',import.meta.url),'utf8')).messages);
const [english,chinese]=await Promise.all([loadLedgerMessages('en'),loadLedgerMessages('zh-CN')]);
const ledgerMessages={en:english,'zh-CN':chinese};
async function checkDayGroups(page:Page,locale:keyof typeof ledgerMessages){
 const messages=ledgerMessages[locale],currentYear=await page.locator('[data-ledger-current-year]').getAttribute('data-ledger-current-year');assert.match(currentYear??'',/^\d{4}$/);
 const days=page.locator(daySelector);assert.ok(await days.count()>0);await expect(page.locator(daySelector+'[open]')).toHaveCount(1);
 for(const day of await days.all()){
  const key=await day.getAttribute('data-ledger-day'),entries=await day.locator('[data-filter-item]').count();assert.ok(key);
  if(key!=='Undated'){
   assert.match(key,/^\d{4}-\d{2}-\d{2}$/);const date=new Date(key+'T00:00:00Z'),year=key.slice(0,4),month=messages.ledger_months.split('|')[date.getUTCMonth()];assert.ok(month);assert.equal(date.toISOString().slice(0,10),key);
   const dateFormat=year===currentYear?messages.ledger_date:messages.ledger_date_year;
   const label=dateFormat.replaceAll('{year}',year).replaceAll('{day}',String(date.getUTCDate())).replaceAll('{month}',()=>month);
   await expect(day.locator('summary time')).toHaveAttribute('datetime',key);await expect(day.locator('summary time')).toHaveText(label);
   await expect(day.locator('summary')).toContainText(new Intl.DateTimeFormat(locale,{weekday:'long',timeZone:'UTC'}).format(date));
  }else await expect(day.locator('summary h2')).toHaveText(messages.undated);
  const format=messages[entries===1?'ledger_entry':'ledger_entries'];
  await expect(day.locator('[data-ledger-day-count]')).toHaveText(format.replaceAll('{count}',String(entries)));
 }
 return days;
}
const mime:Record<string,string>={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(request,response)=>{try{const url=new URL(request.url!,'http://localhost');if(!url.pathname.startsWith('/feedgarden/')){response.writeHead(404).end();return;}let path=resolve(root,'.'+decodeURIComponent(url.pathname.slice('/feedgarden'.length)));if(!path.startsWith(root+sep)&&path!==root)throw new Error('Invalid path');if((await stat(path)).isDirectory())path=join(path,'index.html');response.setHeader('Content-Type',mime[extname(path)]??'application/octet-stream');response.end(await readFile(path));}catch{response.writeHead(404).end();}});
await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));const address=server.address();assert.ok(address&&typeof address!=='string');
const origin='http://127.0.0.1:'+address.port,browser=await chromium.launch({headless:true});const checks:unknown[]=[];
const ready=async(page:Page)=>{await page.waitForFunction(()=>{const root=document.querySelector('[data-paged-archive]');return root&&!root.hasAttribute('aria-busy')&&document.querySelector('[data-archive-page-status]')?.textContent&&document.querySelector('[data-archive-status]')?.textContent==='';});};
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}])for(const locale of ['en','zh-CN'] as const){
  const size=viewport.width>600?'desktop':'mobile',context=await browser.newContext({viewport}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const prefix='/feedgarden/'+(locale==='en'?'':locale+'/');assert.equal((await page.goto(origin+prefix))?.status(),200);await ready(page);
  assert.equal(await page.locator('html').getAttribute('lang'),locale);assert.equal(await page.locator('h1').count(),1);
  const repository=page.locator('.site-header .site-action--github');assert.equal(await repository.getAttribute('href'),'https://github.com/wowfun/feedgarden');assert.equal(await repository.locator('svg').count(),1);assert.equal(await repository.getAttribute('aria-label'),locale==='en'?'Open Feedgarden on GitHub':'在 GitHub 上打开 Feedgarden');await repository.click({trial:true});
  for(const action of await page.locator('.site-header .site-actions button, .site-header .site-actions summary').all()){if(await action.isVisible()){assert.ok(await action.getAttribute('aria-label'));assert.ok(await action.getAttribute('title'));assert.ok(await action.locator('svg').count());}}
  const rows=page.locator('[data-filter-item]'),count=await rows.count();assert.ok(count<=50);if(fixture)assert.equal(count,50);
  const pager=page.locator('[data-archive-pagination]'),pages=Number(await pager.locator('input').getAttribute('max'));
  if(pages>1){assert.equal(await pager.locator('[data-archive-page-numbers] a').count(),Math.min(5,pages));await pager.locator('a[data-archive-page="2"]').click();await ready(page);assert.match(page.url(),/page=2/);await pager.locator('input').fill('1');await pager.locator('input').press('Enter');await ready(page);assert.equal(new URL(page.url()).searchParams.has('page'),false);await pager.scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:join(output,artifactPrefix+'pagination-'+locale+'-'+size+'.png')});await page.evaluate(()=>window.scrollTo(0,0));}
  if(count){
   assert.ok(await page.locator('.blog-ledger__description').count()>0);assert.equal(await page.locator('.blog-ledger__meta').count(),0);
   await checkDayGroups(page,locale);
   assert.equal(await rows.locator('[data-favorite-toggle]').count(),count);
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(count){
   const footer=rows.first().locator('.archive-card-footer'),external=footer.locator('.archive-source-url');assert.equal(await external.count(),1);const href=await external.getAttribute('href');assert.ok(href?.startsWith('https://'));assert.equal(await external.textContent(),href);await external.click({trial:true});assert.ok(await footer.locator('[data-archive-facet="source"]').count());assert.ok(await footer.locator('[data-archive-facet="topic"]').count());
   await page.screenshot({path:join(output,artifactPrefix+'feed-'+locale+'-'+size+'.png')});
   const reading=page.getByRole('switch',{name:locale==='en'?'Read in full':'平铺阅读'});await reading.click();
   await rows.first().scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.querySelector<HTMLElement>('[data-filter-item]')?.dataset.readingLoaded==='true');
   assert.equal(await reading.getAttribute('aria-checked'),'true');if(count>=20)assert.ok(await page.locator('[data-reading-loaded]').count()<count);
   if(fixture)assert.ok(await rows.first().locator('.archive-reading__body > p').count()>=2);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:join(output,artifactPrefix+'reading-'+locale+'-'+size+'.png')});
   const lastDay=page.locator(daySelector).last();if(!await lastDay.evaluate((day)=> (day as HTMLDetailsElement).open))await lastDay.locator('summary').click();
   await rows.last().scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.querySelectorAll<HTMLElement>('[data-filter-item]')].at(-1)?.dataset.readingLoaded==='true');
   await reading.click();assert.equal(await rows.first().locator('.archive-reading__body').isVisible(),false);
   const exported=await checkArchiveExport(page,root,output,artifactPrefix+'export-'+locale+'-'+size,locale);checks.push({locale,size,exported,exportContent:'all published bodies present in archive order'});
   const detail=await rows.first().locator('.blog-ledger__main').getAttribute('href');assert.ok(detail);await page.goto(new URL(detail,origin).href);assert.equal(await page.locator('h1').count(),1);const markdown=await page.locator('[data-markdown-url]').getAttribute('data-markdown-url');assert.ok(markdown);assert.equal((await page.request.get(origin+markdown)).status(),200);assert.equal(await page.locator('.note-source-url a').count(),1);assert.ok(await page.locator('[data-note-tags] [data-note-facet="source"]').count());assert.ok(await page.locator('[data-note-tags] [data-note-facet="topic"]').count());
   assert.ok(await page.evaluate(()=>{const tags=document.querySelector('[data-note-tags]')!,source=document.querySelector('.note-source-url')!,body=document.querySelector('.note-content')!;return !!(tags.compareDocumentPosition(source)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(source.compareDocumentPosition(body)&Node.DOCUMENT_POSITION_FOLLOWING)&&tags.getBoundingClientRect().bottom<=source.getBoundingClientRect().top&&source.getBoundingClientRect().bottom<=body.getBoundingClientRect().top;}));
   if(size==='desktop')assert.ok((await page.locator('.note-content').boundingBox())!.width>=880);
   if(fixture){assert.ok(await page.locator('.note-content > p').count()>=2);assert.equal(await page.locator('.note-content img[src="https://example.invalid/fixture-diagram.svg"]').count(),1);assert.equal(await page.locator('.note-content video source[src="https://example.invalid/fixture-video.mp4"]').count(),1);assert.ok(await page.locator('.note-content a[href="https://example.invalid/fixture-diagram.svg"]').count());assert.ok(await page.locator('.note-content a[href="https://example.invalid/fixture-video.mp4"]').count());}
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:join(output,artifactPrefix+'item-'+locale+'-'+size+'.png')});
   const favorite=page.locator('[data-page-actions] [data-favorite-toggle]');await favorite.click();await expect(favorite).toHaveAttribute('aria-pressed','true');
   await page.goto(origin+prefix+'favorites/');await ready(page);assert.equal(await page.locator('[data-filter-item]').count(),1);await checkDayGroups(page,locale);assert.equal(await page.locator('[data-archive-export-open]').count(),0);assert.equal(await page.locator('[data-favorite-toggle]').getAttribute('aria-pressed'),'true');
   await page.getByRole('switch',{name:locale==='en'?'Read in full':'平铺阅读'}).click();await page.waitForFunction(()=>document.querySelector<HTMLElement>('[data-filter-item]')?.dataset.readingLoaded==='true');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:join(output,artifactPrefix+'favorites-'+locale+'-'+size+'.png')});
   await page.getByRole('switch',{name:locale==='en'?'Read in full':'平铺阅读'}).click();await page.locator('[data-favorite-toggle]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-filter-item]').length===0);checks.push({locale,size,favorites:'article save, persistence, scoped list, reading, removal passed'});
   await page.goto(origin+prefix);await ready(page);
  }else await page.screenshot({path:join(output,artifactPrefix+'empty-'+locale+'-'+size+'.png')});
  assert.equal((await page.request.get(origin+prefix+'openai/2026/2026-09-28/')).status(),404);
  assert.equal((await page.request.get(origin+prefix+'feed.xml')).status(),count?200:404);
  if(fixture){
   await page.locator('[data-archive-page="next"]').click();await ready(page);assert.equal(await rows.count(),50);assert.match(page.url(),/page=2/);await checkDayGroups(page,locale);await page.locator('[data-archive-page="next"]').click();await ready(page);assert.equal(await rows.count(),1);await checkDayGroups(page,locale);await expect(page.locator(daySelector)).toHaveAttribute('data-ledger-day','2025-08-01');
   await page.goto(origin+prefix+'?source=openai&topic=coding&page=999');await ready(page);assert.equal(await rows.count(),1);assert.match(page.url(),/page=2/);
   await page.locator('button[data-archive-facet="topic"][data-archive-value="models"]').click();await ready(page);assert.equal(await rows.count(),50);assert.ok(!page.url().includes('page='));
   await page.locator('button[data-archive-facet="topic"][data-archive-value="coding"]').click();await ready(page);assert.equal(await rows.count(),0);assert.equal(await page.locator('[data-archive-empty]').isVisible(),true);
   await page.locator('[data-archive-clear]').click();await ready(page);assert.equal(await rows.count(),50);
   await page.locator('button[data-archive-facet="source"][data-archive-value="openai"]').click();await ready(page);assert.match(await page.locator('[data-archive-page-status]').textContent()??'',/51/);
   await page.locator('button[data-archive-facet="source"][data-archive-value="hackernews"]').click();await ready(page);assert.match(await page.locator('[data-archive-page-status]').textContent()??'',/101/);
   await page.goBack();await ready(page);assert.match(await page.locator('[data-archive-page-status]').textContent()??'',/51/);await page.goForward();await ready(page);assert.match(await page.locator('[data-archive-page-status]').textContent()??'',/101/);
   if(size==='mobile'){await page.locator('[data-dialog-open="context"]:visible').click();}
   const day=page.locator('[data-day-filter-option][data-filter-day="2026-09-30"]:visible').first();await day.click();await ready(page);assert.equal(await rows.count(),1);if(size==='mobile')await page.keyboard.press('Escape');
   await page.locator('[data-language-switcher] summary').click();const other=locale==='en'?'zh-CN':'en';await page.locator('[data-language-switcher] a[lang="'+other+'"]').click();await ready(page);assert.equal(await page.locator('html').getAttribute('lang'),other);assert.match(page.url(),/day=2026-09-30/);assert.equal(await rows.count(),1);
   await page.goto(origin+prefix+'?source=missing&source=missing&page=invalid');await ready(page);assert.equal(await rows.count(),0);assert.ok(page.url().endsWith('?source=missing'));await page.locator('[data-archive-clear]').click();await ready(page);assert.equal(await rows.count(),50);
   await page.screenshot({path:join(output,artifactPrefix+'filters-'+locale+'-'+size+'.png')});
  }
  const collections=await page.locator('.site-header [data-navigation-id="podcasts"] > a, .site-header [data-navigation-id="github"] > a').evaluateAll(links=>links.map(link=>({id:link.parentElement!.getAttribute('data-navigation-id')!,href:link.getAttribute('href')!})));
  for(const collection of collections){
   const url=new URL(collection.href,origin);assert.equal(url.origin,origin);assert.equal((await page.goto(url.href))?.status(),200);await ready(page);
   assert.ok((await page.locator('[data-paged-archive]').getAttribute('data-archive-current-url'))?.includes('/tabs/'+collection.id+'/'));
   const collectionRows=page.locator('[data-filter-item]'),entries=await collectionRows.count();assert.ok(entries<=50);
   if(entries){
    const days=await checkDayGroups(page,locale),first=days.first();
    await expect(first).toHaveAttribute('open','');await first.locator('summary').click();await expect(first).not.toHaveAttribute('open');await expect(first.locator('[data-filter-item]').first()).toBeHidden();
    await first.locator('summary').press('Enter');await expect(first).toHaveAttribute('open','');await expect(first.locator('[data-filter-item]').first()).toBeVisible();
    if(await days.count()>1){const last=days.last();await last.locator('summary').click();await expect(first).toHaveAttribute('open','');await expect(last).toHaveAttribute('open','');await last.locator('summary').click();}
   }else{await expect(page.locator('[data-archive-empty]')).toBeVisible();await expect(page.locator(daySelector)).toHaveCount(0);}
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:join(output,artifactPrefix+'collection-'+collection.id+'-'+locale+'-'+size+'.png')});
   checks.push({locale,size,collection:collection.id,rows:entries,days:await page.locator(daySelector).count(),folding:entries?'default state, count, collapse and keyboard reopen passed':'empty'});
  }
  assert.deepEqual(errors,[]);checks.push({locale,size,root,rows:count,pagination:fixture?'passed':'bounded',footer:'source/topics/full clickable source_url',languageSwitch:fixture?'query preserved':'rendered',overflow:'none',scriptErrors:errors});await context.close();
 }
 if(fixture){
  const context=await browser.newContext(),page=await context.newPage();await page.goto(origin+'/feedgarden/');await ready(page);const previous=await page.locator('[data-filter-item]').first().textContent();await page.route('**/cards-1.json',route=>route.abort());await page.locator('[data-archive-page="next"]').click();await page.locator('[data-archive-retry]').waitFor({state:'visible'});assert.equal(await page.locator('[data-filter-item]').first().textContent(),previous);await page.unroute('**/cards-1.json');await page.locator('[data-archive-retry]').click();await ready(page);assert.match(page.url(),/page=2/);checks.push({loadingFailure:'last successful page retained',retry:'passed'});await context.close();
 }
 await writeFile(join(output,fixture?'fixture-checks.json':'checks.json'),JSON.stringify(checks,null,2));console.log(JSON.stringify(checks,null,2));
}finally{await browser.close();await new Promise<void>(done=>server.close(()=>done()));}
