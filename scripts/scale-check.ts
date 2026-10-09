import assert from 'node:assert/strict';
import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { DateTime } from 'luxon';
import { configSchema } from '../src/config.js';
import { Store } from '../src/store.js';
import { summarize, type Generator } from '../src/items.js';
import { writeSite } from '../src/site.js';
import { buildSite } from '../src/build-site.js';
import type { Item } from '../src/types.js';
const root = resolve('.local/notes/1009/fixture'), started = Date.now();
await rm(root, {recursive:true,force:true}); await mkdir(join(root,'.github'),{recursive:true});
await cp('.github/jekyll-obsidian.yml',join(root,'.github/jekyll-obsidian.yml'));
await cp('.github/theme.lock.json',join(root,'.github/theme.lock.json'));
await cp('config/topics.json',join(root,'topics.json'));
const config = configSchema.parse({version:2,storage:{directory:join(root,'.local'),database:join(root,'.local/data.sqlite')},feed:{directory:join(root,'content'),topics:join(root,'topics.json')},agent:{model:'deepseek/deepseek-flash',maxDailyCalls:80,runtimeDirectory:join(root,'tasks')},sources:['openai','hackernews'].map(id=>({id,name:id==='openai'?'OpenAI':'Hacker News',intervalHours:1,streams:[{id:'main',channels:[{id:'rss',kind:'feed',url:'https://example.invalid/rss'}]}]}))});
const generator: Generator = async (_agent,input,_repair,directory) => ({directory:directory!,events:[],usage:[],output:{contractVersion:2,newTopics:[],items:input.items.map(item=>({source:item.source,id:item.id,topics:[Number(item.id.split('-').at(-1))%2===0?'coding':'models'],media:(item.media??[]).map(candidate=>candidate.id),en:{title:item.title,summary:item.text+'\n\nA second synthetic paragraph validates readable article structure.\n\n- Synthetic finding one\n- Synthetic finding two'},'zh-CN':{title:'用于构建验证的条目 '+item.id,summary:'这是分页、标签和双语内容验证使用的合成素材。\n\n第二段合成文字用于检查详情页的段落结构。\n\n- 合成要点一\n- 合成要点二'}}))}});
const store = new Store(config.storage.database);
store.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
try {
 for (let i=0;i<101;i++) {
  const source=config.sources[i%2]!;
  const date=DateTime.fromISO('2026-08-01T00:00:00Z').plus({days:i}).toUTC().toISO()!;
  const item:Item={id:'fixture-'+i,source:source.id,stream:'main',channel:'rss',title:'Fixture '+i+' — Research and developer tools',text:'Synthetic fixture for archive validation. It does not represent a real announcement.',url:'https://example.invalid/'+i+'/a-long-source-path-to-check-url-wrapping-and-complete-clickable-text?reference='+('x'.repeat(80)),publishedAt:date,observedAt:date,basis:i===100?'observed':'published',metrics:{}};
  if(i===100)item.media=[{id:'fixture-diagram',type:'image',url:'https://example.invalid/fixture-diagram.svg',title:'Synthetic source diagram'},{id:'fixture-video',type:'video',url:'https://example.invalid/fixture-video.mp4',title:'Synthetic source demo'}];
  store.saveCollection(source.id,'main','rss',{items:[item],raw:[],coverage:{status:'complete',to:date,notes:[]}},'');
 }
 const result=await summarize(config,store,{},generator); assert.equal(result.generated,101); await writeSite(config,store);
} finally {store.close();}
const output=await buildSite(root);
for (const prefix of ['', 'zh-CN/']) {
 const home=await readFile(join(output,prefix,'index.html'),'utf8');
 assert.equal((home.match(/data-filter-item/g)??[]).length,50);
 assert.match(home,/data-paged-archive/);
 const search=JSON.parse(await readFile(join(output,'assets/website',prefix?'i18n/zh-CN/search.v1.json':'search.v1.json'),'utf8'));
 assert.equal(search.documents.length,101);
 assert.equal(((await readFile(join(output,prefix,'feed.xml'),'utf8')).match(/<entry>/g)??[]).length,100);
}
const evidence={items:101,bilingualMarkdown:202,SSRRows:50,searchEntries:101,feedEntries:100,elapsedSeconds:(Date.now()-started)/1000,output};
await mkdir('.local/notes/1009/validation',{recursive:true});
await writeFile('.local/notes/1009/validation/fixture-build.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));
