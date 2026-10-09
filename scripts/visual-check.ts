import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, join, sep } from 'node:path';
import { chromium, type Page } from '@playwright/test';
const root=resolve(process.env.FEEDGARDEN_VISUAL_ROOT??'.jekyll-obsidian-cache/site'),output=resolve('.local/notes/1009/visual');
const fixture=process.env.FEEDGARDEN_VISUAL_FIXTURE==='1';const artifactPrefix=fixture?'fixture-':'production-';await mkdir(output,{recursive:true});
const mime:Record<string,string>={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(request,response)=>{try{const url=new URL(request.url!,'http://localhost');if(!url.pathname.startsWith('/feedgarden/')){response.writeHead(404).end();return;}let path=resolve(root,'.'+decodeURIComponent(url.pathname.slice('/feedgarden'.length)));if(!path.startsWith(root+sep)&&path!==root)throw new Error('Invalid path');if((await stat(path)).isDirectory())path=join(path,'index.html');response.setHeader('Content-Type',mime[extname(path)]??'application/octet-stream');response.end(await readFile(path));}catch{response.writeHead(404).end();}});
await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));const address=server.address();assert.ok(address&&typeof address!=='string');
const origin='http://127.0.0.1:'+address.port,browser=await chromium.launch({headless:true});const checks:unknown[]=[];
const ready=async(page:Page)=>{await page.waitForFunction(()=>{const root=document.querySelector('[data-paged-archive]');return root&&!root.hasAttribute('aria-busy')&&document.querySelector('[data-archive-page-status]')?.textContent&&document.querySelector('[data-archive-status]')?.textContent==='';});};
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}])for(const locale of ['en','zh-CN']){
  const size=viewport.width>600?'desktop':'mobile',context=await browser.newContext({viewport}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const prefix='/feedgarden/'+(locale==='en'?'':locale+'/');assert.equal((await page.goto(origin+prefix))?.status(),200);await ready(page);
  assert.equal(await page.locator('html').getAttribute('lang'),locale);assert.equal(await page.locator('h1').count(),1);
  const rows=page.locator('[data-filter-item]'),count=await rows.count();assert.ok(count<=50);if(fixture)assert.equal(count,50);
  assert.equal(await page.locator('.blog-ledger__description').count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(count){
   const footer=rows.first().locator('.archive-card-footer'),external=footer.locator('.archive-source-url');assert.equal(await external.count(),1);const href=await external.getAttribute('href');assert.ok(href?.startsWith('https://'));assert.equal(await external.textContent(),href);await external.click({trial:true});assert.ok(await footer.locator('[data-archive-facet="source"]').count());assert.ok(await footer.locator('[data-archive-facet="topic"]').count());
   await page.screenshot({path:join(output,artifactPrefix+'feed-'+locale+'-'+size+'.png')});
   const detail=await rows.first().locator('.blog-ledger__main').getAttribute('href');assert.ok(detail);await page.goto(new URL(detail,origin).href);assert.equal(await page.locator('h1').count(),1);const markdown=await page.locator('[data-markdown-url]').getAttribute('data-markdown-url');assert.ok(markdown);assert.equal((await page.request.get(origin+markdown)).status(),200);assert.ok(await page.locator('.archive-source-url a').count());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:join(output,artifactPrefix+'item-'+locale+'-'+size+'.png')});await page.goto(origin+prefix);await ready(page);
  }else await page.screenshot({path:join(output,artifactPrefix+'empty-'+locale+'-'+size+'.png')});
  assert.equal((await page.request.get(origin+prefix+'openai/2026/2026-09-28/')).status(),404);
  assert.equal((await page.request.get(origin+prefix+'feed.xml')).status(),count?200:404);
  if(fixture){
   await page.locator('[data-archive-page="next"]').click();await ready(page);assert.equal(await rows.count(),50);assert.match(page.url(),/page=2/);await page.locator('[data-archive-page="next"]').click();await ready(page);assert.equal(await rows.count(),1);
   await page.goto(origin+prefix+'?source=openai&topic=coding&page=999');await ready(page);assert.equal(await rows.count(),1);assert.match(page.url(),/page=2/);
   await page.locator('button[data-archive-facet="topic"][data-archive-value="models"]').click();await ready(page);assert.equal(await rows.count(),50);assert.ok(!page.url().includes('page='));
   await page.locator('button[data-archive-facet="topic"][data-archive-value="coding"]').click();await ready(page);assert.equal(await rows.count(),0);assert.equal(await page.locator('[data-archive-empty]').isVisible(),true);
   await page.locator('[data-archive-clear]').click();await ready(page);assert.equal(await rows.count(),50);
   await page.locator('button[data-archive-facet="source"][data-archive-value="openai"]').click();await ready(page);assert.match(await page.locator('[data-archive-page-status]').textContent()??'',/51/);
   await page.locator('button[data-archive-facet="source"][data-archive-value="hackernews"]').click();await ready(page);assert.match(await page.locator('[data-archive-page-status]').textContent()??'',/101/);
   await page.goBack();await ready(page);assert.match(await page.locator('[data-archive-page-status]').textContent()??'',/51/);await page.goForward();await ready(page);assert.match(await page.locator('[data-archive-page-status]').textContent()??'',/101/);
   if(size==='mobile'){await page.locator('[data-dialog-open="context"]:visible').click();}
   const month=page.locator('[data-month-filter-option][data-filter-month="2026-09"]:visible').first();await month.click();await ready(page);assert.equal(await rows.count(),30);if(size==='mobile')await page.keyboard.press('Escape');
   await page.locator('[data-language-switcher] summary').click();const other=locale==='en'?'zh-CN':'en';await page.locator('[data-language-switcher] a[lang="'+other+'"]').click();await ready(page);assert.equal(await page.locator('html').getAttribute('lang'),other);assert.match(page.url(),/month=2026-09/);assert.equal(await rows.count(),30);
   await page.goto(origin+prefix+'?source=missing&source=missing&page=invalid');await ready(page);assert.equal(await rows.count(),0);assert.ok(page.url().endsWith('?source=missing'));await page.locator('[data-archive-clear]').click();await ready(page);assert.equal(await rows.count(),50);
   await page.screenshot({path:join(output,artifactPrefix+'filters-'+locale+'-'+size+'.png')});
  }
  assert.deepEqual(errors,[]);checks.push({locale,size,root,rows:count,pagination:fixture?'passed':'bounded',footer:'source/topics/full clickable source_url',languageSwitch:fixture?'query preserved':'rendered',overflow:'none',scriptErrors:errors});await context.close();
 }
 if(fixture){
  const context=await browser.newContext(),page=await context.newPage();await page.goto(origin+'/feedgarden/');await ready(page);const previous=await page.locator('[data-filter-item]').first().textContent();await page.route('**/cards-1.json',route=>route.abort());await page.locator('[data-archive-page="next"]').click();await page.locator('[data-archive-retry]').waitFor({state:'visible'});assert.equal(await page.locator('[data-filter-item]').first().textContent(),previous);await page.unroute('**/cards-1.json');await page.locator('[data-archive-retry]').click();await ready(page);assert.match(page.url(),/page=2/);checks.push({loadingFailure:'last successful page retained',retry:'passed'});await context.close();
 }
 await writeFile(join(output,fixture?'fixture-checks.json':'checks.json'),JSON.stringify(checks,null,2));console.log(JSON.stringify(checks,null,2));
}finally{await browser.close();await new Promise<void>(done=>server.close(()=>done()));}
