import { storagePaths } from '../src/storage-paths.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile, lstat, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DateTime } from 'luxon';
import { createServer } from 'node:http';
import { configSchema } from '../src/config.js';
import { Store } from '../src/store.js';
import type { Item } from '../src/types.js';

const exec = promisify(execFile);
// Cold SDK/rendering imports are part of process startup. Bound that separately
// from the cancellation latency measured after the fixture receives a request.
const cliStartupTimeout = 30_000;

test('durable cutoff validation precedes archive adoption and recovery',async()=>{
 const root=await mkdtemp(join(tmpdir(),'feedgarden-cutoff-preflight-'));
 const config=configSchema.parse({version:2,storage:{ root: root },feed:{directory:join(root,'content'),topics:resolve('config/topics.json')},agent:{model:'fixture'},sources:[{id:'hackernews',name:'HN',intervalHours:1,selection:{method:'hn-engagement'},streams:[{id:'main',channels:[{id:'feed',kind:'feed'}]}]}]});
 await mkdir(config.feed.directory);await writeFile(join(config.feed.directory,'notes.md'),'Untouched archive');const file=join(root,'config.json');await writeFile(file,JSON.stringify(config));
 const seed=new Store(storagePaths(config.storage).database);seed.setMeta('cutoff','2026-10-22T00:00:00Z');seed.close();
 try{
  await assert.rejects(exec(process.execPath,['--import','tsx',resolve('src/cli.ts'),'summarize','--since','2026-10-20','--until','2026-10-21','--config',file],{timeout:cliStartupTimeout}),error=>{assert.match((error as any).stderr,/durable cutoff/);return true;});
  const store=new Store(storagePaths(config.storage).database);try{assert.equal(store.meta('publications_initialized'),undefined);assert.equal(store.meta('selection_archives'),undefined);assert.equal((store.db.prepare('SELECT count(*) n FROM feed_archive_files').get() as {n:number}).n,0);}finally{store.close();}
  assert.equal(await readFile(join(config.feed.directory,'notes.md'),'utf8'),'Untouched archive');
 }finally{await rm(root,{recursive:true,force:true});}
});

