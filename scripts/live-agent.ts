import assert from 'node:assert/strict';
import { writeFile, cp, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { configSchema } from '../src/config.js';
import { Store } from '../src/store.js';
import { collect } from '../src/collect.js';
import { summarize, acceptedItems } from '../src/items.js';
import { writeSite } from '../src/site.js';
import { loadTopics } from '../src/topics.js';
const root=resolve('.local/notes/1009/live-'+Date.now()); await mkdir(root,{recursive:true,mode:0o700});
await cp('config/topics.json',join(root,'topics.json'));
const config=configSchema.parse({version:2,storage:{directory:root,database:join(root,'data.sqlite')},feed:{directory:join(root,'content'),topics:join(root,'topics.json')},agent:{model:'deepseek/deepseek-flash',effort:'off',runtimeDirectory:join(root,'dsh')},sources:[{id:'openai',name:'OpenAI',intervalHours:6,streams:[{id:'news',channels:[{id:'rss',kind:'feed',url:'https://openai.com/news/rss.xml'}]}]}]});
const store=new Store(config.storage.database), checkedAt=new Date().toISOString();
try {
 store.setMeta('cutoff','1970-01-01T00:00:00.000Z');
 const collection=await collect(config,store); assert.ok(collection.some(row=>'items' in row && Number(row.items)>0));
 // Keep a bounded sample of actual collected source items for the paid live run.
 const all=store.items('openai'); const kept=all.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,3);
 const ids=new Set(kept.map(item=>item.id));
 for(const item of all) if(!ids.has(item.id)) store.db.prepare('INSERT INTO feed_excluded VALUES (?,?)').run(item.source,item.id);
 const now=new Date().toISOString();
 store.saveCollection('openai','news','fixture',{raw:[],coverage:{status:'complete',to:now,notes:[]},items:[{id:'live-title-only',source:'openai',stream:'news',channel:'fixture',title:'Local storage for feed summaries',text:'',url:'https://example.invalid/title-only',publishedAt:now,observedAt:now,basis:'published',metrics:{}}]},'');
 const result=await summarize(config,store);assert.equal(result.generated,4);assert.equal(result.failed,0);assert.equal(result.pending,0);
 const records=acceptedItems(store);assert.equal(records.length,4);assert.equal(records.find(row=>row.item.id==='live-title-only')?.copy.en.summary,'');
 await writeSite(config,store);
 const calls=store.db.prepare('SELECT model,status,usage FROM agent_calls').all();
 const evidence={checkedAt,node:process.version,model:config.agent.model,dshVersion:config.agent.version,status:'passed',root,collection,accepted:records,calls,topics:await loadTopics(config.feed.topics)};
 await writeFile('.local/notes/1009/validation/live-agent.json',JSON.stringify(evidence,null,2),{mode:0o600});
 console.log(JSON.stringify({checkedAt,status:'passed',root,accepted:records.length,calls:calls.length,model:config.agent.model}));
} catch(error) {await writeFile('.local/notes/1009/validation/live-agent.json',JSON.stringify({checkedAt,status:'failed',root,error:String(error)},null,2));throw error;}
finally{store.close();}
