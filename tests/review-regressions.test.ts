import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { Store } from '../src/store.js';
import { configSchema } from '../src/config.js';
import { relate } from '../src/relations.js';

test('unchanged metadata does not write', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-schema-'));
  const path = join(root, 'data.sqlite'), writer = new Store(path);
  try {
    writer.setMeta('policy', 'same');
    const before = writer.db.prepare('SELECT total_changes() n').get();
    writer.setMeta('policy', 'same');
    assert.deepEqual(writer.db.prepare('SELECT total_changes() n').get(), before);
    writer.setMeta('policy', 'changed'); assert.equal(writer.meta('policy'), 'changed');
  } finally { writer.close(); await rm(root, { recursive: true, force: true }); }
});

test('a current store opens beside an active writer after initialization', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-reader-'));
  const path = join(root, 'data.sqlite'), writer = new Store(path);
  try {
    writer.db.exec('BEGIN IMMEDIATE');
    let reader: Store | undefined;
    try { reader = new Store(path); assert.equal(reader.meta('content_version'), '0'); }
    finally { reader?.close(); writer.db.exec('ROLLBACK'); }
  } finally { writer.close(); await rm(root, { recursive: true, force: true }); }
});

test('additive schema upgrades run atomically and failed constructors close their handles', async t => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-upgrade-')), path = join(root, 'data.sqlite');
  const old = new Store(path);
  old.db.exec("DELETE FROM feed_meta WHERE key='runtime_schema_revision'; DROP TABLE feed_relation_pairs;");
  old.close();
  try {
    const upgraded = new Store(path);
    assert.equal(upgraded.meta('runtime_schema_revision'), '6');
    assert.deepEqual(upgraded.db.prepare('SELECT * FROM feed_relation_pairs').all(), []);
    upgraded.db.exec("DELETE FROM feed_meta WHERE key='runtime_schema_revision';"); upgraded.close();
    t.mock.method(Store.prototype, 'setMeta', () => { throw new Error('Injected schema failure'); });
    assert.throws(() => new Store(path), /Injected schema failure/);
    // Windows refuses this removal if the failed constructor leaked its handle.
    await rm(root, { recursive: true, force: true });
  } finally { t.mock.restoreAll(); await rm(root, { recursive: true, force: true }); }
});