for(const archive of [false,true]) test(`first bounded summary excludes ${archive?'imported archives':'adopted generated articles'} from new-publication counts`,async()=>{
  const root=await mkdtemp(join(tmpdir(),'feedgarden-adoption-count-'));
  const config=configSchema.parse({version:2,storage:{ root: root },feed:{directory:join(root,'content'),topics:join(root,'topics.json')},
    agent:{ command:resolve('tests/fixtures/acp-peer.mjs'), model:'fixture/other' },
    sources:[{id:'one',name:'One',intervalHours:1,streams:[{id:'main',channels:[{id:'feed',kind:'feed'}]}]},
      ...(archive?[{id:'hackernews',name:'HN',intervalHours:1,selection:{method:'hn-engagement'},streams:[{id:'main',channels:[{id:'feed',kind:'feed'}]}]}]:[])]});
  const file=join(root,'config.json'),source=archive?'hackernews':'one',id=archive?'1':'old';
  const old:Item={source,id,stream:'main',channel:'feed',title:'Retained history',text:'',url:archive?'https://news.ycombinator.com/item?id=1':'https://example.test/old',publishedAt:'2026-10-01T10:00:00.000Z',observedAt:'2026-10-01T10:00:00.000Z',basis:'published',metrics:{}};
  const oldPath=source+'/2026-10/01/item-1.md';
  await writeFile(file,JSON.stringify(config));
  await writeFile(config.feed.topics,JSON.stringify({version:1,topics:[{id:'coding',name:{en:'Coding','zh-CN':'编程'},description:'Tools',aliases:[],deprecated:false}]}));
  for(const prefix of ['','_translations/zh-CN/']){
    await mkdir(join(config.feed.directory,prefix,source,'2026-10/01'),{recursive:true});
    await writeFile(join(config.feed.directory,prefix,oldPath),`---\ntitle: Retained history\ndate: ${old.publishedAt}\npublish: true\ncontent_type: post\nsource_url: ${old.url}\n---\nHistorical body.\n`);
  }
  const seed=new Store(storagePaths(config.storage).database);
  try{
    seed.setMeta('cutoff','1970-01-01T00:00:00.000Z');
    if(!archive){
      seed.itemNumber(source,id,'2026-10-01');
      const copy={source,id,topics:['coding'],en:{title:'Retained history',summary:''},'zh-CN':{title:'历史',summary:''}};
      seed.db.prepare('INSERT INTO feed_summaries VALUES (?,?,?,?,?)').run(source,id,'old',JSON.stringify({item:old,copy,firstSeen:old.observedAt,date:old.publishedAt,dateBasis:'published',updated:old.observedAt}),old.observedAt);
    }
    const next:Item={...old,source:'one',id:'new',title:'New item',url:'https://example.test/new',publishedAt:'2026-10-20T10:00:00.000Z',observedAt:'2026-10-20T10:00:00.000Z'};
    seed.saveCollection('one','main','feed',{items:[next],raw:[],coverage:{status:'complete',to:next.observedAt,notes:[]}},'');
  }finally{seed.close();}
  try{
    const result=await exec(process.execPath,['--import','tsx',resolve('src/cli.ts'),'summarize','--source','one','--since','2026-10-20T00:00:00+08:00','--until','2026-10-21T00:00:00+08:00','--config',file],{timeout:cliStartupTimeout});
    const report=JSON.parse(result.stdout.trim());
    assert.equal(report.generated,1);
    assert.equal(report.newPublications,1,'Previously installed history is not newly published by this command');
    const store=new Store(storagePaths(config.storage).database);
    try{assert.equal((store.db.prepare('SELECT count(*) n FROM feed_publications').get() as {n:number}).n,2);}finally{store.close();}
    await lstat(join(config.feed.directory,oldPath));await lstat(join(config.feed.directory,'_translations/zh-CN',oldPath));
    const locale=JSON.parse(await readFile(join(config.feed.directory,'_translations/zh-CN/_locale.yml'),'utf8'));
    assert.equal(locale.tag_labels['topics/coding'],'编程');
    if(!archive) assert.match(await readFile(join(config.feed.directory,'_translations/zh-CN',oldPath),'utf8'),/title: "历史"/);
  }finally{await rm(root,{recursive:true,force:true});}
});

test('invalid or unsupported daily windows fail before creating runner storage',async()=>{
  const root=await mkdtemp(join(tmpdir(),'feedgarden-window-cli-'));
  const directory=join(root,'private'),file=join(root,'config.json');
  await writeFile(file,JSON.stringify({version:2,agent:{model:'fixture'},storage:{ root: directory },sources:[{id:'one',name:'One',intervalHours:1,streams:[{id:'main',channels:[{id:'feed',kind:'feed'}]}]}]}));
  try{
    for(const args of [['run','--due','--until','2026-10-21'],['summarize','--since','2026-10-21','--until','2026-10-20'],['collect','--until','2026-10-21']]){
      await assert.rejects(exec(process.execPath,['--import','tsx',resolve('src/cli.ts'),...args,'--config',file],{timeout:cliStartupTimeout}),error=>{assert.match((error as any).stderr,/--until/);return true;});
      await assert.rejects(lstat(directory),{code:'ENOENT'});
    }
  }finally{await rm(root,{recursive:true,force:true});}
});

