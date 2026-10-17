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
