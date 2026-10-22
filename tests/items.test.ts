import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, cp, mkdir, stat, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { configSchema } from '../src/config.js';
import { Store, initializeFeedSchema } from '../src/store.js';
import { summarize, acceptedItems, iterateAcceptedItems, itemPath, eligible, type Generator } from '../src/items.js';
import { writeSite, recoverContent, renderItem } from '../src/site.js';
import { loadTopics, applyTopics, mergeTopics, type Registry } from '../src/topics.js';
import { validateArtifact, validateRegistry } from '../src/topics-contract.mjs';
import { date, parseFollowBuilders } from '../src/channels/parsers.js';
import { convertConfig, migrate, rollback } from '../src/migrate.js';
import { assertManagedPaths } from '../src/publish.js';
import { hash } from '../src/util.js';
import { artifactRepairFeedback } from '../src/agent.js';
import { pruneWorkspaces } from '../src/workspaces.js';
import type { Item } from '../src/types.js';
import { transcriptStep } from '../src/podcasts.js';
import type { TaskGenerator } from '../src/fixed-tasks.js';
import { maintainArchive } from '../src/archives.js';
import { itemWindowSql, resolveItemWindow } from '../src/item-window.js';
import { initializePublications } from '../src/publications.js';
const at='2026-10-09T10:00:00.000Z';
const topic={id:'coding',name:{en:'Coding','zh-CN':'编程'},description:'Developer tools',aliases:[],deprecated:false,hidden:false};
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

test('source-ineligible queue rows are decoded at most once per run plus final diagnostics',async t=>{
 const f=await fixture();try{
  f.config.sources=[{...f.config.sources[0]!,id:'arxiv',includeKeywords:['agent']}];f.config.agent.maxBatchItems=1;
  const rejected=Array.from({length:24},(_,i)=>item('a-rejected-'+i,'arxiv')),good=Array.from({length:8},(_,i)=>item('z-agent-'+i,'arxiv',{text:'Agent research'}));save(f.store,[...rejected,...good]);
  const data=new Set(rejected.map(i=>JSON.stringify({item:i,firstSeen:at})));
  for(const i of rejected)f.store.db.prepare("INSERT INTO feed_jobs VALUES (?,?,?,?,'pending',0,'',NULL)").run(i.source,i.id,i.id,JSON.stringify({item:i,firstSeen:at}));
  const parse=JSON.parse;let decoded=0;
  t.mock.method(JSON,'parse',(...args:Parameters<typeof JSON.parse>)=>{if(data.has(args[0]))decoded++;return parse(...args);});
  const result=await summarize(f.config,f.store,{},generator,at);assert.equal(result.generated,8);assert.equal(result.pending,0);assert.equal(result.failed,0);
  assert.ok(decoded<=rejected.length*2,`Decoded ${decoded} rejected queue rows`);
  assert.equal((f.store.db.prepare("SELECT count(*) n FROM feed_jobs WHERE state='pending'").get() as {n:number}).n,rejected.length,'Source rejection is local to this run, not a durable exclusion');
 }finally{await f.cleanup();}
});

test('cached batches walk FIFO without sorting the complete private cache backlog',async()=>{
 const f=await fixture();try{
  const prepare=f.store.db.prepare.bind(f.store.db);let query='';
  f.store.db.prepare=((sql:string)=>{if(sql.startsWith('SELECT j.* FROM feed_jobs j')&&sql.includes("state='cached'"))query=sql;return prepare(sql);}) as typeof f.store.db.prepare;
  await summarize(f.config,f.store,{},generator,at);
  const args=itemWindowSql('j.data',"json_extract(j.data,'$.firstSeen')",resolveItemWindow({},'1970-01-01T00:00:00.000Z',at),'$.item').parameters;
  const plan=prepare('EXPLAIN QUERY PLAN '+query).all('one',...args,'[]') as {detail:string}[];
  assert.ok(plan.some(row=>row.detail.includes('feed_jobs_cached_order')),JSON.stringify(plan));assert.ok(!plan.some(row=>row.detail.includes('TEMP B-TREE')),JSON.stringify(plan));
 }finally{await f.cleanup();}
});

test('bounded eligibility counts include reusable accepted candidates rather than remaining work',async()=>{
 const f=await fixture();try{
  save(f.store,[item('a')]);await summarize(f.config,f.store,{},generator,at);await writeSite(f.config,f.store);
  const result=await summarize(f.config,f.store,{since:'2026-10-09',until:'2026-10-10'},()=>{throw new Error('Reuse accepted copy');},at);
  assert.equal(result.eligibleCandidates,1);assert.equal(result.generated,0);assert.equal(result.pending,0);
 }finally{await f.cleanup();}
});

test('standalone rendering adopts installed bilingual history before applying a narrower window',async()=>{
 const f=await fixture();try{
  save(f.store,[item('history')]);await summarize(f.config,f.store,{},generator,at);
  // Model an installation from before the publication ledger existed.
  f.store.db.exec("DELETE FROM feed_meta WHERE key='publications_initialized'");
  const record=acceptedItems(f.store)[0]!,path=itemPath('one','2026-10-09',f.store.itemNumber('one','history','2026-10-09'));
  for(const locale of ['en','zh-CN'] as const){const prefix=locale==='en'?'':'_translations/zh-CN/';await mkdir(join(f.config.feed.directory,prefix,'one/2026-10/09'),{recursive:true});await writeFile(join(f.config.feed.directory,prefix,path),renderItem(record,locale));}
  f.store.setMeta('publication_windows',JSON.stringify({one:resolveItemWindow({since:'2026-10-20',until:'2026-10-21'},'1970-01-01T00:00:00Z',at)}));
  await writeSite(f.config,f.store,undefined,true);
  assert.ok(f.store.db.prepare("SELECT 1 FROM feed_publications WHERE source='one' AND id='history'").get());
  for(const prefix of ['','_translations/zh-CN/'])assert.equal(await readFile(join(f.config.feed.directory,prefix,path),'utf8'),renderItem(record,prefix?'zh-CN':'en'));
 }finally{await f.cleanup();}
});

test('review: repeated observed windows preserve enrichment schedules and skip unchanged renders',async()=>{
 const f=await fixture();try{
  const options={source:'one',since:'2026-10-09',until:'2026-10-10',observedDays:7};
  save(f.store,[item('a')]);await summarize(f.config,f.store,options,generator,at);await writeSite(f.config,f.store);
  f.store.db.prepare('INSERT OR REPLACE INTO feed_planning VALUES (?,?,?)').run('one','a','2026-10-10T10:00:00Z');
  let prepared=0;await summarize(f.config,f.store,options,generator,'2026-10-09T11:00:00Z',async i=>{prepared++;return i;});
  assert.equal(prepared,0);assert.equal(await writeSite(f.config,f.store),false);
  await summarize(f.config,f.store,{...options,source:'two'},generator,'2026-10-09T11:01:00Z');
  assert.equal(await writeSite(f.config,f.store),false);
 }finally{await f.cleanup();}
});

test('review: source windows neither block another source nor expose its expired private copies',async()=>{
 const f=await fixture();try{
  save(f.store,[item('a'),item('b','two')]);await summarize(f.config,f.store,{},generator,at);
  await summarize(f.config,f.store,{source:'one',since:'2026-10-09',until:'2026-10-10'},generator,at);
  await summarize(f.config,f.store,{source:'two',since:'2026-10-10',until:'2026-10-11'},generator,at);
  assert.deepEqual(acceptedItems(f.store).map(r=>r.item.id),['a']);
  await summarize(f.config,f.store,{source:'one'},generator,at);
  assert.deepEqual(acceptedItems(f.store).map(r=>r.item.id),['a']);
  await writeSite(f.config,f.store);assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_publications').get() as {n:number}).n,1);
 }finally{await f.cleanup();}
});