test('bounded summary failure reports include only admitted, non-excluded jobs',async()=>{
  const root=await mkdtemp(join(tmpdir(),'feedgarden-window-errors-'));
  const config=configSchema.parse({version:2,storage:{ root: root },feed:{directory:join(root,'content'),topics:resolve('config/topics.json')},
    agent:{ command:join(root,'missing.exe') },sources:['one','two'].map(id=>({id,name:id,intervalHours:1,streams:[{id:'main',channels:[{id:'feed',kind:'feed'}]}]}))});
  const file=join(root,'config.json');await writeFile(file,JSON.stringify(config));
  const seed=new Store(storagePaths(config.storage).database);
  try{
    seed.setMeta('cutoff','1970-01-01T00:00:00.000Z');
    for(const [id,source,publishedAt] of [['within','one','2026-10-20T10:00:00Z'],['excluded','one','2026-10-20T10:00:00Z'],['expired','one','2026-10-19T10:00:00Z'],['later','one','2026-10-20T16:00:00Z'],['other-source','two','2026-10-20T10:00:00Z']] as const){
      const item:Item={id,source,stream:'main',channel:'feed',title:id,text:'Source evidence. '.repeat(6000),url:'https://example.test/'+id,basis:'published',publishedAt,observedAt:publishedAt,metrics:{}};
      seed.db.prepare("INSERT INTO feed_jobs VALUES (?,?,?,?,'failed',5,'',?)").run(source,id,id,JSON.stringify({item,firstSeen:publishedAt}),'Failure for '+id);
    }
    seed.db.prepare('INSERT INTO feed_excluded VALUES (?,?)').run('one','excluded');
  }finally{seed.close();}
  try{
    await assert.rejects(exec(process.execPath,['--import','tsx',resolve('src/cli.ts'),'summarize','--source','one','--since','2026-10-20T00:00:00+08:00','--until','2026-10-21T00:00:00+08:00','--config',file],{timeout:cliStartupTimeout}),error=>{
      const result=error as any;assert.equal(result.code,1);assert.match(result.stderr,/Run incomplete: 1 task/);assert.equal(JSON.parse(result.stdout.trim()).failed,1);return true;
    });
    const store=new Store(storagePaths(config.storage).database);
    try{
      const details=JSON.parse((store.db.prepare('SELECT details FROM runs ORDER BY id DESC LIMIT 1').get() as {details:string}).details);
      assert.deepEqual(details.failures,[{kind:'summary',key:'one/within',error:'Failure for within'}]);
      assert.equal((store.db.prepare('SELECT count(*) n FROM agent_calls').get() as {n:number}).n,0);
    }finally{store.close();}
  }finally{await rm(root,{recursive:true,force:true});}
});

