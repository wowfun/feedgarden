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
test('invalid summary cutoffs fail before touching the queue or archive snapshot', async () => {
 const f=await fixture();try{
  f.config.sources[0]!.selection={method:'hn-engagement',dailyLimit:50,updateDays:7};
  await mkdir(f.config.feed.directory);await writeFile(join(f.config.feed.directory,'notes.md'),'Retained archive');
  const before=f.store.db.prepare('SELECT total_changes() n').get();
  for(const since of ['not-a-date','']) await assert.rejects(summarize(f.config,f.store,{since},generator,at),/Invalid --since/);
  assert.deepEqual(f.store.db.prepare('SELECT total_changes() n').get(),before);
  assert.equal(f.store.meta('selection_archives'),undefined);
  assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_archive_files').get() as {n:number}).n,0);
 }finally{await f.cleanup();}
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
  f.store.db.prepare=((sql:string)=>{if(sql.includes("ORDER BY json_extract(data,'$.firstSeen')"))queuedSQL=sql;return prepare(sql);}) as typeof f.store.db.prepare;
  const rows=Array.from({length:120},(_,i)=>item(String(119-i).padStart(3,'0'),'one',{observedAt:new Date(Date.parse(at)+(i%3)*1000).toISOString()}));
  save(f.store,rows);const order:string[]=[];
  await summarize(f.config,f.store,{},async(...args)=>{order.push(...args[1].items.map(item=>item.id));return generator(...args);},at);
  assert.deepEqual(order,rows.toSorted((a,b)=>a.observedAt.localeCompare(b.observedAt)||a.id.localeCompare(b.id)).map(item=>item.id));
  const plan=prepare('EXPLAIN QUERY PLAN '+queuedSQL).all('one',at,'1970-01-01T00:00:00.000Z',10) as {detail:string}[];
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
test('content journal recovers the staged tree between its two renames',async()=>{
 const f=await fixture();try{const staging=join(f.root,'.content-stage-test'),previous=join(f.root,'content.previous-test');await mkdir(staging);await writeFile(join(staging,'index.md'),'new');await mkdir(previous);await writeFile(join(previous,'index.md'),'old');await writeFile(join(f.root,'content-journal.json'),JSON.stringify({destination:f.config.feed.directory,staging,previous}));await recoverContent(f.config);assert.equal(await readFile(join(f.config.feed.directory,'index.md'),'utf8'),'new');await assert.rejects(readFile(join(f.root,'content-journal.json')));
 }finally{await f.cleanup();}
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
