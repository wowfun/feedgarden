import test from 'node:test';
import assert from 'node:assert/strict';
import { adapters } from '../src/channels/index.js';
import { configSchema } from '../src/config.js';
import { Http } from '../src/http.js';
import { Store } from '../src/store.js';
import { collect } from '../src/collect.js';

test('collection reports distinguish disabled, not due, valid empty and duplicate observations',async()=>{
  const config=configSchema.parse({version:2,agent:{model:'fixture'},sources:['one','disabled'].map(id=>({id,name:id,enabled:id==='one',intervalHours:6,streams:[{id:'main',channels:[{id:'feed',kind:'feed'}]}]}))});
  const store=new Store(':memory:');let count=0;
  const registry={...adapters,feed:async(c:Parameters<typeof adapters.feed>[0])=>({items:count++===0?[]:[{id:'a',source:'one',stream:'main',channel:'feed',title:'A',text:'Facts',url:'https://example.test/a',basis:'observed' as const,publishedAt:c.now,observedAt:c.now,metrics:{}}],raw:[],coverage:{status:'complete' as const,to:c.now,notes:[]}})};
  try{
    const initial=await collect(config,store,undefined,false,registry);
    assert.equal(initial[0]!.status,'disabled');assert.match('reason' in initial[0]! ? initial[0].reason! : '',/Disabled/);
    assert.ok(initial.some(row=>'fetchedItems' in row&&row.fetchedItems===0&&row.newItems===0&&row.status==='complete'));
    const skipped=await collect(config,store,'one',true,registry);assert.equal(count,1);assert.equal(skipped[0]!.status,'deferred');assert.match('reason' in skipped[0]! ? skipped[0].reason! : '',/interval/);
    const first=await collect(config,store,'one',false,registry),second=await collect(config,store,'one',false,registry);
    assert.ok(first.some(row=>'newItems' in row&&row.newItems===1));
    assert.ok(second.some(row=>'newItems' in row&&row.newItems===0&&row.fetchedItems===1));
  }finally{store.close();}
});

const at = '2026-10-21T10:00:00.000Z';
const article = '<meta property="og:type" content="article"><article><header><h1>Engineering work</h1><a href="/engineering">Engineering</a><time datetime="2026-10-20">Oct 20</time></header><p>Verified article body.</p></article>';
function fixture(streamId: string, kind = 'anthropic-html') {
  const config = configSchema.parse({version:2, agent:{model:'fixture/model'}, sources:[{id:'anthropic',name:'Anthropic',intervalHours:6,streams:[{id:streamId,channels:[{id:'list',kind,url:'https://www.anthropic.com/'+(kind==='sitemap'?'sitemap.xml':streamId)}]}]}]});
  const source=config.sources[0]!, stream=source.streams[0]!, channel=stream.channels[0]!, store=new Store(':memory:'), http=new Http(store);
  return {source,stream,channel,store,http,now:at,since:at};
}

for (const reason of ['non-article','outside-engineering']) test('discovery rechecks '+reason+' after seven days and accepts newly valid articles',async()=>{
 const c=fixture(reason==='outside-engineering'?'engineering':'news','sitemap');let valid=false,requests=0;
 const url='https://www.anthropic.com/'+(reason==='outside-engineering'?'research':'news')+'/changing';
 c.http.page=async page=>({url:page,status:200,headers:{},fetchedAt:c.now,body:page===c.channel.url?'<urlset><url><loc>'+url+'</loc></url></urlset>':(++requests,valid?article:reason==='non-article'?'<meta property="og:type" content="website">':article.replace('/engineering','/research'))});
 try{
  assert.equal((await adapters.sitemap(c)).items.length,0);valid=true;
  c.now='2026-10-28T09:59:59.999Z';assert.equal((await adapters.sitemap(c)).items.length,0);assert.equal(requests,1);
  c.now='2026-10-28T10:00:00.000Z';const result=await adapters.sitemap(c);assert.deepEqual(result.items.map(i=>i.url),[url]);assert.equal(requests,2);assert.equal(result.coverage.status,'complete');
  assert.equal(result.items[0]!.publishedAt,'2026-10-19T16:00:00.000Z','Recheck preserves the source date; it does not make an expired item current');
 }finally{c.store.close();}
});

test('expired discovery decisions share a bounded budget with fresh URLs',async()=>{
 const c=fixture('news','sitemap');let phase=0;const requests:string[]=[];
 const old=Array.from({length:50},(_,i)=>'https://www.anthropic.com/news/old'+i),fresh=Array.from({length:50},(_,i)=>'https://www.anthropic.com/news/new'+i);
 c.http.page=async url=>({url,status:200,headers:{},fetchedAt:c.now,body:url===c.channel.url?'<urlset>'+[...old,...(phase?fresh:[])].map(u=>'<url><loc>'+u+'</loc></url>').join('')+'</urlset>':(requests.push(url),phase?article:'<meta property="og:type" content="website">')});
 try{
  await adapters.sitemap(c);requests.length=0;phase=1;c.now='2026-10-28T10:00:00.000Z';
  const result=await adapters.sitemap(c);assert.equal(requests.length,50);assert.equal(requests.filter(u=>u.includes('/news/old')).length,10);assert.equal(requests.filter(u=>u.includes('/news/new')).length,40);assert.equal(result.coverage.status,'partial');
 }finally{c.store.close();}
});