for (const backupFails of [false, true]) test('relation configuration failures retain diagnostics and ' + (backupFails ? 'survive a later hard backup failure' : 'finish scheduled rendering and backup'), async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-relations-config-'));
  const config = configSchema.parse({ version: 2, storage: { root: root }, feed: { directory: join(root, 'content'), topics: resolve('config/topics.json') },
    agent: { command: join(root, 'missing-agent.exe') }, sources: [{ id: 'one', name: 'One', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }] }] });
  const file = join(root, 'config.json'), at = new Date().toISOString();
  await writeFile(file, JSON.stringify(config));
  const seed = new Store(storagePaths(config.storage).database);
  try {
    seed.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
    for (const id of ['alpha', 'beta']) seed.db.prepare('INSERT INTO feed_archive_files VALUES (?,?)').run('one/' + id + '.md', Buffer.from(`---\ntitle: Atlas validation pipeline release\ndate: ${at}\npublish: true\ncontent_type: post\nsource_url: https://example.test/${id}\n---\nAtlas releases a configurable validation pipeline with deterministic input records, structured diagnostics and retained source evidence. Operators replay recorded events and inspect validation decisions. ${id}.\n`));
  } finally { seed.close(); }
  if (backupFails) await writeFile(join(root, 'backups'), 'fixture blocks backup directory creation');
  try {
    await assert.rejects(exec(process.execPath, ['--import', 'tsx', resolve('src/cli.ts'), 'run', '--due', '--no-publish', '--config', file], { timeout: cliStartupTimeout }), error => {
      assert.equal((error as any).code, 1);
      if (!backupFails) assert.match((error as any).stderr, /Run incomplete/);
      assert.match((error as any).stdout, /"generated":0/);
      assert.match((error as any).stdout, /"newPublications":0/);
      return true;
    });
    const store = new Store(storagePaths(config.storage).database);
    try {
      const run = store.db.prepare('SELECT status,details FROM runs ORDER BY id DESC LIMIT 1').get() as { status: string; details: string };
      assert.equal(run.status, backupFails ? 'failed' : 'partial');
      const details = JSON.parse(run.details);
      assert.ok(details.collections.length>0);assert.equal(details.summary.newPublications,0);
      assert.ok(details.failures.some((failure: any) => failure.kind === 'collection'));
      assert.ok(details.failures.some((failure: any) => failure.kind === 'relations' && failure.key === 'config'));
      if (backupFails) assert.match(details.error, /EEXIST|ENOTDIR/);
      assert.equal((store.db.prepare('SELECT count(*) n FROM agent_calls').get() as { n: number }).n, 0);
      assert.match(await readFile(join(config.feed.directory, 'one/alpha.md'), 'utf8'), /Atlas/);
      if (!backupFails) assert.ok(await lstat(join(root, 'backups/daily', DateTime.utc().toISODate()! + '.sqlite')));
    } finally { store.close(); }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('an empty scheduled run completes without an installed agent executable', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-noop-agent-'));
  const config = configSchema.parse({ version: 2, storage: { root: root }, feed: { directory: join(root, 'content'), topics: resolve('config/topics.json') },
    agent: { command: join(root, 'not-installed.exe') }, sources: [{ id: 'one', name: 'One', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }] }] });
  const file = join(root, 'config.json'), seed = new Store(storagePaths(config.storage).database);
  await writeFile(file, JSON.stringify(config));
  try {
    seed.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
    seed.saveCollection('one', 'main', 'feed', { items: [], raw: [], coverage: { status: 'complete', to: new Date().toISOString(), notes: [] } }, '2999-01-01T00:00:00.000Z');
  } finally { seed.close(); }
  try {
    const result = await exec(process.execPath, ['--import', 'tsx', resolve('src/cli.ts'), 'run', '--due', '--no-publish', '--since', '2026-10-20T00:00:00+08:00', '--until', '2026-10-21T00:00:00+08:00', '--observed-days', '7', '--config', file], { timeout: cliStartupTimeout });
    assert.match(result.stdout, /"generated":0/); assert.match(result.stdout, /"candidates":0/);
    assert.match(result.stdout, /"newPublications":0/);assert.match(result.stdout, /"until":"2026-10-20T16:00:00.000Z"/);
    await assert.rejects(lstat(storagePaths(config.storage).agents), { code: 'ENOENT' });
    const store = new Store(storagePaths(config.storage).database);
    try {
      assert.equal((store.db.prepare('SELECT count(*) n FROM agent_calls').get() as { n: number }).n, 0);
      assert.equal((store.db.prepare('SELECT status FROM runs ORDER BY id DESC LIMIT 1').get() as { status: string }).status, 'succeeded');
      const details=JSON.parse((store.db.prepare('SELECT details FROM runs ORDER BY id DESC LIMIT 1').get() as {details:string}).details);
      assert.equal(details.collections[0].status,'deferred');assert.equal(details.summary.newPublications,0);assert.equal(details.summary.eligibleCandidates,0);
      assert.equal(JSON.parse(store.meta('publication_windows')!).one.since,'2026-10-19T16:00:00.000Z');
    } finally { store.close(); }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('summary configuration failures exit partial while rendering healthy sources', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-source-config-'));
  const config = configSchema.parse({ version: 2, storage: { root: root }, feed: { directory: join(root, 'content'), topics: join(root, 'topics.json') },
    agent: { command: resolve('tests/fixtures/acp-peer.mjs'), model: 'fixture/other' },
    sources: ['one', 'two'].map(id => ({ id, name: id, intervalHours: 1, ...(id === 'one' ? { agent: { model: 'missing/no-model' } } : {}), streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }] })) });
  const file = join(root, 'config.json'), at = new Date().toISOString();
  await writeFile(file, JSON.stringify(config));
  await writeFile(config.feed.topics, JSON.stringify({ version: 1, topics: [{ id: 'coding', name: { en: 'Coding', 'zh-CN': '编程' }, description: 'Tools', aliases: [], deprecated: false }] }));
  const seed = new Store(storagePaths(config.storage).database);
  try {
    seed.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
    for (const source of ['one', 'two']) {
      const item: Item = { source, id: 'a', stream: 'main', channel: 'feed', title: 'Title', text: '', url: 'https://example.test/' + source, publishedAt: at, observedAt: at, basis: 'published', metrics: {} };
      seed.saveCollection(source, 'main', 'feed', { items: [item], raw: [], coverage: { status: 'complete', to: at, notes: [] } }, '');
    }
  } finally { seed.close(); }
  try {
    await assert.rejects(exec(process.execPath, ['--import', 'tsx', resolve('src/cli.ts'), 'summarize', '--config', file], { timeout: cliStartupTimeout }), error => {
      const result = error as any; assert.equal(result.code, 1); assert.match(result.stderr, /Run incomplete/);
      const summary = JSON.parse(result.stdout.trim()); assert.equal(summary.generated, 1);
      assert.equal(summary.sourceErrors[0].source, 'one'); assert.match(summary.sourceErrors[0].error, /unsupported/);
      return true;
    });
    const store = new Store(storagePaths(config.storage).database);
    try {
      const run = store.db.prepare('SELECT status,details FROM runs ORDER BY id DESC LIMIT 1').get() as { status: string; details: string };
      assert.equal(run.status, 'partial'); assert.equal(JSON.parse(run.details).failures[0].kind, 'summary-config');
      const path = store.db.prepare("SELECT day,number FROM feed_item_paths WHERE source='two' AND id='a'").get() as { day: string; number: number };
      assert.match(await readFile(join(config.feed.directory, 'two', path.day.slice(0, 7), path.day.slice(8), 'item-' + path.number + '.md'), 'utf8'), /Title/);
      assert.equal((store.db.prepare('SELECT count(*) n FROM agent_calls').get() as { n: number }).n, 1);
    } finally { store.close(); }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('scheduled runs recover HN fallback scores even when the next collection is not due', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-rank-run-'));
  const server = createServer((_request, response) => response.end(`<rss><channel><title>Fixture</title><item><title>HN post</title><link>https://news.ycombinator.com/item?id=1</link><comments>https://news.ycombinator.com/item?id=1</comments><pubDate>${new Date().toUTCString()}</pubDate></item></channel></rss>`));
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const config = configSchema.parse({ version: 2, storage: { root: root }, feed: { directory: join(root, 'content'), topics: resolve('config/topics.json') },
    agent: { command: resolve('tests/fixtures/acp-peer.mjs'), model: 'deepseek/deepseek-flash', maxDailyCalls: 1 }, sources: [{ id: 'hackernews', name: 'HN', intervalHours: 1, selection: { method: 'hn-engagement' }, streams: [{ id: 'main', channels: [
      { id: 'primary', kind: 'hn-api' }, { id: 'fallback', kind: 'feed', url: `http://127.0.0.1:${address.port}/feed` },
    ] }] }] });
  const file = join(root, 'config.json'), preload = join(root, 'ranking.mjs');
  await writeFile(file, JSON.stringify(config));
  await writeFile(preload, `import { Http, HttpError } from ${JSON.stringify(pathToFileURL(resolve('src/http.ts')).href)};
const get=Http.prototype.get;
Http.prototype.get=async function(url,...args){
 if(!url.startsWith('https://hacker-news.firebaseio.com/'))return get.call(this,url,...args);
 if(url.endsWith('/topstories.json')||process.env.FEEDGARDEN_FIXTURE_RANK!=='ready')throw new HttpError('Fixture API unavailable',503);
 const raw={url,status:200,headers:{},fetchedAt:new Date().toISOString(),body:JSON.stringify({id:1,type:'story',score:25,descendants:0,kids:[]})};
 this.store.saveCache(raw);this.raw.push(raw);return raw;
};`);
  const seed = new Store(storagePaths(config.storage).database); seed.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
  seed.finishCall(seed.startCall('previous', config.agent.model!, 1), 'succeeded', {}); seed.close();
  const args = ['--import', 'tsx', '--import', pathToFileURL(preload).href, resolve('src/cli.ts'), 'run', '--due', '--no-publish', '--config', file];
  const env = { ...process.env, NO_PROXY: '127.0.0.1', no_proxy: '127.0.0.1' };
  try {
    await assert.rejects(exec(process.execPath, args, { env, timeout: cliStartupTimeout }), error => {
      assert.equal((error as any).code, 1); assert.match((error as any).stderr, /Run incomplete/); return true;
    });
    const before = new Store(storagePaths(config.storage).database);
    let attempt: string;
    try { assert.ok(!before.isSelected('hackernews', '1')); attempt = before.channel('hackernews', 'main', 'fallback')!.last_attempt; }
    finally { before.close(); }
    await exec(process.execPath, args, { env: { ...env, FEEDGARDEN_FIXTURE_RANK: 'ready' }, timeout: cliStartupTimeout });
    const after = new Store(storagePaths(config.storage).database);
    try {
      assert.equal(after.channel('hackernews', 'main', 'fallback')!.last_attempt, attempt!, 'collection was skipped by its cadence');
      assert.ok(after.isSelected('hackernews', '1'));
      assert.deepEqual(after.db.prepare('SELECT status FROM runs ORDER BY id').all(), [{ status: 'partial' }, { status: 'succeeded' }]);
      assert.equal((after.db.prepare('SELECT state FROM feed_jobs').get() as { state: string }).state, 'pending', 'quota prevents any paid fixture call');
    } finally { after.close(); }
  } finally { await new Promise<void>(done => server.close(() => done())); await rm(root, { recursive: true, force: true }); }
});

