import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp,readFile,rm,stat,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { setup } from '../../src/app/index.js';
import { loadInstance } from '../../src/instance/index.js';
import { cancel,createRun,executeRun,status,type Executor } from '../../src/runs/index.js';
import { openTestInstance as openInstance } from '../support/database.js';
const done: Executor = async () => ({ state: 'completed', result: { ok: true }, issues: [] });
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'fdg-runs-'));
  await setup({ workspace: root });
  const { config } = loadInstance({ workspace: root });
  return { root, config, cleanup: () => rm(root, { recursive: true, force: true }) };
}
test('runs retain their frozen scope, reject config drift and superseded processing, and respect queued cancellation', async () => {
  const f = await fixture();
  try {
    const first = await createRun(f.config, { source: 'hackernews' }, ['process']);
    const deferred: Executor = async (_config, ctx) => {
      ctx.saveCheckpoint('accepted', { complete: true, value: 7 });
      return { state: 'deferred', result: { pending: 1 }, issues: [] };
    };
    assert.equal((await executeRun(f.config, first.id, first.token, deferred)).state, 'deferred');
    const before = (await status(f.config, first.id)).runs[0]!.scope;
    assert.equal(
      (await executeRun({ ...f.config, observedDays: 8 }, first.id, undefined, done, true)).issues[0]!.code,
      'CONFIG_CHANGED',
    );
    assert.deepEqual((await status(f.config, first.id)).runs[0]!.scope, before);
    const second = await createRun(f.config, { source: 'hackernews' }, ['process']);
    assert.equal((await executeRun(f.config, second.id, second.token, done)).state, 'completed');
    assert.equal(
      (await executeRun(f.config, first.id, undefined, done, true)).issues[0]!.code,
      'RUN_SUPERSEDED',
    );
    const third = await createRun(f.config, {}, ['collect']);
    await cancel(f.config, third.id);
    assert.equal(
      (
        await executeRun(f.config, third.id, third.token, async (_c, ctx) => {
          ctx.signal.throwIfAborted();
          return done(_c, ctx);
        })
      ).state,
      'interrupted',
    );
    assert.equal((await status(f.config, third.id)).runs[0]!.runExitCode, 130);
  } finally {
    await f.cleanup();
  }
});
test('read-only status coexists with an active runner and detects a confirmed dead worker without mutation', async () => {
  const f = await fixture();
  try {
    const run = await createRun(f.config, {}, ['collect']),
      store = openInstance(f.config);
    store
      .statement("UPDATE fdg_runs SET state='running',pid=NULL,heartbeat='2000-01-01T00:00:00Z' WHERE id=?")
      .run(run.id);
    store.close();
    const reported = (await status(f.config, run.id)).runs[0]!;
    assert.equal(reported.state, 'interrupted');
    const reader = openInstance(f.config, true);
    try {
      assert.equal(reader.statement('SELECT state FROM fdg_runs WHERE id=?').get(run.id).state, 'running');
    } finally {
      reader.close();
    }
  } finally {
    await f.cleanup();
  }
});

for (const fault of ['lease', 'lock'] as const) test(`${fault} loss aborts active work, records interruption and releases ownership`, async t => {
  const f=await fixture();
  const timeout=globalThis.setTimeout;
  if(fault==='lock') t.mock.method(globalThis,'setTimeout',((fn: (...args:any[])=>void,ms?:number,...args:any[])=>timeout(fn,ms===10000?20:ms,...args)) as typeof setTimeout);
  try {
    const run=await createRun(f.config,{},['collect']);let cancelled=false;
    const outcome=await executeRun(f.config,run.id,run.token,async(_config,ctx)=>{
      const stopped=new Promise<void>(resolve=>ctx.signal.addEventListener('abort',()=>{cancelled=true;resolve();},{once:true}));
      if(fault==='lease') ctx.store.renewLease=()=>{throw new Error('Injected lease renewal failure');};
      else await rm(f.config.paths.runner+'.lock',{recursive:true});
      await stopped;
      ctx.saveCheckpoint('should-not-commit',{});
      throw new Error('Cancellation must reject checkpoint writes');
    });
    assert.equal(cancelled,true);assert.equal(outcome.state,'interrupted');
    assert.match(JSON.stringify(outcome.issues),fault==='lease'?/Injected lease renewal failure/:/ENOENT|compromised|Unable to update/i);
    const reader=openInstance(f.config,true);
    try { assert.deepEqual(reader.statement('SELECT * FROM job_lease').all(),[]);assert.equal(reader.runs.find(run.id)?.checkpoint,'{}'); }
    finally{reader.close();}
    assert.equal((await status(f.config,run.id)).runs[0]!.runExitCode,130);
    await assert.rejects(stat(f.config.paths.runner+'.lock'),{code:'ENOENT'});
  } finally { await f.cleanup(); }
});
test('detached package worker completes after its launcher exits and returns a stable usable status action', async () => {
  const f = await fixture();
  try {
    const file = join(f.root, 'feedgarden.jsonc'),
      raw = JSON.parse(await readFile(file, 'utf8'));
    raw.sources = [];
    await writeFile(file, JSON.stringify(raw));
    const child = await promisify(execFile)(
      process.execPath,
      [resolve('dist/src/cli.js'), '--workspace', f.root, 'process', '--detach'],
      { timeout: 90000, windowsHide: true },
    );
    const envelope = JSON.parse(child.stdout);
    assert.equal(envelope.issues.length, 0);
    assert.ok(envelope.runId);
    assert.match(child.stderr, /runId:/);
    const next = envelope.nextActions[0];
    assert.ok(next.argv[0].includes('runtime'));
    const checked = JSON.parse(
      (
        await promisify(execFile)(next.executable, [...next.argv, '--wait-seconds', '20'], {
          timeout: 30000,
          windowsHide: true,
        })
      ).stdout,
    );
    assert.equal(checked.result.runs[0].state, 'completed');
    assert.equal(checked.result.runs[0].runExitCode, 0);
  } finally {
    await f.cleanup();
  }
});