test('review: SQL candidate scans admit offset dates and avoid parsing dates outside the bounded window',async t=>{
 const f=await fixture();try{
  save(f.store,[item('offset','one',{publishedAt:'2026-10-08T13:00:00-04:00',observedAt:'2026-10-01T00:00:00Z'}),...Array.from({length:40},(_,i)=>item('future'+i,'one',{publishedAt:'2026-10-11T10:00:00Z'}))]);
  // Force the policy scan, rather than the insertion trigger, to find the offset item.
  f.store.db.exec('DELETE FROM feed_planning');
  const parse=JSON.parse;let futureParses=0;
  t.mock.method(JSON,'parse',(...args:Parameters<typeof JSON.parse>)=>{if(args[0].startsWith('{"id":"future'))futureParses++;return parse(...args);});
  const result=await summarize(f.config,f.store,{since:'2026-10-09T00:00:00+08:00',until:'2026-10-10T00:00:00+08:00',observedDays:7},generator,at);
  assert.equal(result.generated,1);assert.equal(result.eligibleCandidates,1);assert.equal(futureParses,0);
 }finally{await f.cleanup();}
});

test('review: recovered fifth-attempt artifacts retain private topic proposals without failing or paying again',async()=>{
 const f=await fixture(),cancel=new AbortController();try{
  save(f.store,[item('old')]);
  await assert.rejects(summarize(f.config,f.store,{signal:cancel.signal},async(...args)=>{
   const result=await generator(...args);result.output.newTopics=[{...topic,id:'novel',name:{en:'Novel','zh-CN':'新主题'}}];result.output.items[0]!.topics=['novel'];
   await writeFile(join(args[3]!,'result.json'),JSON.stringify(result.output));cancel.abort(new Error('Interrupted'));return result;
  },at),/Interrupted/);
  f.store.db.exec("UPDATE feed_jobs SET attempts=5");
  await summarize(f.config,f.store,{source:'two'},()=>{throw new Error('No work');},at);
  assert.equal((f.store.db.prepare('SELECT state FROM feed_jobs').get() as {state:string}).state,'pending');
  await summarize(f.config,f.store,{source:'one',since:'2026-10-10',until:'2026-10-11'},()=>{throw new Error('Expired');},at);
  assert.equal((f.store.db.prepare('SELECT state FROM feed_jobs').get() as {state:string}).state,'cached');
  assert.deepEqual((await loadTopics(f.config.feed.topics)).topics.map(t=>t.id),['coding']);
  assert.equal(acceptedItems(f.store).length,0);
  const before=(f.store.db.prepare('SELECT count(*) n FROM agent_calls').get() as {n:number}).n;
  await summarize(f.config,f.store,{source:'one',since:'2026-10-09',until:'2026-10-10'},()=>{throw new Error('Reuse cached artifact');},at);
  assert.deepEqual(acceptedItems(f.store)[0]!.copy.topics,['novel']);
  assert.equal((f.store.db.prepare('SELECT count(*) n FROM agent_calls').get() as {n:number}).n,before);
 }finally{await f.cleanup();}
});

test('review: hidden false normalizes and replacements require a visible active target',()=>{
 const {hidden:_,...implicit}=topic;assert.deepEqual(validateRegistry({version:1,topics:[implicit]}),validateRegistry(registry));
 assert.throws(()=>validateRegistry({version:1,topics:[{...topic,deprecated:true,replacedBy:'other'},{...topic,id:'other',name:{en:'Other','zh-CN':'其他'},hidden:true}]}),/visible/);
});

test('review: a mixed recovered batch applies only admitted topic proposals and later reuses the rest',async()=>{
 const f=await fixture(),cancel=new AbortController();try{
  save(f.store,[item('a-live'),item('b-expired','one',{publishedAt:'2026-10-08T10:00:00Z'})]);
  await assert.rejects(summarize(f.config,f.store,{signal:cancel.signal},async(...args)=>{
   const result=await generator(...args);result.output.newTopics=['live','private'].map(id=>({...topic,id,name:{en:id,'zh-CN':id}}));
   result.output.items.forEach((copy,i)=>copy.topics=[i===0?'live':'private']);
   await writeFile(join(args[3]!,'result.json'),JSON.stringify(result.output));cancel.abort(new Error('Interrupted'));return result;
  },at),/Interrupted/);
  await summarize(f.config,f.store,{source:'one',since:'2026-10-09',until:'2026-10-10'},()=>{throw new Error('Recover');},at);
  assert.deepEqual((await loadTopics(f.config.feed.topics)).topics.map(t=>t.id),['coding','live']);
  assert.deepEqual(acceptedItems(f.store).map(r=>r.item.id),['a-live']);
  await summarize(f.config,f.store,{source:'one'},()=>{throw new Error('Reuse');},at);
  assert.deepEqual((await loadTopics(f.config.feed.topics)).topics.map(t=>t.id),['coding','live','private']);
  assert.equal(acceptedItems(f.store).length,2);
 }finally{await f.cleanup();}
});

test('review: render journals contain only first publications',async()=>{
 const f=await fixture();try{
  save(f.store,[item('old')]);await summarize(f.config,f.store,{},generator,at);await writeSite(f.config,f.store);
  f.store.db.exec("CREATE TRIGGER reject_redundant_publication BEFORE INSERT ON feed_publications WHEN EXISTS(SELECT 1 FROM feed_publications p WHERE p.source=NEW.source AND p.id=NEW.id) BEGIN SELECT RAISE(ABORT,'redundant publication'); END");
  await writeSite(f.config,f.store,undefined,true);
  save(f.store,[item('new')]);await summarize(f.config,f.store,{},generator,at);await writeSite(f.config,f.store);
  assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_publications').get() as {n:number}).n,2);
 }finally{await f.cleanup();}
});

test('review: placeholder reservations are not publication identities and opaque item removal is bilingual',async()=>{
 const f=await fixture();try{
  const path='one/2026-10/09/item-1.md';
  f.store.itemNumber('one','archive:'+path,'2026-10-09');
  for(const prefix of ['','_translations/zh-CN/']){await mkdir(join(f.config.feed.directory,prefix,'one/2026-10/09'),{recursive:true});await writeFile(join(f.config.feed.directory,prefix,path),'Opaque archive');f.store.db.prepare('INSERT INTO feed_archive_files VALUES (?,?)').run(prefix+path,Buffer.from('Opaque archive'));}
  await initializePublications(f.config,f.store);assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_publications').get() as {n:number}).n,0);
  await maintainArchive(f.config,f.store,'remove','_translations/zh-CN/'+path);await writeSite(f.config,f.store);
  for(const prefix of ['','_translations/zh-CN/'])await assert.rejects(stat(join(f.config.feed.directory,prefix,path)),{code:'ENOENT'});
 }finally{await f.cleanup();}
});

test('review: narrowed source eligibility filters stale failed jobs and pending queue candidates',async()=>{
 const f=await fixture();try{
  f.config.sources=[{...f.config.sources[0]!,id:'arxiv',includeKeywords:['agent']},{...f.config.sources[1]!,id:'x'}];
  const ignored=[item('paper','arxiv'),item('repost','x',{kind:'repost'})];save(f.store,ignored);
  for(const i of ignored)f.store.db.prepare("INSERT INTO feed_jobs VALUES (?,?,?,?,'failed',5,'','Stale failure')").run(i.source,i.id,i.id,JSON.stringify({item:i,firstSeen:at}));
  const result=await summarize(f.config,f.store,{},()=>{throw new Error('Ineligible');},at);
  assert.equal(result.failed,0);assert.deepEqual(result.jobErrors,[]);
  // Pending ineligible rows cannot occupy the first batch and block eligible work.
  f.store.db.exec("UPDATE feed_jobs SET state='pending',attempts=0");save(f.store,[item('eligible','arxiv',{text:'Useful agent research'})]);
  const generated=await summarize(f.config,f.store,{},generator,at);assert.equal(generated.generated,1);assert.equal(generated.pending,0);
  assert.deepEqual(acceptedItems(f.store).map(r=>r.item.id),['eligible']);
 }finally{await f.cleanup();}
});

test('unchanged unbounded summaries do not parse history just to count diagnostics',async t=>{
 const f=await fixture();
 try {
  save(f.store,Array.from({length:128},(_,i)=>item('history-'+i)));
  await summarize(f.config,f.store,{},generator,at);
  const rawItems=new Set((f.store.db.prepare('SELECT data FROM items').all() as {data:string}[]).map(row=>row.data));
  const parse=JSON.parse;let historicalParses=0;
  t.mock.method(JSON,'parse',(...args:Parameters<typeof JSON.parse>)=>{
   if(rawItems.has(args[0]))historicalParses++;
   return parse(...args);
  });
  const result=await summarize(f.config,f.store,{},()=>{throw new Error('No new work');},at);
  assert.ok(historicalParses<=1,`Unchanged run parsed ${historicalParses} historical items`);
  assert.equal(result.eligibleCandidates,null);
 }finally{await f.cleanup();}
});