test('removed and unknown commands fail before configuration or storage access', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'feedgarden-config-'));
  const loader = pathToFileURL(resolve('node_modules/tsx/dist/loader.mjs')).href;
  const invoke = (command: string, ...args: string[]) => exec(process.execPath, ['--import', loader, resolve('src/cli.ts'), command, ...args], { cwd: directory });
  try {
    await writeFile(join(directory, 'feedgarden.json'), JSON.stringify({ version: 99 }));
    for (const command of ['migrate', 'rollback', 'unknown']) {
      await assert.rejects(invoke(command), error => /Unknown command/.test((error as any).stderr));
    }
    await writeFile(join(directory, 'feedgarden.jsonc'), JSON.stringify({ version: 98 }));
    await assert.rejects(invoke('migrate'), error => /Unknown command/.test((error as any).stderr));
    await assert.rejects(invoke('migrate', '--config', 'feedgarden.json'), error => /Unknown command/.test((error as any).stderr));
    await assert.rejects(lstat(join(directory, '.local')), { code: 'ENOENT' });
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('quota deferral exits zero, retains pending items and finishes render/backup', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'feedgarden-cli-'));
  const config = configSchema.parse({ version: 2, storage: { root: directory },
    feed: { directory: join(directory, 'content'), topics: resolve('config/topics.json') }, collection: { backfillDays: 3 }, publish: { auto: true }, agent: { command: resolve('tests/fixtures/acp-peer.mjs'), model: 'deepseek/deepseek-flash', maxDailyCalls: 1 },
    sources: [{ id: 'hackernews', name: 'Hacker News', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'rss', kind: 'feed', url: 'https://example.test/rss' }] }] }] });
  const file = join(directory, 'config.json'); await writeFile(file, JSON.stringify(config));
  const date = DateTime.now().setZone('Asia/Shanghai').minus({ days: 2 }).toISODate()!;
  const period = { start: date + 'T00:00:00.000Z' };
  const item: Item = { id: 'pending', source: 'hackernews', stream: 'main', channel: 'rss', title: 'Pending report', text: '',
    url: 'https://example.test/item', publishedAt: period.start, observedAt: new Date().toISOString(), metrics: {}, basis: 'published' };
  const seed = new Store(storagePaths(config.storage).database);
  seed.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
  seed.saveCollection('hackernews', 'main', 'rss', { items: [item], raw: [], coverage: { status: 'complete', to: item.observedAt, notes: [] } }, '2999-01-01T00:00:00.000Z');
  seed.finishCall(seed.startCall('previous', config.agent.model!, 1), 'succeeded', {}); seed.close();
  try {
    let status = 0, stderr = '';
    try { await exec(process.execPath, ['--import', 'tsx', resolve('src/cli.ts'), 'run', '--due', '--no-publish', '--config', file]); }
    catch (error) { status = Number((error as { code: number }).code); stderr = (error as { stderr: string }).stderr; }
    assert.equal(status, 0, stderr);
    const store = new Store(storagePaths(config.storage).database);
    try {
      const run = store.db.prepare('SELECT status,details FROM runs ORDER BY id DESC LIMIT 1').get() as { status: string; details: string };
      assert.equal(run.status, 'succeeded');
      assert.equal((store.db.prepare('SELECT state FROM feed_jobs').get() as {state:string}).state, 'pending');
      assert.equal((store.db.prepare('SELECT count(*) n FROM job_lease').get() as { n: number }).n, 0);
      assert.match(await readFile(join(config.feed.directory, 'index.md'), 'utf8'), /Feedgarden/);
      const backup = new Store(join(directory, 'backups/daily', DateTime.utc().toISODate()! + '.sqlite'));
      try { assert.equal(backup.items('hackernews').length, 1); } finally { backup.close(); }
    } finally { store.close(); }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('CLI collection succeeds with a fallback and reports partial when all channels are unavailable', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'feedgarden-cli-'));
  const server = createServer((request, response) => request.url === '/ok'
    ? response.end('<rss><channel><title>Fixture</title><link>https://example.test</link><description>Empty feed</description></channel></rss>') : response.writeHead(403).end('Unavailable'));
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const config = configSchema.parse({ version: 2, storage: { root: directory }, agent: { model: 'deepseek/deepseek-flash' },
    sources: [{ id: 'fixture', name: 'Fixture', intervalHours: 1, streams: [{ id: 'main', channels: [
      { id: 'primary', kind: 'feed', url: `http://127.0.0.1:${address.port}/fail` }, { id: 'backup', kind: 'feed', url: `http://127.0.0.1:${address.port}/ok` },
    ] }] }] });
  const file = join(directory, 'config.json');
  const args = ['--import', 'tsx', resolve('src/cli.ts'), 'collect', '--config', file];
  const env = { ...process.env, NO_PROXY: '127.0.0.1', no_proxy: '127.0.0.1' };
  try {
    await writeFile(file, JSON.stringify(config)); await exec(process.execPath, args, { env });
    config.sources[0]!.streams[0]!.channels[1]!.enabled = false;
    await writeFile(file, JSON.stringify(config));
    await assert.rejects(exec(process.execPath, args, { env }), error => (error as { code: number }).code === 1);
    const store = new Store(storagePaths(config.storage).database);
    try {
      assert.deepEqual(store.db.prepare('SELECT status FROM runs ORDER BY id').all(), [{ status: 'succeeded' }, { status: 'partial' }]);
      const last = store.db.prepare('SELECT details FROM runs ORDER BY id DESC LIMIT 1').get() as { details: string };
      assert.match(last.details, /fixture\/main/);
    } finally { store.close(); }
  } finally { await new Promise<void>(done => server.close(() => done())); await rm(directory, { recursive: true, force: true }); }
});

