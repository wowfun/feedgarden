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
    feed: { directory: join(directory, 'content'), topics: resolve('config/topics.json') }, collection: { backfillDays: 3 }, publish: { auto: true }, agent: { model: 'deepseek/deepseek-flash', maxDailyCalls: 1 },
    sources: [{ id: 'hackernews', name: 'Hacker News', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'rss', kind: 'feed', url: 'https://example.test/rss' }] }] }] });
  const file = join(directory, 'config.json'); await writeFile(file, JSON.stringify(config));
  const date = DateTime.now().setZone('Asia/Shanghai').minus({ days: 2 }).toISODate()!;
  const period = { start: date + 'T00:00:00.000Z' };
  const item: Item = { id: 'pending', source: 'hackernews', stream: 'main', channel: 'rss', title: 'Pending report', text: '',
    url: 'https://example.test/item', publishedAt: period.start, observedAt: new Date().toISOString(), metrics: {}, basis: 'published' };
  const seed = new Store(config.storage.database);
  seed.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
  seed.saveCollection('hackernews', 'main', 'rss', { items: [item], raw: [], coverage: { status: 'complete', to: item.observedAt, notes: [] } }, '2999-01-01T00:00:00.000Z');
  seed.finishCall(seed.startCall('previous', config.agent.model, 1), 'succeeded', {}); seed.close();
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