test('publication readers load scope once and avoid per-row publication lookups',async t=>{
 const f=await fixture();
 try {
  save(f.store,[item('a'),item('b'),item('c')]);
  await summarize(f.config,f.store,{},generator,at);await writeSite(f.config,f.store);
  const meta=f.store.meta.bind(f.store),statement=f.store.statement.bind(f.store);
  let scopeReads=0,pointLookups=0;
  t.mock.method(f.store,'meta',(key:string)=>{if(key==='publication_windows')scopeReads++;return meta(key);});
  t.mock.method(f.store,'statement',(sql:string)=>{if(sql==='SELECT 1 FROM feed_publications WHERE source=? AND id=?')pointLookups++;return statement(sql);});
  assert.equal(acceptedItems(f.store).length,3);
  const unboundedReads=scopeReads;
  f.store.setMeta('publication_windows',JSON.stringify({one:resolveItemWindow({since:'2026-10-20',until:'2026-10-21'},'1970-01-01T00:00:00.000Z',at)}));
  await writeSite(f.config,f.store,undefined,true);
  assert.deepEqual({unboundedReads,pointLookups},{unboundedReads:1,pointLookups:0});
 }finally{await f.cleanup();}
});

test('daily admission separates publication dates from first observations and retains published history',async()=>{
 const f=await fixture(), runAt='2026-10-21T22:00:00.000Z';
 const options={source:'one',since:'2026-10-20T00:00:00+08:00',until:'2026-10-21T00:00:00+08:00',observedDays:7};
 try {
  save(f.store,[item('history','one',{publishedAt:'2026-10-01T00:00:00.000Z'})]);
  await summarize(f.config,f.store,{},generator,runAt);await writeSite(f.config,f.store);
  const historyPath=(f.store.db.prepare("SELECT day,number FROM feed_item_paths WHERE id='history'").get() as {day:string;number:number});
  const historyFile=join(f.config.feed.directory,itemPath('one',historyPath.day,historyPath.number));const history=await readFile(historyFile,'utf8');
  save(f.store,[
   item('start','one',{publishedAt:'2026-10-19T16:00:00.000Z'}),
   item('last','one',{publishedAt:'2026-10-20T15:59:59.999Z'}),
   item('before','one',{publishedAt:'2026-10-19T15:59:59.999Z'}),
   item('today','one',{publishedAt:'2026-10-20T16:00:00.000Z'}),
   item('observed-edge','one',{basis:'observed',observedAt:'2026-10-14T22:00:00.000Z'}),
   item('observed-expired','one',{basis:'observed',observedAt:'2026-10-14T21:59:59.999Z'}),
   item('observed-future','one',{basis:'observed',observedAt:'2026-10-21T22:00:00.001Z'}),
   item('other-source','two',{publishedAt:'2026-10-19T16:00:00.000Z'}),
  ]);
  // Seeing an old snapshot again cannot make its first observation recent.
  save(f.store,[item('observed-expired','one',{basis:'observed',observedAt:runAt})]);
  const result=await summarize(f.config,f.store,options,generator,runAt);
  assert.equal(result.generated,3);assert.equal(result.pending,0);assert.equal(result.eligibleCandidates,3);
  await writeSite(f.config,f.store);
  assert.deepEqual(acceptedItems(f.store).map(r=>r.item.id).sort(),['history','last','observed-edge','start']);
  assert.equal(await readFile(historyFile,'utf8'),history);
  // Changing the date scope must invalidate rendering even without new summaries.
  await summarize(f.config,f.store,{...options,since:'2026-10-21T00:00:00+08:00',until:'2026-10-22T00:00:00+08:00'},generator,runAt);
  assert.equal(await writeSite(f.config,f.store),true);
  assert.ok(acceptedItems(f.store).some(r=>r.item.id==='today'));
  assert.ok(acceptedItems(f.store).some(r=>r.item.id==='start'));
 } finally {await f.cleanup();}
});

test('expired interrupted artifacts and queued failures cannot generate or publish in a later window',async()=>{
 const f=await fixture(), cancellation=new AbortController(), runAt='2026-10-21T10:00:00.000Z';
 try {
  save(f.store,[item('expired','one',{publishedAt:'2026-10-18T12:00:00.000Z'})]);
  await assert.rejects(summarize(f.config,f.store,{signal:cancellation.signal},async(...args)=>{
   const result=await generator(...args);await writeFile(join(args[3]!,'result.json'),JSON.stringify(result.output));cancellation.abort(new Error('Stopped'));return result;
  },runAt),/Stopped/);
  const options={since:'2026-10-20T00:00:00+08:00',until:'2026-10-21T00:00:00+08:00',observedDays:7,retryFailed:true};
  const result=await summarize(f.config,f.store,options,()=>{throw new Error('Expired item must not spend another call');},runAt);
  assert.equal(result.generated,0);assert.equal(result.pending,0);
  assert.equal((f.store.db.prepare('SELECT COUNT(*) n FROM feed_cache').get() as {n:number}).n,1);
  assert.equal((f.store.db.prepare('SELECT COUNT(*) n FROM feed_summaries').get() as {n:number}).n,0);
  await writeSite(f.config,f.store);assert.equal((f.store.db.prepare('SELECT COUNT(*) n FROM feed_publications').get() as {n:number}).n,0);
 } finally {await f.cleanup();}
});

test('a later render cannot publish out-of-window cached summaries or private archives',async()=>{
 const f=await fixture();try{
  save(f.store,[item('private'),item('other','two')]);await summarize(f.config,f.store,{},generator,at);
  const archived=item('archived');save(f.store,[archived]);
  f.store.db.prepare('INSERT INTO feed_archives VALUES (?,?,?,?,?,?,?,?)').run('one/2026-10/09/item-30.md','one','archived','2026-10-09',30,JSON.stringify(archived),'Private archive','私有归档');
  await summarize(f.config,f.store,{source:'one',since:'2026-10-10T00:00:00Z',until:'2026-10-11T00:00:00Z'},()=>{throw new Error('No candidates');},'2026-10-11T10:00:00Z');
  await writeSite(f.config,f.store,undefined,true);
  assert.deepEqual(acceptedItems(f.store).map(r=>r.item.id),['other']);assert.equal((f.store.db.prepare('SELECT COUNT(*) n FROM feed_publications').get() as {n:number}).n,1);
  await assert.rejects(stat(join(f.config.feed.directory,'one/2026-10/09/item-30.md')),{code:'ENOENT'});
  const reopened=new Store(f.config.storage.database);try{assert.deepEqual(acceptedItems(reopened).map(r=>r.item.id),['other']);assert.equal(await writeSite(f.config,reopened),false);}finally{reopened.close();}
 }finally{await f.cleanup();}
});

test('generated article removal excludes both languages by identity and is idempotent',async()=>{
 const f=await fixture();try{
  save(f.store,[item('invalid'),item('keep')]);await summarize(f.config,f.store,{},generator,at);await writeSite(f.config,f.store);
  const row=f.store.db.prepare("SELECT day,number FROM feed_item_paths WHERE id='invalid'").get() as {day:string;number:number};const path=itemPath('one',row.day,row.number);
  await maintainArchive(f.config,f.store,'remove','_translations/zh-CN/'+path);await writeSite(f.config,f.store);
  await assert.rejects(readFile(join(f.config.feed.directory,path)),/ENOENT/);await assert.rejects(readFile(join(f.config.feed.directory,'_translations/zh-CN',path)),/ENOENT/);
  await maintainArchive(f.config,f.store,'remove',path);await writeSite(f.config,f.store,undefined,true);
  assert.deepEqual(acceptedItems(f.store).map(r=>r.item.id),['keep']);
  assert.equal((f.store.db.prepare('SELECT COUNT(*) n FROM feed_publications').get() as {n:number}).n,2);
  assert.equal((f.store.db.prepare('SELECT COUNT(*) n FROM feed_summaries').get() as {n:number}).n,2);
  await assert.rejects(maintainArchive(f.config,f.store,'remove','../outside.md'),/Invalid archive path/);
 }finally{await f.cleanup();}
});

