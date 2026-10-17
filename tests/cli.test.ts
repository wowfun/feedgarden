import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile, lstat } from 'node:fs/promises';
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

for (const backupFails of [false, true]) test('relation configuration failures retain diagnostics and ' + (backupFails ? 'survive a later hard backup failure' : 'finish scheduled rendering and backup'), async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-relations-config-'));
  const config = configSchema.parse({ version: 2, storage: { directory: root, database: join(root, 'data.sqlite') }, feed: { directory: join(root, 'content'), topics: resolve('config/topics.json') },
    agent: { command: join(root, 'missing-agent.exe'), runtimeDirectory: join(root, 'tasks') }, sources: [{ id: 'one', name: 'One', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }] }] });
  const file = join(root, 'config.json'), at = new Date().toISOString();
  await writeFile(file, JSON.stringify(config));
  const seed = new Store(config.storage.database);
  try {
    seed.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
    for (const id of ['alpha', 'beta']) seed.db.prepare('INSERT INTO feed_archive_files VALUES (?,?)').run('one/' + id + '.md', Buffer.from(`---\ntitle: Atlas validation pipeline release\ndate: ${at}\npublish: true\ncontent_type: post\nsource_url: https://example.test/${id}\n---\nAtlas releases a configurable validation pipeline with deterministic input records, structured diagnostics and retained source evidence. Operators replay recorded events and inspect validation decisions. ${id}.\n`));
  } finally { seed.close(); }
  if (backupFails) await writeFile(join(root, 'backups'), 'fixture blocks backup directory creation');
  try {
    await assert.rejects(exec(process.execPath, ['--import', 'tsx', resolve('src/cli.ts'), 'run', '--due', '--no-publish', '--config', file], { timeout: cliStartupTimeout }), error => {
      assert.equal((error as any).code, 1);
      if (!backupFails) assert.match((error as any).stderr, /Run incomplete/);
      return true;
    });
    const store = new Store(config.storage.database);
    try {
      const run = store.db.prepare('SELECT status,details FROM runs ORDER BY id DESC LIMIT 1').get() as { status: string; details: string };
      assert.equal(run.status, backupFails ? 'failed' : 'partial');
      const details = JSON.parse(run.details);
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
  const config = configSchema.parse({ version: 2, storage: { directory: root, database: join(root, 'data.sqlite') }, feed: { directory: join(root, 'content'), topics: resolve('config/topics.json') },
    agent: { command: join(root, 'not-installed.exe'), runtimeDirectory: join(root, 'tasks') }, sources: [{ id: 'one', name: 'One', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }] }] });
  const file = join(root, 'config.json'), seed = new Store(config.storage.database);
  await writeFile(file, JSON.stringify(config));
  try {
    seed.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
    seed.saveCollection('one', 'main', 'feed', { items: [], raw: [], coverage: { status: 'complete', to: new Date().toISOString(), notes: [] } }, '2999-01-01T00:00:00.000Z');
  } finally { seed.close(); }
  try {
    const result = await exec(process.execPath, ['--import', 'tsx', resolve('src/cli.ts'), 'run', '--due', '--no-publish', '--config', file], { timeout: cliStartupTimeout });
    assert.match(result.stdout, /"generated":0/); assert.match(result.stdout, /"candidates":0/);
    await assert.rejects(lstat(config.agent.runtimeDirectory), { code: 'ENOENT' });
    const store = new Store(config.storage.database);
    try {
      assert.equal((store.db.prepare('SELECT count(*) n FROM agent_calls').get() as { n: number }).n, 0);
      assert.equal((store.db.prepare('SELECT status FROM runs ORDER BY id DESC LIMIT 1').get() as { status: string }).status, 'succeeded');
    } finally { store.close(); }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('summary configuration failures exit partial while rendering healthy sources', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-source-config-'));
  const config = configSchema.parse({ version: 2, storage: { directory: root, database: join(root, 'data.sqlite') }, feed: { directory: join(root, 'content'), topics: join(root, 'topics.json') },
    agent: { command: resolve('tests/fixtures/acp-peer.mjs'), model: 'fixture/other', runtimeDirectory: join(root, 'tasks') },
    sources: ['one', 'two'].map(id => ({ id, name: id, intervalHours: 1, ...(id === 'one' ? { agent: { model: 'missing/no-model' } } : {}), streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }] })) });
  const file = join(root, 'config.json'), at = new Date().toISOString();
  await writeFile(file, JSON.stringify(config));
  await writeFile(config.feed.topics, JSON.stringify({ version: 1, topics: [{ id: 'coding', name: { en: 'Coding', 'zh-CN': '编程' }, description: 'Tools', aliases: [], deprecated: false }] }));
  const seed = new Store(config.storage.database);
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
    const store = new Store(config.storage.database);
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
  const config = configSchema.parse({ version: 2, storage: { directory: root, database: join(root, 'data.sqlite') }, feed: { directory: join(root, 'content'), topics: resolve('config/topics.json') },
    agent: { command: resolve('tests/fixtures/acp-peer.mjs'), model: 'deepseek/deepseek-flash', maxDailyCalls: 1, runtimeDirectory: join(root, 'tasks') }, sources: [{ id: 'hackernews', name: 'HN', intervalHours: 1, selection: { method: 'hn-engagement' }, streams: [{ id: 'main', channels: [
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
  const seed = new Store(config.storage.database); seed.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
  seed.finishCall(seed.startCall('previous', config.agent.model!, 1), 'succeeded', {}); seed.close();
  const args = ['--import', 'tsx', '--import', pathToFileURL(preload).href, resolve('src/cli.ts'), 'run', '--due', '--no-publish', '--config', file];
  const env = { ...process.env, NO_PROXY: '127.0.0.1', no_proxy: '127.0.0.1' };
  try {
    await assert.rejects(exec(process.execPath, args, { env, timeout: cliStartupTimeout }), error => {
      assert.equal((error as any).code, 1); assert.match((error as any).stderr, /Run incomplete/); return true;
    });
    const before = new Store(config.storage.database);
    let attempt: string;
    try { assert.ok(!before.isSelected('hackernews', '1')); attempt = before.channel('hackernews', 'main', 'fallback')!.last_attempt; }
    finally { before.close(); }
    await exec(process.execPath, args, { env: { ...env, FEEDGARDEN_FIXTURE_RANK: 'ready' }, timeout: cliStartupTimeout });
    const after = new Store(config.storage.database);
    try {
      assert.equal(after.channel('hackernews', 'main', 'fallback')!.last_attempt, attempt!, 'collection was skipped by its cadence');
      assert.ok(after.isSelected('hackernews', '1'));
      assert.deepEqual(after.db.prepare('SELECT status FROM runs ORDER BY id').all(), [{ status: 'partial' }, { status: 'succeeded' }]);
      assert.equal((after.db.prepare('SELECT state FROM feed_jobs').get() as { state: string }).state, 'pending', 'quota prevents any paid fixture call');
    } finally { after.close(); }
  } finally { await new Promise<void>(done => server.close(() => done())); await rm(root, { recursive: true, force: true }); }
});

test('migration commands discover JSON configs and reject ambiguous defaults before touching storage', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'feedgarden-config-'));
  const loader = pathToFileURL(resolve('node_modules/tsx/dist/loader.mjs')).href;
  const invoke = (command: string, ...args: string[]) => exec(process.execPath, ['--import', loader, resolve('src/cli.ts'), command, ...args], { cwd: directory });
  try {
    await writeFile(join(directory, 'feedgarden.json'), JSON.stringify({ version: 99 }));
    for (const command of ['migrate', 'rollback']) {
      await assert.rejects(invoke(command), error => /Unsupported configuration version/.test((error as any).stderr));
    }
    await writeFile(join(directory, 'feedgarden.jsonc'), JSON.stringify({ version: 98 }));
    await assert.rejects(invoke('migrate'), error => /Both JSON and JSONC exist/.test((error as any).stderr));
    await assert.rejects(invoke('migrate', '--config', 'feedgarden.json'), error => /Unsupported configuration version/.test((error as any).stderr));
    await assert.rejects(lstat(join(directory, '.local')), { code: 'ENOENT' });
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('quota deferral exits zero, retains pending items and finishes render/backup', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'feedgarden-cli-'));
  const config = configSchema.parse({ version: 2, storage: { directory, database: join(directory, 'data.sqlite') },
    feed: { directory: join(directory, 'content'), topics: resolve('config/topics.json') }, collection: { backfillDays: 3 }, publish: { auto: true }, agent: { command: resolve('tests/fixtures/acp-peer.mjs'), model: 'deepseek/deepseek-flash', maxDailyCalls: 1, runtimeDirectory: join(directory, 'tasks') },
    sources: [{ id: 'hackernews', name: 'Hacker News', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'rss', kind: 'feed', url: 'https://example.test/rss' }] }] }] });
  const file = join(directory, 'config.json'); await writeFile(file, JSON.stringify(config));
  const date = DateTime.now().setZone('Asia/Shanghai').minus({ days: 2 }).toISODate()!;
  const period = { start: date + 'T00:00:00.000Z' };
  const item: Item = { id: 'pending', source: 'hackernews', stream: 'main', channel: 'rss', title: 'Pending report', text: '',
    url: 'https://example.test/item', publishedAt: period.start, observedAt: new Date().toISOString(), metrics: {}, basis: 'published' };
  const seed = new Store(config.storage.database);
  seed.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
  seed.saveCollection('hackernews', 'main', 'rss', { items: [item], raw: [], coverage: { status: 'complete', to: item.observedAt, notes: [] } }, '2999-01-01T00:00:00.000Z');
  seed.finishCall(seed.startCall('previous', config.agent.model!, 1), 'succeeded', {}); seed.close();
  try {
    let status = 0, stderr = '';
    try { await exec(process.execPath, ['--import', 'tsx', resolve('src/cli.ts'), 'run', '--due', '--no-publish', '--config', file]); }
    catch (error) { status = Number((error as { code: number }).code); stderr = (error as { stderr: string }).stderr; }
    assert.equal(status, 0, stderr);
    const store = new Store(config.storage.database);
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
  const config = configSchema.parse({ version: 2, storage: { directory, database: join(directory, 'data.sqlite') }, agent: { model: 'deepseek/deepseek-flash' },
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
    const store = new Store(config.storage.database);
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
  const config=configSchema.parse({version:2,storage:{directory,database:join(directory,'data.sqlite')},agent:{model:'deepseek/deepseek-flash'},sources:[{id:'fixture',name:'Fixture',intervalHours:1,streams:[{id:'main',channels:[{id:'rss',kind:'feed',url:`http://127.0.0.1:${address.port}/stall`}]}]}]});
  const file=join(directory,'config.json'),preload=join(directory,'fault.mjs');
  await writeFile(file,JSON.stringify(config));
  await writeFile(preload,`import { Store } from ${JSON.stringify(pathToFileURL(resolve('src/store.ts')).href)};\nconst interval=globalThis.setInterval;\nglobalThis.setInterval=(fn,ms,...args)=>interval(fn,ms===30000?20:ms,...args);\nStore.prototype.renewLease=()=>{throw new Error('Injected lease renewal failure');};\n`);
  try {
    await assert.rejects(exec(process.execPath,['--import','tsx','--import',pathToFileURL(preload).href,resolve('src/cli.ts'),'collect','--config',file],{env:{...process.env,NO_PROXY:'127.0.0.1',no_proxy:'127.0.0.1'},timeout:cliStartupTimeout}),error=>Number((error as any).code)===1);
    if(requestStarted) assert.ok(performance.now()-requestStarted<5000,'collection must stop within five seconds of the active request');
    const store=new Store(config.storage.database);
    try {
      const run=store.db.prepare('SELECT status,details FROM runs').get() as {status:string;details:string};
      assert.equal(run.status,'failed');assert.match(run.details,/Injected lease renewal failure/);
      assert.equal(store.states().length,0,'cancelled input must not be committed');
      assert.deepEqual(store.db.prepare('SELECT * FROM job_lease').all(),[]);
      await assert.rejects(lstat(join(directory,'runner.lock')),error=>(error as NodeJS.ErrnoException).code==='ENOENT');
    } finally {store.close();}
  } finally {server.closeAllConnections();await new Promise<void>(done=>server.close(()=>done()));await rm(directory,{recursive:true,force:true});}
});

test('a compromised filesystem lock cancels work and its already released state does not mask the failure', async () => {
 const directory=await mkdtemp(join(tmpdir(),'feedgarden-lock-'));
 let requestStarted=0;
 const server=createServer((_request,response)=>{requestStarted ||= performance.now();response.writeHead(200);response.write('<rss>');void rm(join(directory,'runner.lock'),{recursive:true});});
 await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));const address=server.address();assert.ok(address&&typeof address!=='string');
 const config=configSchema.parse({version:2,storage:{directory,database:join(directory,'data.sqlite')},agent:{model:'deepseek/deepseek-flash'},sources:[{id:'fixture',name:'Fixture',intervalHours:1,streams:[{id:'main',channels:[{id:'rss',kind:'feed',url:`http://127.0.0.1:${address.port}/stall`}]}]}]});
 const file=join(directory,'config.json'),preload=join(directory,'fault.mjs');await writeFile(file,JSON.stringify(config));
 await writeFile(preload,'const timeout=globalThis.setTimeout;globalThis.setTimeout=(fn,ms,...args)=>timeout(fn,ms===10000?20:ms,...args);');
 try {
  await assert.rejects(exec(process.execPath,['--import','tsx','--import',pathToFileURL(preload).href,resolve('src/cli.ts'),'collect','--config',file],{env:{...process.env,NO_PROXY:'127.0.0.1',no_proxy:'127.0.0.1'},timeout:cliStartupTimeout}),error=>{assert.equal((error as any).code,1);assert.ok(!(error as any).stderr.includes('Lock is already released'));return true;});
  assert.ok(requestStarted && performance.now()-requestStarted<5000,'a compromised lock must stop the active request within five seconds');
  const store=new Store(config.storage.database);try {assert.equal((store.db.prepare('SELECT status FROM runs').get() as any).status,'failed');assert.equal(store.states().length,0);assert.deepEqual(store.db.prepare('SELECT * FROM job_lease').all(),[]);}finally{store.close();}
 }finally{server.closeAllConnections();await new Promise<void>(done=>server.close(()=>done()));await rm(directory,{recursive:true,force:true});}
});