test('revision five discovery decisions become due for recheck without losing their reason',async()=>{
 const root=await mkdtemp(join(tmpdir(),'feedgarden-discovery-upgrade-')),path=join(root,'data.sqlite');
 const seed=new Store(path);
 seed.db.exec("DROP TABLE feed_discovery_skips; CREATE TABLE feed_discovery_skips(source TEXT NOT NULL,stream TEXT NOT NULL,url TEXT NOT NULL,reason TEXT NOT NULL,PRIMARY KEY(source,stream,url)); INSERT INTO feed_discovery_skips VALUES ('anthropic','news','https://www.anthropic.com/news/changed','non-article'); DROP INDEX feed_jobs_cached_order;");
 seed.setMeta('runtime_schema_revision','5');seed.close();
 try{
  const store=new Store(path);try{
   assert.equal(store.meta('runtime_schema_revision'),'6');
   assert.deepEqual(store.db.prepare('SELECT * FROM feed_discovery_skips').get(),{source:'anthropic',stream:'news',url:'https://www.anthropic.com/news/changed',reason:'non-article',checked_at:''});
   assert.ok(store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='feed_jobs_cached_order'").get());
  }finally{store.close();}
 }finally{await rm(root,{recursive:true,force:true});}
});

test('simultaneous expired-lease contenders yield one owner and an explicit lease rejection', { timeout: 20_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-contenders-')), path = join(root, 'data.sqlite');
  const seed = new Store(path); seed.db.prepare("INSERT INTO job_lease VALUES (1,'expired','1970-01-01T00:00:00.000Z')").run(); seed.close();
  const script = join(root, 'contender.mjs'), barrier = join(root, 'read-complete');
  await writeFile(script, `import { Store } from ${JSON.stringify(pathToFileURL(resolve('src/store.ts')).href)};
import { existsSync } from 'node:fs';
const store = new Store(process.argv[2]), owner = process.argv[3], wait = new Int32Array(new SharedArrayBuffer(4));
// Hold any read-before-write implementation until both snapshots exist, making
// the former WAL upgrade race deterministic rather than relying on timing.
const prepare = store.db.prepare.bind(store.db);
store.db.prepare = sql => {
 const statement = prepare(sql);
 if (/^SELECT owner,expires FROM job_lease/.test(sql)) {
  const get = statement.get.bind(statement);
  statement.get = (...args) => {
   const value = get(...args); process.send({ snapshot: true });
   const deadline = Date.now() + 10000;
   while (!existsSync(process.argv[4]) && Date.now() < deadline) Atomics.wait(wait, 0, 0, 10);
   return value;
  };
 }
 return statement;
};
process.on('message', () => {
 let result;
 try { store.acquireLease(owner); result = { acquired: owner }; }
 catch (error) { result = { error: error.message, code: error.code }; }
 finally { store.close(); }
 process.send(result, () => process.disconnect());
});
process.send({ ready: true });
`);
  const children = [1, 2].map(id => spawn(process.execPath, ['--import', 'tsx', script, path, String(id), barrier], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] }));
  try {
    let ready = 0, snapshots = 0;
    const results = await Promise.all(children.map(child => new Promise<{ acquired?: string; error?: string }>((done, reject) => {
      let outcome: { acquired?: string; error?: string } | undefined, stderr = '';
      child.stderr?.on('data', data => { stderr += String(data); });
      child.on('error', reject);
      child.on('message', value => {
        const message = value as { ready?: boolean; snapshot?: boolean; acquired?: string; error?: string };
        if (message.ready && ++ready === children.length) children.forEach(process => process.send!('acquire'));
        else if (message.snapshot && ++snapshots === children.length) writeFileSync(barrier, 'ready');
        else if (message.acquired || message.error) outcome = message;
      });
      child.on('close', code => { if (code === 0 && outcome) done(outcome); else reject(new Error(stderr || 'Contender exited without an outcome')); });
    })));
    assert.equal(results.filter(result => result.acquired).length, 1);
    assert.deepEqual(results.filter(result => result.error).map(result => result.error), ['Another Feedgarden job holds the database lease']);
  } finally { children.forEach(child => child.kill()); await rm(root, { recursive: true, force: true }); }
});

test('relations that expire during an earlier model call are no longer pending', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-15T12:00:00Z') });
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-expiry-'));
  const store = new Store(join(root, 'data.sqlite'));
  try {
    const config = configSchema.parse({ version: 2, storage: { root }, feed: { directory: join(root, 'content') }, agent: { model: 'deepseek/deepseek-flash', maxBatchItems: 1 }, sources: [{ id: 'one', name: 'One', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }] }] });
    await mkdir(config.feed.directory);
    for (const name of ['a', 'b', 'c']) await writeFile(join(config.feed.directory, name + '.md'), `---\npublish: true\ncontent_type: post\ntitle: Atlas release ${name}\ndate: 2026-10-12T12:01:00Z\n---\nAtlas released Model One.`);
    let calls = 0;
    const result = await relate(config, store, { generator: async (_a, _k, value, _r, directory) => {
      calls++; t.mock.timers.tick(120_000);
      const input = value as { pairs: { id: string }[] };
      return { output: { pairs: input.pairs.map(pair => ({ id: pair.id, verdict: 'same-event', reason: 'Same release', evidence: ['Atlas released Model One.', 'Atlas released Model One.'] })) }, directory: directory!, usage: [], events: [] };
    } });
    assert.equal(calls, 1); assert.equal(result.candidates, 3);
    assert.equal(result.judged, 1); assert.equal(result.pending, 0); assert.equal(result.deferred, false);
  } finally { store.close(); await rm(root, { recursive: true, force: true }); }
});

test('Windows schedule starts at generation time and ignores overlapping instances', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-schedule-'));
  try {
    const before = Date.now();
    await promisify(execFile)(process.execPath, ['--import', 'tsx', resolve('scripts/schedule.ts'), '--distro', 'Fixture', '--output', root]);
    const xml = await readFile(join(root, 'Feedgarden.xml'), 'utf8');
    const boundary = Date.parse(/<StartBoundary>(.*?)<\/StartBoundary>/.exec(xml)![1]!);
    assert.ok(boundary >= before && boundary <= Date.now(), 'StartBoundary must describe this generation');
    assert.match(xml, /<MultipleInstancesPolicy>IgnoreNew<\/MultipleInstancesPolicy>/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