test('hidden topics preserve accepted labels but reject new assignments, synonyms and stale caches', async () => {
 const f=await fixture();
 try {
  const original=item('hidden');save(f.store,[original]);await summarize(f.config,f.store,{},generator,at);
  const revised={version:1 as const,topics:[{...topic,hidden:true},{...topic,id:'dev',name:{en:'Development','zh-CN':'开发'}}]};
  await applyTopics(f.config.feed.topics,revised);
  assert.equal((await summarize(f.config,f.store,{},()=>{throw new Error('Accepted history must remain');},at)).generated,0);
  await writeSite(f.config,f.store);
  assert.match(await readFile(join(f.config.feed.directory,itemPath('one','2026-10-09',1)),'utf8'),/topics\/coding/);
  for(const locale of ['','_translations/zh-CN/']){
   const manifest=JSON.parse(await readFile(join(f.config.feed.directory,locale+'_locale.yml'),'utf8'));
   assert.deepEqual(manifest.hidden_tags,['topics/coding']);assert.ok(manifest.tag_labels['topics/coding']);
  }
  const input={contractVersion:2 as const,topics:revised,items:[original]};
  const output={contractVersion:2,newTopics:[],items:[{source:'one',id:'hidden',topics:['coding'],en:{title:'Title',summary:'Facts'},'zh-CN':{title:'标题',summary:'事实'}}]};
  assert.throws(()=>validateArtifact(output,input),/hidden/);
  assert.throws(()=>validateArtifact({...output,newTopics:[{...topic,id:'other'}]},input),/Duplicate topic name/);
  assert.throws(()=>validateArtifact({...output,newTopics:[{...topic,id:'other',name:{en:'Other','zh-CN':'其他'},hidden:true}]},input),/visible topics/);
  const updated:Generator=async(...args)=>{const result=await generator(...args);result.output.items[0]!.topics=['dev'];return result;};
  save(f.store,[{...original,title:'Changed'}]);await summarize(f.config,f.store,{},updated,at);
  save(f.store,[original]);let calls=0;
  const result=await summarize(f.config,f.store,{},async(...args)=>{calls++;return updated(...args);},at);
  assert.equal(result.generated,1);assert.equal(calls,1);assert.deepEqual(acceptedItems(f.store)[0]!.copy.topics,['dev']);
 } finally {await f.cleanup();}
});

test('recovered artifacts cannot restore hidden topic policy or publish hidden assignments', async () => {
 const f=await fixture(),cancellation=new AbortController();
 try {
  save(f.store,[item('recover-hidden')]);
  await assert.rejects(summarize(f.config,f.store,{signal:cancellation.signal},async(...args)=>{
   const result=await generator(...args);await writeFile(join(args[3]!,'result.json'),JSON.stringify(result.output));
   cancellation.abort(new Error('Interrupted'));return result;
  },at),/Interrupted/);
  await applyTopics(f.config.feed.topics,{version:1,topics:[{...topic,hidden:true},{...topic,id:'dev',name:{en:'Development','zh-CN':'开发'}}]});
  let calls=0;
  await summarize(f.config,f.store,{},async(...args)=>{calls++;const result=await generator(...args);result.output.items[0]!.topics=['dev'];return result;},at);
  assert.equal(calls,1);assert.deepEqual(acceptedItems(f.store)[0]!.copy.topics,['dev']);
  assert.equal((await loadTopics(f.config.feed.topics)).topics[0]!.hidden,true);
  assert.equal((f.store.db.prepare("SELECT count(*) n FROM feed_batches WHERE state='interrupted'").get() as {n:number}).n,1);
 } finally {await f.cleanup();}
});
test('invalid summary cutoffs fail before touching the queue or archive snapshot', async () => {
 const f=await fixture();try{
  f.config.sources[0]!.selection={method:'hn-engagement',dailyLimit:50,updateDays:7};
  await mkdir(f.config.feed.directory);await writeFile(join(f.config.feed.directory,'notes.md'),'Retained archive');
  const before=f.store.db.prepare('SELECT total_changes() n').get();
  for(const since of ['not-a-date','']) await assert.rejects(summarize(f.config,f.store,{since},generator,at),/Invalid --since/);
  for(const options of [{until:at},{since:at,until:at},{since:at,until:'bad'},{since:at,observedDays:7},{since:at,until:'2026-10-10',observedDays:0},{since:at,until:'2026-10-10',observedDays:1.5}]) await assert.rejects(summarize(f.config,f.store,options,generator,at),/--until|--observed-days/);
  assert.deepEqual(f.store.db.prepare('SELECT total_changes() n').get(),before);
  assert.equal(f.store.meta('selection_archives'),undefined);
  assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_archive_files').get() as {n:number}).n,0);
 }finally{await f.cleanup();}
});

test('title-only podcast summaries put the evidence note immediately after frontmatter',()=>{
 const rendered=renderItem({item:item('episode','podcast'),copy:{source:'podcast',id:'episode',topics:[],en:{title:'Episode',summary:''},'zh-CN':{title:'单集',summary:''}},firstSeen:at,date:at,dateBasis:'published',updated:at},'en');
 assert.match(rendered,/\n---\n\nBased on episode show notes\.\n$/);
});

test('ISO week, ordinal and basic summary cutoffs normalize before selection-backed archive work', async () => {
 for(const since of ['2026-W40-1','2026-245','20261015']){
  const f=await fixture();try{
   f.config.sources[0]!.selection={method:'hn-engagement',dailyLimit:50,updateDays:7};
   await mkdir(f.config.feed.directory);await writeFile(join(f.config.feed.directory,'notes.md'),'Retained archive');
   const seen:string[]=[];
   save(f.store,[item('before','two',{publishedAt:'2026-01-01T00:00:00Z'}),item('after','two',{publishedAt:'2026-10-16T00:00:00Z'})]);
   await summarize(f.config,f.store,{since},async(...args)=>{seen.push(...args[1].items.map(i=>i.id));return generator(...args);},'2026-10-16T12:00:00.000Z');
   assert.deepEqual(seen,['after']);assert.equal(f.store.meta('selection_archives'),'1');
   assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_archive_files').get() as {n:number}).n,1);
  }finally{await f.cleanup();}
 }
});

test('a summary generator losing its lease reports ownership loss without queue backoff',async()=>{
 const f=await fixture();try{
  save(f.store,[item('one')]);f.store.acquireLease('runner');
  await assert.rejects(summarize(f.config,f.store,{},async()=>{
   f.store.db.prepare("UPDATE job_lease SET owner='replacement'").run();throw new Error('Transport interrupted during takeover');
  },at),/Lost database job lease/);
  const job=f.store.db.prepare('SELECT attempts,next_at,error FROM feed_jobs').get() as {attempts:number;next_at:string;error:string|null};
  assert.equal(job.attempts,1);assert.equal(job.next_at,'');assert.equal(job.error,null);
 }finally{await f.cleanup();}
});

test('a since-scoped podcast rebuild preserves other episodes reduction caches',async()=>{
 const f=await fixture();try{
  f.config.sources=[{...f.config.sources[0]!,id:'podcast',name:'Podcasts'}];
  const body='Complete episode evidence including its ending.';
  const episodes=['old','recent'].map(id=>item(id,'podcast',{publishedAt:id==='old'?'2026-10-08T00:00:00Z':at,metadata:{transcriptHash:hash(body),summaryBasis:'transcript'}}));
  const reduce:TaskGenerator=async(_a,_k,value,_r,directory)=>{
   const input=value as {taskId:string;parts:{id:string}[]};
   return {output:{taskId:input.taskId,inputIds:input.parts.map(p=>p.id),facts:'Complete episode evidence.'},directory:directory!,events:[],usage:[]};
  };
  for(const episode of episodes){
   f.store.db.prepare('INSERT INTO podcast_transcripts VALUES (?,?,?,?,?,?)').run('podcast',episode.id,body,hash(body),'https://example.test/transcript',at);
   for(let i=0;i<3;i++) if((await transcriptStep(episode,f.store,f.config.agent,true,undefined,false,reduce)).ready) break;
  }
  save(f.store,episodes);await summarize(f.config,f.store,{},generator,at,async i=>i);
  const before=episodes.map(episode=>f.store.db.prepare('SELECT data FROM feed_jobs WHERE id=?').get(episode.id) as {data:string});
  f.config.agent.maxDailyCalls=3;
  const result=await summarize(f.config,f.store,{rebuild:true,since:'2026-10-09T00:00:00Z'},generator,at,async i=>i);
  assert.equal(result.deferred,true);
  assert.deepEqual(f.store.db.prepare('SELECT data FROM feed_jobs WHERE id=?').get('old'),before[0]);
  const recent=JSON.parse((f.store.db.prepare('SELECT data FROM feed_jobs WHERE id=?').get('recent') as {data:string}).data).item as Item;
  assert.notEqual(recent.metadata?.transcriptRecipe,JSON.parse(before[1]!.data).item.metadata.transcriptRecipe);
  assert.equal((await transcriptStep(episodes[0]!,f.store,f.config.agent,false)).ready,true);
  assert.equal((await transcriptStep(episodes[1]!,f.store,f.config.agent,false)).ready,false);
 }finally{await f.cleanup();}
});