test('review: sitemap skips are remembered per stream so discovery progresses without false gaps',async()=>{
 const c=fixture('engineering','sitemap');let details=0;
 c.http.page=async url=>({url,status:200,headers:{},fetchedAt:at,body:url===c.channel.url
  ? '<urlset>'+[...Array.from({length:50},(_,i)=>'/research/other'+i),'/engineering/real'].map(p=>'<url><loc>https://www.anthropic.com'+p+'</loc></url>').join('')+'</urlset>'
  : (++details,url.endsWith('/real')?article:article.replace('/engineering','/research'))});
 try{
  const first=await adapters.sitemap(c);assert.equal(first.items.length,0);c.store.saveCollection(c.source.id,c.stream.id,c.channel.id,first,'');
  const next=await adapters.sitemap(c);assert.equal(next.items.length,1);assert.equal(details,51);assert.equal(next.coverage.status,'complete');
  c.store.saveCollection(c.source.id,c.stream.id,c.channel.id,next,'');const gaps=(c.store.db.prepare('SELECT count(*) n FROM gaps').get() as {n:number}).n;
  const third=await adapters.sitemap(c);c.store.saveCollection(c.source.id,c.stream.id,c.channel.id,third,'');assert.equal(details,51);assert.equal((c.store.db.prepare('SELECT count(*) n FROM gaps').get() as {n:number}).n,gaps);
 }finally{c.store.close();}
});

test('review: official pages reject chrome-only bodies and nested category paths',async()=>{
 const c=fixture('news');const urls:string[]=[];
 c.http.page=async url=>{urls.push(url);return {url,status:200,headers:{},fetchedAt:at,body:url===c.channel.url?'<main><a href="/news/">Root</a><a href="/news/team/alignment">Team</a><a href="/news/empty">Empty</a></main>':'<meta property="og:type" content="article"><article><header><h1>Title</h1><p>Navigation only</p></header></article>'};};
 try{await assert.rejects(adapters['anthropic-html'](c),/lacked article content/);assert.deepEqual(urls,[c.channel.url,'https://www.anthropic.com/news/empty']);}finally{c.store.close();}
});

test('official discovery rejects category pages despite their article wrapper and title',async()=>{
  const c=fixture('news');
  c.http.page=async url=>({url,status:200,headers:{},fetchedAt:at,body:url===c.channel.url
    ? '<main><a href="/news/announcements">Announcements</a><a href="/news/real">Real</a><a href="/news/undated">Undated</a></main>'
    : url.endsWith('/announcements') ? '<meta property="og:type" content="website"><main><article><h1>Announcements</h1><p>74 articles</p><a href="/news/old">Old news</a><time>Oct 18, 2026</time></article></main>'
    : url.endsWith('/undated') ? article.replace('<time datetime="2026-10-20">Oct 20</time>','') : article});
  try {
    const result=await adapters['anthropic-html'](c);
    assert.deepEqual(result.items.map(i=>i.url),['https://www.anthropic.com/news/real','https://www.anthropic.com/news/undated']);
    assert.equal(result.items[1]!.basis,'observed');
    assert.match(result.coverage.notes.join(' '),/non-article/);
  } finally {c.store.close();}
});

for(const kind of ['anthropic-html','sitemap']) test('engineering '+kind+' discovers research URLs and deduplicates known identities',async()=>{
  const c=fixture('engineering',kind);
  c.http.page=async url=>({url,status:200,headers:{},fetchedAt:at,body:url===c.channel.url
    ? kind==='sitemap' ? '<urlset><url><loc>https://www.anthropic.com/research/real</loc></url><url><loc>https://www.anthropic.com/research/other</loc></url></urlset>'
    : '<nav><a href="/research/other">Other</a></nav><main><a href="/research/real">Article</a><a href="https://foreign.test/research/foreign">Foreign</a></main>'
    : url.endsWith('/other') ? article.replace('/engineering','/research/team/alignment') : article});
  try {
    const result=await adapters[kind as 'sitemap'](c);
    assert.deepEqual(result.items.map(i=>i.url),['https://www.anthropic.com/research/real']);
    if(kind==='sitemap')assert.match(result.coverage.notes.join(' '),/1.*outside.*Engineering/);
    c.store.saveCollection(c.source.id,c.stream.id,c.channel.id,result,'');
    assert.equal((await adapters[kind as 'sitemap'](c)).items.length,0);
  } finally {c.store.close();}
});