test('lease renewal failure cancels collection, finishes the run and releases the runner lock', async () => {
  const directory=await mkdtemp(join(tmpdir(),'feedgarden-lease-'));
  let requestStarted=0;
  const server=createServer((_request,response)=>{requestStarted ||= performance.now();response.writeHead(200);response.write('<rss>');});
  await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));
  const address=server.address();assert.ok(address&&typeof address!=='string');
  const config=configSchema.parse({version:2,storage:{ root: directory },agent:{model:'deepseek/deepseek-flash'},sources:[{id:'fixture',name:'Fixture',intervalHours:1,streams:[{id:'main',channels:[{id:'rss',kind:'feed',url:`http://127.0.0.1:${address.port}/stall`}]}]}]});
  const file=join(directory,'config.json'),preload=join(directory,'fault.mjs');
  await writeFile(file,JSON.stringify(config));
  await writeFile(preload,`import { Store } from ${JSON.stringify(pathToFileURL(resolve('src/store.ts')).href)};\nconst interval=globalThis.setInterval;\nglobalThis.setInterval=(fn,ms,...args)=>interval(fn,ms===30000?20:ms,...args);\nStore.prototype.renewLease=()=>{throw new Error('Injected lease renewal failure');};\n`);
  try {
    await assert.rejects(exec(process.execPath,['--import','tsx','--import',pathToFileURL(preload).href,resolve('src/cli.ts'),'collect','--config',file],{env:{...process.env,NO_PROXY:'127.0.0.1',no_proxy:'127.0.0.1'},timeout:cliStartupTimeout}),error=>Number((error as any).code)===1);
    if(requestStarted) assert.ok(performance.now()-requestStarted<5000,'collection must stop within five seconds of the active request');
    const store=new Store(storagePaths(config.storage).database);
    try {
      const run=store.db.prepare('SELECT status,details FROM runs').get() as {status:string;details:string};
      assert.equal(run.status,'failed');assert.match(run.details,/Injected lease renewal failure/);
      assert.equal(store.states().length,0,'cancelled input must not be committed');
      assert.deepEqual(store.db.prepare('SELECT * FROM job_lease').all(),[]);
      await assert.rejects(lstat(storagePaths({ root: directory }).runner + '.lock'),error=>(error as NodeJS.ErrnoException).code==='ENOENT');
    } finally {store.close();}
  } finally {server.closeAllConnections();await new Promise<void>(done=>server.close(()=>done()));await rm(directory,{recursive:true,force:true});}
});

