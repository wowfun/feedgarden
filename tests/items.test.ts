import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, cp, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { configSchema } from '../src/config.js';
import { Store, initializeFeedSchema } from '../src/store.js';
import { summarize, acceptedItems, itemPath, eligible, type Generator } from '../src/items.js';
import { writeSite, recoverContent } from '../src/site.js';
import { loadTopics, applyTopics, mergeTopics, type Registry } from '../src/topics.js';
import { validateArtifact, validateRegistry } from '../src/topics-contract.mjs';
import { date, parseFollowBuilders } from '../src/channels/parsers.js';
import { convertConfig, migrate, rollback } from '../src/migrate.js';
import { assertManagedPaths } from '../src/publish.js';
import { hash } from '../src/util.js';
import type { Item } from '../src/types.js';
const at='2026-10-09T10:00:00.000Z';
const topic={id:'coding',name:{en:'Coding','zh-CN':'编程'},description:'Developer tools',aliases:[],deprecated:false};
const registry:Registry={version:1,topics:[topic]};
const item=(id:string,source='one',overrides:Partial<Item>={}):Item=>({id,source,stream:'main',channel:'rss',title:'Title '+id,text:'Supplied facts',url:'https://example.test/'+encodeURIComponent(id),publishedAt:at,observedAt:at,basis:'published',metrics:{},...overrides});
function save(store:Store,items:Item[]) {for(const i of items) store.saveCollection(i.source,'main','rss',{items:[i],raw:[],coverage:{status:'complete',to:i.observedAt,notes:[]}},'');}
const generator:Generator=async(_config,input,_repair,directory)=>({output:{contractVersion:2,newTopics:[],items:input.items.map(i=>({source:i.source,id:i.id,topics:['coding'],en:{title:i.title,summary:i.text},'zh-CN':{title:'中文 '+i.title,summary:i.text?'提供的事实。':''}}))},directory:directory!,events:[],usage:[]});
async function fixture() {
 const root=await mkdtemp(join(tmpdir(),'feedgarden-items-'));await writeFile(join(root,'topics.json'),JSON.stringify(registry));
 const config=configSchema.parse({version:2,storage:{directory:root,database:join(root,'data.sqlite')},feed:{directory:join(root,'content'),topics:join(root,'topics.json')},agent:{model:'deepseek/deepseek-flash',runtimeDirectory:join(root,'tasks')},sources:['one','two'].map(id=>({id,name:id,intervalHours:1,streams:[{id:'main',channels:[{id:'rss',kind:'feed',url:'https://example.test/rss'}]}]}))});
 const store=new Store(config.storage.database);store.setMeta('cutoff','1970-01-01T00:00:00.000Z');
 return {root,config,store,cleanup:async()=>{store.close();await rm(root,{recursive:true,force:true});}};
}
test('all eligible items enter persistent per-source FIFO and round-robin batches with a complete input budget',async()=>{
 const f=await fixture();const order:string[]=[];
 try {save(f.store,Array.from({length:24},(_,i)=>item(String(i).padStart(2,'0'),i<12?'one':'two')));
 const result=await summarize(f.config,f.store,{},async(...args)=>{order.push(args[1].items[0]!.source);assert.ok(JSON.stringify(args[1]).length<=24000);return generator(...args);},at);
 assert.equal(result.generated,24);assert.deepEqual(order,['one','two','one','two']);assert.equal(acceptedItems(f.store).length,24);
 }finally{await f.cleanup();}
});
test('native ID path safety and source-aware cache; metadata updates reuse copy, changed text regenerates',async()=>{
 const f=await fixture();let calls=0;const gen:Generator=async(...args)=>{calls++;return generator(...args);};
 try{save(f.store,[item('../../a','one'),item('../../a','two')]);await summarize(f.config,f.store,{},gen,at);assert.equal(calls,2);assert.notEqual(itemPath('one','../../a'),itemPath('two','../../a'));assert.match(itemPath('one','../../a'),/^items\/[a-f0-9]{64}\.md$/);
 save(f.store,[item('../../a','one',{url:'https://example.test/new',metrics:{score:100}})]);await summarize(f.config,f.store,{},gen,at);assert.equal(calls,2);assert.equal(acceptedItems(f.store).find(r=>r.item.source==='one')?.item.url,'https://example.test/new');
 save(f.store,[item('../../a','one',{text:'New facts'})]);await summarize(f.config,f.store,{},gen,at);assert.equal(calls,3);
 await writeSite(f.config,f.store);const en=await readFile(join(f.config.feed.directory,itemPath('one','../../a')),'utf8'),zh=await readFile(join(f.config.feed.directory,'_translations/zh-CN',itemPath('one','../../a')),'utf8');assert.match(en,/source_url: "https:\/\/example.test\//);assert.match(en,/topics\/coding/);assert.match(zh,/source\/one/);
 }finally{await f.cleanup();}
});
test('a failed revision retains the previous bilingual snapshot and backs off to five attempts',async()=>{
 const f=await fixture();try{save(f.store,[item('a')]);await summarize(f.config,f.store,{},generator,at);save(f.store,[item('a','one',{text:'Changed facts'})]);let tries=0;
 const broken:Generator=async()=>{tries++;throw new Error('Transport disconnected');};
 await summarize(f.config,f.store,{},broken,at);assert.equal(tries,1);assert.equal(acceptedItems(f.store)[0]?.item.text,'Supplied facts');await summarize(f.config,f.store,{},broken,at);assert.equal(tries,1);
 for(let i=1;i<5;i++)await summarize(f.config,f.store,{},broken,new Date(Date.parse(at)+i*7*3600_000).toISOString());
 assert.equal((f.store.db.prepare('SELECT state,attempts FROM feed_jobs').get() as any).state,'failed');assert.equal(tries,5);
 await summarize(f.config,f.store,{retryFailed:true},generator,new Date(Date.parse(at)+40*3600_000).toISOString());assert.equal(acceptedItems(f.store)[0]?.item.text,'Changed facts');
 }finally{await f.cleanup();}
});
test('invalid artifacts get one immediate repair; quota deferral remains pending without failure',async()=>{
 const f=await fixture();try{save(f.store,[item('a')]);let attempts=0;
 await summarize(f.config,f.store,{},async(...args)=>{attempts++;const result=await generator(...args);if(attempts===1)result.output.items[0]!.topics=['missing'];return result;},at);assert.equal(attempts,2);
 save(f.store,[item('b')]);f.config.agent.maxDailyCalls=2;const result=await summarize(f.config,f.store,{},()=>{throw new Error('No quota');},at);assert.equal(result.deferred,true);assert.equal(result.pending,1);assert.equal(result.failed,0);
 }finally{await f.cleanup();}
});
test('topic additions do not invalidate accepted summaries; deprecation remaps output and aliases',async()=>{
 const f=await fixture();try{save(f.store,[item('a')]);await summarize(f.config,f.store,{},generator,at);
 const next={version:1 as const,topics:[{...topic,deprecated:true,replacedBy:'dev'}, {...topic,id:'dev',name:{en:'Development','zh-CN':'开发'}}]};await applyTopics(f.config.feed.topics,next);
 await summarize(f.config,f.store,{},()=>{throw new Error('Should reuse');},at);await writeSite(f.config,f.store);
 assert.match(await readFile(join(f.config.feed.directory,itemPath('one','a')),'utf8'),/topics\/dev/);assert.match(await readFile(join(f.config.feed.directory,'_locale.yml'),'utf8'),/"topics\/coding": "topics\/dev"/);
 assert.throws(()=>validateRegistry({version:1,topics:[topic,{...topic,id:'duplicate'}]}),/Duplicate/);
 await assert.rejects(applyTopics(f.config.feed.topics,{version:1,topics:[]} ),/cannot be removed/);
 }finally{await f.cleanup();}
});
test('topic file is durable before accepted DB commit, and saved artifact recovers without another call',async()=>{
 const f=await fixture();try{save(f.store,[item('a')]);f.store.db.exec("CREATE TRIGGER reject_accept BEFORE INSERT ON feed_summaries BEGIN SELECT RAISE(FAIL,'simulated crash'); END;");
 await assert.rejects(summarize(f.config,f.store,{},async(...args)=>{const result=await generator(...args);result.output.newTopics=[{...topic,id:'models',name:{en:'Models','zh-CN':'模型'}}];result.output.items[0]!.topics=['models'];return result;},at),/simulated crash/);
 assert.ok((await loadTopics(f.config.feed.topics)).topics.some(t=>t.id==='models'));assert.equal(acceptedItems(f.store).length,0);f.store.db.exec('DROP TRIGGER reject_accept');
 await summarize(f.config,f.store,{},()=>{throw new Error('Must replay artifact');},at);assert.equal(acceptedItems(f.store).length,1);
 }finally{await f.cleanup();}
});
test('canonical topic editing during an agent call stops without a dangling public reference',async()=>{
 const f=await fixture();try{save(f.store,[item('a')]);await assert.rejects(summarize(f.config,f.store,{},async(...args)=>{await writeFile(f.config.feed.topics,JSON.stringify({version:1,topics:[]}));return generator(...args);},at),/cannot be removed|Unknown|changed|topic/i);assert.equal(acceptedItems(f.store).length,0);
 }finally{await f.cleanup();}
});
test('cutoff uses Shanghai midnight as one instant; source dates and undated first observations are stable',()=>{
 assert.equal(date('2026-10-09','Asia/Shanghai'),'2026-10-08T16:00:00.000Z');assert.equal(date('2026-10-09','America/Los_Angeles'),'2026-10-09T07:00:00.000Z');assert.equal(date('2026-10-09T00:00:00-07:00','Asia/Shanghai'),'2026-10-09T07:00:00.000Z');assert.equal(date('2026-10-09 00:30:00','Asia/Shanghai'),'2026-10-08T16:30:00.000Z');
 const source=configSchema.parse({version:2,agent:{model:'deepseek/deepseek-flash'},sources:[{id:'one',name:'One',intervalHours:1,streams:[{id:'main',channels:[{id:'rss',kind:'feed'}]}]}]}).sources[0]!;
 assert.equal(eligible(item('a','one',{publishedAt:'2026-10-08T15:59:00.000Z'}),at,'2026-10-08T16:00:00.000Z',source),false);
 assert.equal(eligible(item('a','one',{basis:'observed'}),'2026-10-08T15:00:00.000Z','2026-10-08T16:00:00.000Z',source),false);
 const sampled=parseFollowBuilders(JSON.stringify({generatedAt:at,x:[{handle:'main',tweets:[{id:'1',text:'Undated sample'}]}]}),{source:'x',stream:'main',channel:'sample',observedAt:'2026-10-10T00:00:00.000Z'});assert.equal(sampled.items[0]?.basis,'observed');assert.equal(sampled.items[0]?.publishedAt,'2026-10-10T00:00:00.000Z');
});
test('content journal recovers the staged tree between its two renames',async()=>{
 const f=await fixture();try{const staging=join(f.root,'.content-stage-test'),previous=join(f.root,'content.previous-test');await mkdir(staging);await writeFile(join(staging,'index.md'),'new');await mkdir(previous);await writeFile(join(previous,'index.md'),'old');await writeFile(join(f.root,'content-journal.json'),JSON.stringify({destination:f.config.feed.directory,staging,previous}));await recoverContent(f.config);assert.equal(await readFile(join(f.config.feed.directory,'index.md'),'utf8'),'new');await assert.rejects(readFile(join(f.root,'content-journal.json')));
 }finally{await f.cleanup();}
});
test('three-way topic merge admits independent additions and rejects same-ID conflicts and unmanaged publication paths',()=>{
 const b=registry,l={version:1 as const,topics:[topic,{...topic,id:'models',name:{en:'Models','zh-CN':'模型'}}]},r={version:1 as const,topics:[topic,{...topic,id:'research',name:{en:'Research','zh-CN':'研究'}}]};assert.equal(mergeTopics(b,l,r).topics.length,3);
 assert.throws(()=>mergeTopics(b,{...b,topics:[{...topic,description:'Local'}]},{...b,topics:[{...topic,description:'Remote'}]}),/coding/);
 assertManagedPaths(['content/items/a.md','config/topics.json']);assert.throws(()=>assertManagedPaths(['README.md']));assert.throws(()=>assertManagedPaths(['reports/old.md']));assertManagedPaths(['reports/old.md'],['reports/old.md']);
});
test('legacy schema is refused before upgrading; migration baseline excludes existing identities',async()=>{
 const f=await fixture();try{const legacy=join(f.root,'legacy.sqlite');await f.store.backup(legacy);const db=new Database(legacy);db.exec('DROP TABLE feed_meta; DROP TABLE feed_excluded; DROP TABLE feed_jobs; DROP TABLE feed_summaries; DROP TABLE feed_cache; DROP TABLE feed_batches; PRAGMA user_version=2;');db.close();assert.throws(()=>new Store(legacy),/Migration required/);const raw=new Database(legacy);assert.equal(raw.pragma('user_version',{simple:true}),2);raw.prepare('INSERT INTO items VALUES (?,?,?,?,?,?,?)').run('one','old',at,at,at,JSON.stringify(item('old')),'hash');initializeFeedSchema(raw,'2026-10-08T16:00:00.000Z');raw.close();const upgraded=new Store(legacy);try{assert.equal(upgraded.meta('cutoff'),'2026-10-08T16:00:00.000Z');assert.deepEqual(upgraded.db.prepare('SELECT * FROM feed_excluded').all(),[{source:'one',id:'old'}]);}finally{upgraded.close();}
 }finally{await f.cleanup();}
});
test('config migration preserves keyword arrays and refuses ambiguous frequency overrides',()=>{
 const old={version:1,agent:{model:'deepseek/deepseek-flash'},reports:{backfillDays:3},sources:[{id:'arxiv',name:'arXiv',intervalHours:6,topics:['LLM','coding agent'],frequencies:['weekly'],streams:[{id:'cs.AI',channels:[{id:'api',kind:'arxiv-api'}]}]}]};assert.deepEqual(convertConfig(old).sources[0]?.includeKeywords,old.sources[0]!.topics);assert.equal(convertConfig(old).collection.backfillDays,3);
 assert.equal(convertConfig({...old,agent:{...old.agent,effort:'off'},sources:[{...old.sources[0],frequencies:['daily','weekly'],reportAgent:{daily:{effort:'off'}}}]}).sources[0]?.agent?.effort,'off');
 assert.throws(()=>convertConfig({...old,sources:[{...old.sources[0],frequencies:['daily','weekly'],reportAgent:{daily:{model:'a'},weekly:{model:'b'}}}]}),/incompatible/);
});
test('three consecutive runtime failures stop a run while preserving every queued job',async()=>{
 const f=await fixture();try{save(f.store,Array.from({length:30},(_,i)=>item(String(i))));let calls=0;
 await assert.rejects(summarize(f.config,f.store,{},async()=>{calls++;throw new Error('Runtime unavailable');},at),/Three consecutive/);assert.equal(calls,3);assert.equal(acceptedItems(f.store).length,0);assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_jobs').get() as any).n,30);
 }finally{await f.cleanup();}
});
test('source selection and disablement skip retained failed jobs and interrupted artifacts',async()=>{
 const f=await fixture();try{save(f.store,[item('one','one'),item('two','two')]);await summarize(f.config,f.store,{source:'two'},async()=>{throw new Error('Retained failure');},at);
 const selected=await summarize(f.config,f.store,{source:'one'},generator,at);assert.equal(selected.generated,1);assert.equal(selected.failed,0);assert.equal(selected.pending,0);
 f.config.sources.find(source=>source.id==='two')!.enabled=false;const result=await summarize(f.config,f.store,{},()=>{throw new Error('Disabled source must not run');},at);assert.equal(result.pending,0);assert.equal(acceptedItems(f.store).length,1);
 }finally{await f.cleanup();}
});