test('a quota-deferred transcript does not prevent another source from accepting a cached summary', async () => {
 const f=await fixture();try{
  save(f.store,[item('cached')]);await summarize(f.config,f.store,{source:'one'},generator,at);
  f.store.db.exec("DELETE FROM feed_summaries; DELETE FROM feed_jobs;");
  f.config.agent.maxDailyCalls=1;
  f.config.sources=[{...f.config.sources[0]!,id:'podcast',name:'Podcasts'},f.config.sources[0]!];
  f.store.setMeta('round_robin','one');
  save(f.store,[item('aaa-uncached')]);
  const body='A complete spoken transcript with concrete evidence.';
  f.store.db.prepare('INSERT INTO podcast_transcripts VALUES (?,?,?,?,?,?)').run('podcast','episode',body,hash(body),'https://example.test/transcript',at);
  save(f.store,[item('episode','podcast',{metadata:{transcriptHash:hash(body),summaryBasis:'transcript'}})]);
  const result=await summarize(f.config,f.store,{},async()=>{throw new Error('No paid call is available');},at,async value=>value);
  assert.equal(result.deferred,true);assert.equal(result.generated,1);
  assert.equal(acceptedItems(f.store)[0]?.item.id,'cached');
  assert.equal((f.store.db.prepare('SELECT count(*) n FROM agent_calls').get() as {n:number}).n,1);
 }finally{await f.cleanup();}
});
test('all eligible items enter persistent per-source FIFO and round-robin batches with a complete input budget',async()=>{
 const f=await fixture();const order:string[]=[];
 try {save(f.store,Array.from({length:24},(_,i)=>item(String(i).padStart(2,'0'),i<12?'one':'two')));
 const result=await summarize(f.config,f.store,{},async(...args)=>{order.push(args[1].items[0]!.source);assert.ok(JSON.stringify(args[1]).length<=24000);return generator(...args);},at);
 assert.equal(result.generated,24);assert.deepEqual(order,['one','two','one','two']);assert.equal(acceptedItems(f.store).length,24);
 }finally{await f.cleanup();}
});