test('a compromised filesystem lock cancels work and its already released state does not mask the failure', async () => {
 const directory=await mkdtemp(join(tmpdir(),'feedgarden-lock-'));
 let requestStarted=0;
 const server=createServer((_request,response)=>{requestStarted ||= performance.now();response.writeHead(200);response.write('<rss>');void rm(storagePaths({ root: directory }).runner + '.lock',{recursive:true});});
 await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));const address=server.address();assert.ok(address&&typeof address!=='string');
 const config=configSchema.parse({version:2,storage:{ root: directory },agent:{model:'deepseek/deepseek-flash'},sources:[{id:'fixture',name:'Fixture',intervalHours:1,streams:[{id:'main',channels:[{id:'rss',kind:'feed',url:`http://127.0.0.1:${address.port}/stall`}]}]}]});
 const file=join(directory,'config.json'),preload=join(directory,'fault.mjs');await writeFile(file,JSON.stringify(config));
 await writeFile(preload,'const timeout=globalThis.setTimeout;globalThis.setTimeout=(fn,ms,...args)=>timeout(fn,ms===10000?20:ms,...args);');
 try {
  await assert.rejects(exec(process.execPath,['--import','tsx','--import',pathToFileURL(preload).href,resolve('src/cli.ts'),'collect','--config',file],{env:{...process.env,NO_PROXY:'127.0.0.1',no_proxy:'127.0.0.1'},timeout:cliStartupTimeout}),error=>{assert.equal((error as any).code,1);assert.ok(!(error as any).stderr.includes('Lock is already released'));return true;});
  assert.ok(requestStarted && performance.now()-requestStarted<5000,'a compromised lock must stop the active request within five seconds');
  const store=new Store(storagePaths(config.storage).database);try {assert.equal((store.db.prepare('SELECT status FROM runs').get() as any).status,'failed');assert.equal(store.states().length,0);assert.deepEqual(store.db.prepare('SELECT * FROM job_lease').all(),[]);}finally{store.close();}
 }finally{server.closeAllConnections();await new Promise<void>(done=>server.close(()=>done()));await rm(directory,{recursive:true,force:true});}
});