test('an explicit since instant limits summary work without deleting older queued jobs', async () => {
 const f=await fixture();
 try {
  save(f.store,[item('old','one',{publishedAt:'2026-10-08T15:59:59Z'}),item('today','one',{publishedAt:'2026-10-08T16:00:00Z'})]);
  f.store.db.prepare("INSERT INTO feed_jobs VALUES (?,?,?,?, 'pending',0,'',NULL)").run('one','old','old-key',JSON.stringify({item:item('old','one',{publishedAt:'2026-10-08T15:59:59Z'}),firstSeen:at}));
  const seen:string[]=[];
  await summarize(f.config,f.store,{since:'2026-10-09T00:00:00+08:00'},async(...args)=>{seen.push(...args[1].items.map(i=>i.id));return generator(...args);},at);
  assert.deepEqual(seen,['today']);
  assert.equal((f.store.db.prepare('SELECT state FROM feed_jobs WHERE id=?').get('old') as {state:string}).state,'pending');
 } finally {await f.cleanup();}
});
test('an oversized item fails without a model call or blocking following items, and can be retried with a larger budget', async () => {
 const f=await fixture();
 try {
  f.config.agent.maxInputChars=4000;save(f.store,[item('a-large','one',{text:'x'.repeat(3900)}),item('z-small')]);let calls=0;
  const gen:Generator=async(...args)=>{calls++;return generator(...args);};
  const result=await summarize(f.config,f.store,{},gen,at);
  assert.equal(result.generated,1);assert.equal(result.failed,1);assert.equal(calls,1);
  const failed=f.store.db.prepare('SELECT state,attempts,error FROM feed_jobs WHERE id=?').get('a-large') as {state:string;attempts:number;error:string};
  assert.equal(failed.state,'failed');assert.equal(failed.attempts,0);assert.match(failed.error,/maxInputChars.*maxItemChars/);
  f.config.agent.maxInputChars=8000;assert.equal((await summarize(f.config,f.store,{retryFailed:true},gen,at)).generated,1);
  assert.equal(calls,2);
 } finally {await f.cleanup();}
});
test('an oversized registry fails before enrichment or queue mutations with measured budget guidance', async () => {
 const f=await fixture();
 try {
  f.config.agent.maxInputChars=4000;
  await writeFile(f.config.feed.topics,JSON.stringify({version:1,topics:[topic,...Array.from({length:20},(_,i)=>({...topic,id:'large-'+i,name:{en:'Large '+i,'zh-CN':'大主题 '+i},description:'x'.repeat(400)}))]}));
  save(f.store,[item('one')]);let prepared=0;
  await assert.rejects(summarize(f.config,f.store,{},generator,at,async row=>{prepared++;return row;}),/Topic registry uses \d+.*maxInputChars/);
  assert.equal(prepared,0);assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_jobs').get() as {n:number}).n,0);
 } finally {await f.cleanup();}
});
test('native ID path safety and source-aware cache; metadata updates reuse copy, changed text regenerates',async()=>{
 const f=await fixture();let calls=0;const gen:Generator=async(...args)=>{calls++;return generator(...args);};
 try{save(f.store,[item('../../a','one'),item('../../a','two')]);await summarize(f.config,f.store,{},gen,at);assert.equal(calls,2);assert.notEqual(itemPath('one','2026-10-09',1),itemPath('two','2026-10-09',1));assert.equal(itemPath('one','2026-10-09',1),'one/2026-10/09/item-1.md');assert.throws(()=>itemPath('../one','2026-10-09',1));
 save(f.store,[item('../../a','one',{url:'https://example.test/new',metrics:{score:100}})]);await summarize(f.config,f.store,{},gen,at);assert.equal(calls,2);assert.equal(acceptedItems(f.store).find(r=>r.item.source==='one')?.item.url,'https://example.test/new');
 save(f.store,[item('../../a','one',{text:'New facts'})]);await summarize(f.config,f.store,{},gen,at);assert.equal(calls,3);
 await writeSite(f.config,f.store);const en=await readFile(join(f.config.feed.directory,itemPath('one','2026-10-09',1)),'utf8'),zh=await readFile(join(f.config.feed.directory,'_translations/zh-CN',itemPath('one','2026-10-09',1)),'utf8');assert.match(en,/source_url: "https:\/\/example.test\//);assert.match(en,/topics\/coding/);assert.match(zh,/source\/one/);
 }finally{await f.cleanup();}
});
test('source navigation pages survive subsequent publication renders after archive import', async () => {
 const f=await fixture();
 try {
  for (const id of ['podcast','github','arxiv']) f.config.sources.push({...f.config.sources[0]!,id,name:id,enabled:false});
  f.store.setMeta('selection_archives','1');
  await writeSite(f.config,f.store);
  const paths=['podcast/index.md','_translations/zh-CN/podcast/index.md','github/index.md','_translations/zh-CN/github/index.md','arxiv/index.md','_translations/zh-CN/arxiv/index.md'];
  const before=await Promise.all(paths.map(path=>readFile(join(f.config.feed.directory,path),'utf8')));
  assert.match(before[0]!,/"id":"podcasts","order":10/);
  assert.match(before[1]!,/title: "播客"/);
  const locale=JSON.parse(await readFile(join(f.config.feed.directory,'_translations/zh-CN/_locale.yml'),'utf8'));
  assert.equal(locale.tag_labels['source/podcast'],'播客');
  assert.match(before[2]!,/"id":"github","order":12/);
  assert.match(before[3]!,/title: "GitHub"/);
  assert.match(before[4]!,/"id":"arxiv","order":14/);
  assert.match(before[5]!,/title: "arXiv"/);
  for (const index of [0,2,4]) assert.match(before[index]!,/"layout":"archive"/);
  for (const index of [1,3,5]) assert.doesNotMatch(before[index]!,/"layout":/);
  f.store.setMeta('content_version','2');
  await writeSite(f.config,f.store);
  assert.deepEqual(await Promise.all(paths.map(path=>readFile(join(f.config.feed.directory,path),'utf8'))),before);
 } finally {await f.cleanup();}
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
test('tool JSON repair feedback tolerates provider wording while preserving other errors', () => {
 for (const error of [
  'ACP generate: DeepSeek Messages stream: tool input is invalid JSON',
  'Provider rejected TOOL ARGUMENTS: malformed JSON',
  'A tool-call failed because JSON was invalid',
 ]) {
  assert.match(artifactRepairFeedback(error), /escape quotes and line breaks/);
  assert.match(artifactRepairFeedback(error), /structured object directly/);
 }
 for (const error of ['Tool input exceeds limit', 'Invalid JSON in HTTP response', 'MANUAL_ACTION: Missing credentials', 'Transport disconnected', 'x'.repeat(1500)]) {
  assert.equal(artifactRepairFeedback(error), error.slice(0, 1000));
 }
});
test('a persisted provider JSON failure receives actionable format feedback on the next bounded retry', async () => {
 const f=await fixture();
 try {
  save(f.store,[item('format')]);
  await summarize(f.config,f.store,{},async()=>{throw new Error('ACP generate: DeepSeek Messages stream: tool input is invalid JSON');},at);
  assert.equal(acceptedItems(f.store).length,0);
  const result=await summarize(f.config,f.store,{},async(...args)=>{
   assert.match(args[2]??'',/tool input is invalid JSON/);
   assert.match(artifactRepairFeedback(args[2]!),/escape quotes and line breaks/);assert.match(artifactRepairFeedback(args[2]!),/structured object directly/);
   return generator(...args);
  },new Date(Date.parse(at)+20*60_000).toISOString());
  assert.equal(result.generated,1);assert.equal(result.pending,0);
  assert.equal((f.store.db.prepare('SELECT count(*) n FROM agent_calls').get() as {n:number}).n,2);
 } finally {await f.cleanup();}
});
test('topic additions do not invalidate accepted summaries; deprecation remaps output and aliases',async()=>{
 const f=await fixture();try{save(f.store,[item('a')]);await summarize(f.config,f.store,{},generator,at);
 const next={version:1 as const,topics:[{...topic,deprecated:true,replacedBy:'dev'}, {...topic,id:'dev',name:{en:'Development','zh-CN':'开发'}}]};await applyTopics(f.config.feed.topics,next);
 await summarize(f.config,f.store,{},()=>{throw new Error('Should reuse');},at);await writeSite(f.config,f.store);
 assert.match(await readFile(join(f.config.feed.directory,itemPath('one','2026-10-09',1)),'utf8'),/topics\/dev/);assert.match(await readFile(join(f.config.feed.directory,'_locale.yml'),'utf8'),/"topics\/coding": "topics\/dev"/);
 assert.throws(()=>validateRegistry({version:1,topics:[topic,{...topic,id:'duplicate'}]}),/Duplicate/);
 await assert.rejects(applyTopics(f.config.feed.topics,{version:1,topics:[]} ),/cannot be removed/);
 }finally{await f.cleanup();}
});
test('A to B to A source revisions evict deprecated cached topics and let the source queue progress', async () => {
 const f=await fixture();
 try {
  f.config.agent.maxBatchItems=1;
  const original=item('oscillating');save(f.store,[original]);
  await summarize(f.config,f.store,{},generator,at);
  const originalKey=(f.store.db.prepare('SELECT cache_key FROM feed_jobs WHERE id=?').get(original.id) as {cache_key:string}).cache_key;
  await applyTopics(f.config.feed.topics,{version:1,topics:[{...topic,deprecated:true,replacedBy:'dev'},{...topic,id:'dev',name:{en:'Development','zh-CN':'开发'}}]});
  const updated:Generator=async(...args)=>{const result=await generator(...args);for(const copy of result.output.items)copy.topics=['dev'];return result;};
  save(f.store,[{...original,title:'Changed title'}]);await summarize(f.config,f.store,{},updated,at);
  save(f.store,[original,item('following')]);let calls=0;
  const result=await summarize(f.config,f.store,{},async(...args)=>{calls++;return updated(...args);},at);
  assert.equal(result.generated,2);assert.equal(result.pending,0);assert.equal(result.failed,0);assert.equal(calls,2);
  const cached=f.store.db.prepare('SELECT copy FROM feed_cache WHERE key=?').get(originalKey) as {copy:string};
  assert.deepEqual(JSON.parse(cached.copy).topics,['dev']);
  assert.equal(acceptedItems(f.store).length,2);
 } finally {await f.cleanup();}
});
test('valid cache reuse spends no model call, while malformed cached JSON regenerates normally', async () => {
 const f=await fixture();
 try {
  const original=item('cached');save(f.store,[original]);await summarize(f.config,f.store,{},generator,at);
  const originalKey=(f.store.db.prepare('SELECT cache_key FROM feed_jobs WHERE id=?').get(original.id) as {cache_key:string}).cache_key;
  save(f.store,[{...original,title:'Changed title'}]);await summarize(f.config,f.store,{},generator,at);
  save(f.store,[original]);const before=(f.store.db.prepare('SELECT count(*) n FROM agent_calls').get() as {n:number}).n;
  assert.equal((await summarize(f.config,f.store,{},()=>{throw new Error('Valid cache must be reused');},at)).generated,1);
  assert.equal((f.store.db.prepare('SELECT count(*) n FROM agent_calls').get() as {n:number}).n,before);
  save(f.store,[{...original,title:'Changed title'}]);await summarize(f.config,f.store,{},generator,at);
  f.store.db.prepare('UPDATE feed_cache SET copy=? WHERE key=?').run('{invalid JSON',originalKey);
  save(f.store,[original]);assert.equal((await summarize(f.config,f.store,{},generator,at)).generated,1);
 } finally {await f.cleanup();}
});
test('an invalid cache obeys quota deferral and the five paid-attempt cap while retaining the accepted snapshot', async () => {
 const f=await fixture();
 try {
  const original=item('bounded-cache');save(f.store,[original]);await summarize(f.config,f.store,{},generator,at);
  const key=(f.store.db.prepare('SELECT cache_key FROM feed_jobs WHERE id=?').get(original.id) as {cache_key:string}).cache_key;
  const revised={...original,title:'Changed title'};save(f.store,[revised]);await summarize(f.config,f.store,{},generator,at);
  f.store.db.prepare('UPDATE feed_cache SET copy=? WHERE key=?').run('{broken',key);save(f.store,[original]);
  f.config.agent.maxDailyCalls=2;
  assert.equal((await summarize(f.config,f.store,{},()=>{throw new Error('Quota must defer without generating');},at)).deferred,true);
  assert.equal(f.store.db.prepare('SELECT copy FROM feed_cache WHERE key=?').get(key),undefined);
  assert.equal((f.store.db.prepare('SELECT attempts FROM feed_jobs').get() as {attempts:number}).attempts,0);
  f.config.agent.maxDailyCalls=80;let calls=0;
  const invalid:Generator=async(...args)=>{calls++;const result=await generator(...args);result.output.items[0]!.topics=['missing'];return result;};
  for(let visit=0;visit<3;visit++)await summarize(f.config,f.store,{},invalid,new Date(Date.parse(at)+visit*7*3600_000).toISOString());
  assert.deepEqual(f.store.db.prepare('SELECT state,attempts FROM feed_jobs').get(),{state:'failed',attempts:5});assert.equal(calls,5);
  assert.equal(acceptedItems(f.store)[0]!.copy.en.title,revised.title);
  await summarize(f.config,f.store,{retryFailed:true},generator,new Date(Date.parse(at)+30*3600_000).toISOString());
  assert.equal(acceptedItems(f.store)[0]!.copy.en.title,original.title);
 } finally {await f.cleanup();}
});
test('topic file is durable before accepted DB commit, and saved artifact recovers without another call',async()=>{
 const f=await fixture();try{save(f.store,[item('a')]);f.store.db.exec("CREATE TRIGGER reject_accept BEFORE INSERT ON feed_summaries BEGIN SELECT RAISE(FAIL,'simulated crash'); END;");
 await assert.rejects(summarize(f.config,f.store,{},async(...args)=>{const result=await generator(...args);result.output.newTopics=[{...topic,id:'models',name:{en:'Models','zh-CN':'模型'}}];result.output.items[0]!.topics=['models'];return result;},at),/simulated crash/);
 assert.ok((await loadTopics(f.config.feed.topics)).topics.some(t=>t.id==='models'));assert.equal(acceptedItems(f.store).length,0);f.store.db.exec('DROP TRIGGER reject_accept');
 await summarize(f.config,f.store,{},()=>{throw new Error('Must replay artifact');},at);assert.equal(acceptedItems(f.store).length,1);
 }finally{await f.cleanup();}
});
test('retention prunes only expired runner-owned terminal workspaces and preserves legacy and active evidence', async () => {
 const f=await fixture();
 try {
  save(f.store,[item('retention')]);await summarize(f.config,f.store,{},generator,at);
  const batch=f.store.db.prepare('SELECT id,workspace FROM feed_batches').get() as {id:string;workspace:string};
  const legacy=join(f.config.agent.runtimeDirectory,'task-legacy');await mkdir(legacy);await writeFile(join(legacy,'audit.json'),'historical evidence');
  const external=join(f.root,'external-evidence');await mkdir(external);await writeFile(join(external,'keep'),'evidence');
  const linked=join(f.config.agent.runtimeDirectory,'task-00000000-0000-0000-0000-000000000000');await symlink(external,linked,process.platform==='win32'?'junction':'dir');
  f.store.db.prepare('INSERT INTO feed_batches VALUES (?,?,?,?,?,?,NULL)').run('linked','{}','[]',linked,'accepted',at);
  f.store.db.prepare("UPDATE feed_batches SET state='running' WHERE id=?").run(batch.id);
  const later='2026-11-01T00:00:00.000Z';await pruneWorkspaces(f.config.agent,f.store,later);
  assert.ok(await stat(batch.workspace));
  f.store.db.prepare("UPDATE feed_batches SET state='accepted' WHERE id=?").run(batch.id);
  await summarize(f.config,f.store,{},generator,later);
  await assert.rejects(stat(batch.workspace),{code:'ENOENT'});
  assert.equal(await readFile(join(legacy,'audit.json'),'utf8'),'historical evidence');
  assert.equal(await readFile(join(external,'keep'),'utf8'),'evidence');
  assert.equal(acceptedItems(f.store).length,1);
 } finally {await f.cleanup();}
});
test('expired deferred workspaces can be pruned without deleting queued jobs or batch evidence', async () => {
 const f=await fixture();
 try {
  save(f.store,[item('deferred')]);f.config.agent.maxDailyCalls=1;
  f.store.startCall('spent','model',1);
  assert.equal((await summarize(f.config,f.store,{},()=>{throw new Error('Quota should defer');},at)).deferred,true);
  const batch=f.store.db.prepare('SELECT * FROM feed_batches').get() as {id:string;workspace:string;input:string;jobs:string};
  const jobs=f.store.db.prepare('SELECT * FROM feed_jobs').all();
  await pruneWorkspaces(f.config.agent,f.store,at);assert.ok(await stat(batch.workspace));
  await pruneWorkspaces(f.config.agent,f.store,'2026-11-01T00:00:00.000Z');
  await assert.rejects(stat(batch.workspace),{code:'ENOENT'});
  assert.deepEqual(f.store.db.prepare('SELECT * FROM feed_jobs').all(),jobs);
  assert.deepEqual(f.store.db.prepare('SELECT state,workspace,input,jobs FROM feed_batches WHERE id=?').get(batch.id),{state:'deferred',workspace:'',input:batch.input,jobs:batch.jobs});
 } finally {await f.cleanup();}
});

test('pending batch selection uses an ordered index and preserves first-seen order', async () => {
 const f=await fixture();
 try {
  const prepare=f.store.db.prepare.bind(f.store.db);let queuedSQL='';
  f.store.db.prepare=((sql:string)=>{if(sql.includes('INDEXED BY feed_jobs_pending_order'))queuedSQL=sql;return prepare(sql);}) as typeof f.store.db.prepare;
  const rows=Array.from({length:120},(_,i)=>item(String(119-i).padStart(3,'0'),'one',{observedAt:new Date(Date.parse(at)+(i%3)*1000).toISOString()}));
  save(f.store,rows);const order:string[]=[];
  await summarize(f.config,f.store,{},async(...args)=>{order.push(...args[1].items.map(item=>item.id));return generator(...args);},at);
  assert.deepEqual(order,rows.toSorted((a,b)=>a.observedAt.localeCompare(b.observedAt)||a.id.localeCompare(b.id)).map(item=>item.id));
  const parameters=itemWindowSql('item','firstSeen',resolveItemWindow({},'1970-01-01T00:00:00.000Z',at)).parameters;
  const plan=prepare('EXPLAIN QUERY PLAN '+queuedSQL).all('one',at,...parameters,'[]') as {detail:string}[];
  assert.ok(plan.some(row=>row.detail.includes('feed_jobs_pending_order')),JSON.stringify(plan));
  assert.ok(!plan.some(row=>row.detail.includes('TEMP B-TREE')),JSON.stringify(plan));
 } finally {await f.cleanup();}
});
test('canonical topic editing during an agent call stops without a dangling public reference',async()=>{
 const f=await fixture();try{save(f.store,[item('a')]);await assert.rejects(summarize(f.config,f.store,{},async(...args)=>{await writeFile(f.config.feed.topics,JSON.stringify({version:1,topics:[]}));return generator(...args);},at),/cannot be removed|Unknown|changed|topic/i);assert.equal(acceptedItems(f.store).length,0);
 }finally{await f.cleanup();}
});
test('lease takeover immediately before acceptance retains the artifact without accepting topics or copy', async () => {
 const f=await fixture();let successor:Store|undefined;
 try {
  f.store.acquireLease('original');save(f.store,[item('lease')]);
  await assert.rejects(summarize(f.config,f.store,{},async(...args)=>{
   const result=await generator(...args);
   result.output.newTopics=[{...topic,id:'new-topic',name:{en:'New topic','zh-CN':'新主题'}}];
   f.store.db.prepare('UPDATE job_lease SET expires=?').run('1970-01-01T00:00:00.000Z');
   successor=new Store(f.config.storage.database);successor.acquireLease('successor');
   return result;
  },at),/Lost database job lease/);
  assert.equal(acceptedItems(f.store).length,0);assert.equal((await loadTopics(f.config.feed.topics)).topics.length,1);
  assert.equal((f.store.db.prepare('SELECT owner FROM job_lease').get() as {owner:string}).owner,'successor');
  const batch=f.store.db.prepare("SELECT workspace FROM feed_batches WHERE state='running'").get() as {workspace:string};
  assert.ok(JSON.parse(await readFile(join(batch.workspace,'result.json'),'utf8')));
  assert.equal((await summarize(f.config,successor!,{},()=>{throw new Error('Saved artifact should recover');},at)).generated,1);
 } finally {successor?.close();await f.cleanup();}
});
test('an expired lease cannot be resurrected by its previous owner', async () => {
 const f=await fixture();
 try {
  f.store.acquireLease('expired');f.store.db.prepare('UPDATE job_lease SET expires=?').run('1970-01-01T00:00:00.000Z');
  assert.throws(()=>f.store.renewLease('expired'),/Lost database job lease/);
 } finally {await f.cleanup();}
});
test('cutoff uses Shanghai midnight as one instant; source dates and undated first observations are stable',()=>{
 assert.equal(date('2026-10-09','Asia/Shanghai'),'2026-10-08T16:00:00.000Z');assert.equal(date('2026-10-09','America/Los_Angeles'),'2026-10-09T07:00:00.000Z');assert.equal(date('2026-10-09T00:00:00-07:00','Asia/Shanghai'),'2026-10-09T07:00:00.000Z');assert.equal(date('2026-10-09 00:30:00','Asia/Shanghai'),'2026-10-08T16:30:00.000Z');
 const source=configSchema.parse({version:2,agent:{model:'deepseek/deepseek-flash'},sources:[{id:'one',name:'One',intervalHours:1,streams:[{id:'main',channels:[{id:'rss',kind:'feed'}]}]}]}).sources[0]!;
 assert.equal(eligible(item('a','one',{publishedAt:'2026-10-08T15:59:00.000Z'}),at,'2026-10-08T16:00:00.000Z',source),false);
 assert.equal(eligible(item('a','one',{basis:'observed'}),'2026-10-08T15:00:00.000Z','2026-10-08T16:00:00.000Z',source),false);
 const sampled=parseFollowBuilders(JSON.stringify({generatedAt:at,x:[{handle:'main',tweets:[{id:'1',text:'Undated sample'}]}]}),{source:'x',stream:'main',channel:'sample',observedAt:'2026-10-10T00:00:00.000Z'});assert.equal(sampled.items[0]?.basis,'observed');assert.equal(sampled.items[0]?.publishedAt,'2026-10-10T00:00:00.000Z');
});
test('bounded planning uses the current publication date after a source correction',async()=>{
 const f=await fixture();try{
  const cutoff='2026-10-08T16:00:00.000Z',old='2026-10-01T00:00:00.000Z';f.store.setMeta('cutoff',cutoff);
  save(f.store,[item('corrected','one',{publishedAt:old,observedAt:old})]);
  save(f.store,[item('corrected','one',{publishedAt:at})]);
  const row=f.store.db.prepare('SELECT published_at,first_seen FROM items WHERE source=? AND id=?').get('one','corrected') as {published_at:string;first_seen:string};
  assert.equal(row.published_at,at);assert.equal(row.first_seen,old);
  assert.equal(f.store.items('one',cutoff,'2026-10-10T00:00:00.000Z').length,1);
  assert.equal(f.store.items('one',old,cutoff).length,0);
  const result=await summarize(f.config,f.store,{},generator,at);assert.equal(result.generated,1);
  assert.equal(acceptedItems(f.store)[0]!.date,at);
 }finally{await f.cleanup();}
});
test('legacy stale date indexes reconcile once without changing first observation or historical versions', async () => {
 const f=await fixture();
 try {
  save(f.store,[item('date')]);
  f.store.db.prepare('UPDATE items SET published_at=? WHERE id=?').run('2026-01-01T00:00:00.000Z','date');
  f.store.db.prepare('DELETE FROM feed_meta WHERE key=?').run('items_date_revision');
  const first=f.store.db.prepare('SELECT first_seen,data FROM items').get(),versions=f.store.db.prepare('SELECT * FROM item_versions').all();
  const reopened=new Store(f.config.storage.database);
  try {
   assert.equal(reopened.items('one',at,'2026-10-10T00:00:00.000Z').length,1);
   assert.deepEqual(reopened.db.prepare('SELECT first_seen,data FROM items').get(),first);
   assert.deepEqual(reopened.db.prepare('SELECT * FROM item_versions').all(),versions);
   assert.equal(reopened.meta('items_date_revision'),'1');
  } finally {reopened.close();}
 } finally {await f.cleanup();}
});
for(const legacy of [false,true]) test(legacy?'legacy content journals recover every swap phase without a publication field':'content journal records publications only when the new tree is installed',async()=>{
 for(const phase of ['prepared','between-renames','installed','rollback']) {
  const f=await fixture();try{
   const staging=join(f.root,'.content-stage-test'),previous=join(f.root,'content.previous-test');
   if(phase==='prepared'||phase==='installed') {await mkdir(f.config.feed.directory,{recursive:true});await writeFile(join(f.config.feed.directory,'index.md'),phase==='installed'?'new':'old');}
   if(phase==='prepared'||phase==='between-renames') {await mkdir(staging);await writeFile(join(staging,'index.md'),'new');}
   if(phase!=='prepared') {await mkdir(previous);await writeFile(join(previous,'index.md'),'old');}
   await writeFile(join(f.root,'content-journal.json'),JSON.stringify({destination:f.config.feed.directory,staging,previous,...(legacy?{}:{publications:[['one','a']]})}));
   await recoverContent(f.config,f.store);
   const installed=phase==='between-renames'||phase==='installed';
   assert.equal(await readFile(join(f.config.feed.directory,'index.md'),'utf8'),installed?'new':'old');
   assert.equal(!!f.store.db.prepare("SELECT 1 FROM feed_publications WHERE source='one' AND id='a'").get(),!legacy&&installed);
   await assert.rejects(readFile(join(f.root,'content-journal.json')));
   await recoverContent(f.config,f.store);
  }finally{await f.cleanup();}
 }
});
test('three-way topic merge admits independent additions and rejects same-ID conflicts and unmanaged publication paths',()=>{
 const b=registry,l={version:1 as const,topics:[topic,{...topic,id:'models',name:{en:'Models','zh-CN':'模型'}}]},r={version:1 as const,topics:[topic,{...topic,id:'research',name:{en:'Research','zh-CN':'研究'}}]};assert.equal(mergeTopics(b,l,r).topics.length,3);
 assert.throws(()=>mergeTopics(b,{...b,topics:[{...topic,description:'Local'}]},{...b,topics:[{...topic,description:'Remote'}]}),/coding/);
 assertManagedPaths(['content/one/2026-10/09/item-1.md','config/topics.json']);assert.throws(()=>assertManagedPaths(['README.md']));assert.throws(()=>assertManagedPaths(['reports/old.md']));assertManagedPaths(['reports/old.md'],['reports/old.md']);
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

test('paged planning preserves every FIFO identity across page boundaries and interleaves lease writes with rendering', async () => {
 const f=await fixture();
 try {
  const records=Array.from({length:270},(_,i)=>item(String(i).padStart(4,'0'),i<135?'one':'two'));
  save(f.store,records);
  f.store.db.prepare('INSERT INTO feed_excluded VALUES (?,?)').run('one','0001');
  const result=await summarize(f.config,f.store,{},generator,at);
  assert.equal(result.generated,269);
  const actual=[];f.store.acquireLease('reader');
  for(const record of iterateAcceptedItems(f.store)) { actual.push([record.item.source,record.item.id]);f.store.renewLease('reader'); }
  assert.deepEqual(actual,records.filter(record=>record.id!=='0001').map(record=>[record.source,record.id]));
  // No-op ready jobs must not rewrite accepted copies.
  f.store.db.exec("CREATE TRIGGER reject_rewrite BEFORE UPDATE ON feed_summaries BEGIN SELECT RAISE(FAIL,'unexpected ready rewrite'); END;");
  assert.equal((await summarize(f.config,f.store,{},()=>{throw new Error('unexpected model call');},at)).generated,0);
  await writeSite(f.config,f.store);
  assert.match(await readFile(join(f.config.feed.directory,itemPath('two','2026-10-09',135)),'utf8'),/Title 0269/);
 } finally {await f.cleanup();}
});

test('cancellation refuses acceptance and recovers an already saved artifact without another model call', async () => {
 const f=await fixture(), cancellation=new AbortController(), reason=new Error('Lost database job lease');
 try {
  save(f.store,[item('cancelled')]);
  await assert.rejects(summarize(f.config,f.store,{signal:cancellation.signal},async(...args)=>{
   const result=await generator(...args);
   await writeFile(join(args[3]!,'result.json'),JSON.stringify(result.output));
   cancellation.abort(reason);return result;
  },at),error=>error===reason);
  assert.equal(acceptedItems(f.store).length,0);
  assert.deepEqual(await loadTopics(f.config.feed.topics),registry);
  assert.equal((await summarize(f.config,f.store,{},()=>{throw new Error('Must replay saved artifact');},at)).generated,1);
 } finally {await f.cleanup();}
});
