import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { configuredAgent, discoverFreeModels, generateBatch, paidTask, resolveAgent, useFreeModels } from '../../src/agent/index.js';
import { ModelError } from '../../src/contracts/model-errors.js';
import { agentRuntime } from '../../src/instance/index.js';
import { parseCommand, validateCommand } from '../../src/app/request.js';
import { editConfig, setup } from '../../src/app/index.js';
import { execute } from '../../src/app/operations.js';
import { loadInstance } from '../../src/instance/index.js';
import { createRun, executeRun, status } from '../../src/runs/index.js';
import { testContext } from '../support/context.js';
import { TestDatabase } from '../support/database.js';

const context = (root: string) => testContext({ version: 3, instanceId: '00000000-0000-4000-8000-000000000001',
  storage: { dataDir: root }, timezone: 'Asia/Shanghai', agent: { model: 'fixture/paid', effort: 'high',
    command: resolve('tests/support/fixtures/acp-peer.mjs'), maxDailyCalls: 7, inheritEnvironment: ['FEEDGARDEN_PEER_CONFIG'] },
  sources: [{ id: 'one', name: 'One', intervalHours: 24, agent: { model: 'fixture/source', effort: 'low' },
    streams: [{ id: 'main', routes: [{ id: 'feed', kind: 'feed' }] }] }] });

test('free catalog keeps backend order and excludes all calls during the instance calendar day', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-free-models-')), store = new TestDatabase(':memory:');
  const prior = process.env.FEEDGARDEN_PEER_CONFIG;
  try {
    process.env.FEEDGARDEN_PEER_CONFIG = join(root, 'settings.json');
    await writeFile(process.env.FEEDGARDEN_PEER_CONFIG, JSON.stringify({ models: [
      'fixture/paid', 'fixture/z-free', 'fixture/before-free', 'fixture/used-free', 'fixture/z-free',
      'fixture/running-free', 'fixture/failed-free', 'fixture/free-preview', 'fixture/tomorrow-free', 'bad line/free',
      'fixture/legacy-free', 'fixture/other-backend-free',
    ] }));
    for (const [model, at, status, account] of [
      ['fixture/before-free', '2026-11-01T15:59:59.999Z', 'succeeded', 'default'],
      ['fixture/used-free', '2026-11-01T16:00:00.000Z', 'succeeded', 'other'],
      ['fixture/running-free', '2026-11-01T16:01:00.000Z', 'running', 'default'],
      ['fixture/failed-free', '2026-11-01T17:00:00.000Z', 'failed', 'default'],
      ['fixture/tomorrow-free', '2026-11-02T16:00:00.000Z', 'failed', 'default'],
    ]) {
      const call = store.startCall('fixture', model!, 10, 'opencode', account!);
      store.db.prepare('UPDATE agent_calls SET at=?,status=? WHERE id=?').run(at!, status!, call);
    }
    for (const identity of ['fixture/legacy-free', '["dsh","default","fixture/other-backend-free"]', 'null', '{}', '["opencode","default",42]']) {
      const call = store.startCall('fixture', identity, 10);
      store.db.prepare('UPDATE agent_calls SET at=?,model=? WHERE id=?').run('2026-11-01T16:00:00.000Z', identity, call);
    }
    const config = context(root), selection = await discoverFreeModels(config, store, '2026-11-01T16:30:00Z');
    assert.equal(selection.day, '2026-11-02');
    assert.equal(selection.since, '2026-11-01T16:00:00.000Z');
    assert.equal(selection.until, '2026-11-02T16:00:00.000Z');
    assert.deepEqual(selection.models, ['fixture/z-free', 'fixture/before-free', 'fixture/tomorrow-free', 'fixture/other-backend-free']);
    assert.deepEqual(selection.skippedUsed, ['fixture/used-free', 'fixture/running-free', 'fixture/failed-free', 'fixture/legacy-free']);
    const selected = useFreeModels(config, selection), runtime = agentRuntime(selected);
    assert.equal(runtime.model, 'fixture/z-free'); assert.equal(runtime.effort, undefined);
    assert.equal(runtime.fallbackEnabled, true); assert.equal(runtime.freeModelRetryUntil, selection.until);
    assert.equal(runtime.maxDailyCalls, 7); assert.equal(config.agent.model, 'fixture/paid');
    assert.equal(selected.sources[0]!.agent?.model, runtime.model);
    assert.equal(selected.sources[0]!.agent?.effort, undefined);
    assert.throws(() => useFreeModels(config, { ...selection, models: [] }), /No unused free models/);
  } finally {
    if (prior === undefined) delete process.env.FEEDGARDEN_PEER_CONFIG; else process.env.FEEDGARDEN_PEER_CONFIG = prior;
    store.close(); await rm(root, { recursive: true, force: true });
  }
});

test('free retry skips failed models for the day and reuses the successful route', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-free-retry-')), store = new TestDatabase(':memory:');
  try {
    const since = new Date(Date.now() - 3600_000).toISOString(), until = new Date(Date.now() + 3600_000).toISOString();
    for (const at of [new Date(Date.parse(since) - 1).toISOString(), until]) {
      const call = store.startCall('older-selection', 'fixture/first-free', 7, 'opencode', 'default');
      store.finishCall(call, 'failed', { freeModelFailure: true });
      store.db.prepare('UPDATE agent_calls SET at=? WHERE id=?').run(at, call);
    }
    const selected = useFreeModels(context(root), { day: 'fixture', timezone: 'UTC', since, until,
      models: ['fixture/first-free', 'fixture/second-free'], skippedUsed: [] });
    const agent = await configuredAgent(agentRuntime(selected)), called: string[] = [];
    for (const key of ['one', 'two']) {
      let attempts = 0;
      const output = await paidTask(store, agent, key, {}, { resolver: configuredAgent,
        remaining: () => 5 - attempts, begin: () => { attempts++; }, validate: () => {},
        generate: async (candidate, _repair, directory) => {
          called.push(candidate.model);
          if (candidate.model === 'fixture/first-free') throw new ModelError('MODEL_FREE_QUOTA_EXHAUSTED', 'fixture');
          return { output: {}, directory, events: [], usage: [], execution: candidate.execution };
        },
      });
      assert.equal(output.agent?.model, 'fixture/second-free');
    }
    assert.deepEqual(called, ['fixture/first-free', 'fixture/second-free', 'fixture/second-free']);
    assert.equal(store.models.cooldown('opencode', 'fixture/default', 'fixture/first-free', new Date().toISOString()), undefined);
    const explicit = await paidTask(store, { ...agent, freeModelRetryUntil: undefined, freeModelRetrySince: undefined }, 'explicit', {}, {
      resolver: configuredAgent, remaining: () => 5, begin: () => {}, validate: () => {},
      generate: async (candidate, _repair, directory) => ({ output: {}, directory, events: [], usage: [], execution: candidate.execution }),
    });
    assert.equal(explicit.agent?.model, 'fixture/first-free', 'the free policy must not invent a provider cooldown for explicit selections');
  } finally { store.close(); await rm(root, { recursive: true, force: true }); }
});

test('free selection expires at the instance day boundary, including between fallback attempts', async t => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-free-rollover-')), store = new TestDatabase(':memory:');
  try {
    const until = '2026-11-02T16:00:00.000Z', boundary = Date.parse(until);
    let now = boundary - 1, begins = 0;
    t.mock.method(Date, 'now', () => now);
    const selected = useFreeModels(context(root), { day: '2026-11-02', timezone: 'Asia/Shanghai', since: '2026-11-01T16:00:00.000Z', until,
      models: ['fixture/first-free', 'fixture/second-free'], skippedUsed: [] });
    const agent = await configuredAgent(agentRuntime(selected)), called: string[] = [];
    const options = { resolver: configuredAgent, remaining: () => 5, begin: () => { begins++; }, validate: () => {},
      generate: async (candidate: typeof agent, _repair: string | undefined, directory: string) => {
        called.push(candidate.model);
        return { output: {}, directory, events: [], usage: [], execution: candidate.execution };
      },
    };
    assert.equal((await paidTask(store, agent, 'before-boundary', {}, options)).deferred, false);
    for (const instant of [boundary, boundary + 1]) {
      now = instant;
      await assert.rejects(paidTask(store, agent, 'expired', {}, options), { code: 'CONFIG_CHANGED' });
    }
    assert.equal(begins, 1);
    now = boundary - 1;
    await assert.rejects(paidTask(store, agent, 'cross-boundary', {}, { ...options,
      generate: async candidate => {
        called.push(candidate.model);
        now = boundary;
        throw new ModelError('MODEL_FREE_QUOTA_EXHAUSTED', 'fixture');
      },
    }), { code: 'CONFIG_CHANGED' });
    assert.deepEqual(called, ['fixture/first-free', 'fixture/first-free']);
    assert.equal(begins, 2, 'crossing midnight must not reserve another call');
    now = boundary - 1;
    await assert.rejects(paidTask(store, agentRuntime(selected), 'slow-resolution', {}, { ...options,
      resolver: async candidate => {
        const resolved = await configuredAgent(candidate);
        now = boundary;
        return resolved;
      },
    }), { code: 'CONFIG_CHANGED' });
    assert.equal(begins, 2, 'a resolution crossing midnight must not reserve a call');
  } finally { store.close(); await rm(root, { recursive: true, force: true }); }
});

test('OpenCode free quota classification is restricted to its exact generation protocol error', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-free-quota-'));
  const prior = process.env.FEEDGARDEN_PEER_CONFIG;
  const message = 'Internal error: Free usage limit reached. Connect a provider or subscribe to OpenCode Go to keep going, or switch models.';
  try {
    process.env.FEEDGARDEN_PEER_CONFIG = join(root, 'settings.json');
    const config = { ...agentRuntime(context(root)), model: 'fixture/other', timeoutSeconds: 10 };
    const input = { contractVersion: 2 as const, topics: { version: 1 as const, topics: [] }, items: [] };
    for (const [error, expected] of [
      [{ code: -32603, message }, 'MODEL_FREE_QUOTA_EXHAUSTED'],
      [{ code: -32603, message: message.replace('Internal error: ', '') }, 'MODEL_FREE_QUOTA_EXHAUSTED'],
      [{ code: -32603, message, data: { status: 401 } }, 'AUTH_REQUIRED'],
      [{ code: -32603, message, data: { status: 429 } }, 'PROVIDER_RATE_LIMITED'],
      [{ code: -32603, message, data: { status: 503 } }, 'MODEL_UNAVAILABLE'],
      [{ code: -32603, message: 'upstream says switch model; rate limited' }, undefined],
      [{ code: -32600, message }, undefined],
    ] as const) {
      await writeFile(process.env.FEEDGARDEN_PEER_CONFIG, JSON.stringify({ promptError: error }));
      const agent = await resolveAgent(config);
      await assert.rejects(generateBatch(agent, input), error => expected
        ? error instanceof ModelError && error.code === expected
        : error instanceof Error && !(error instanceof ModelError));
    }
  } finally {
    if (prior === undefined) delete process.env.FEEDGARDEN_PEER_CONFIG; else process.env.FEEDGARDEN_PEER_CONFIG = prior;
    await rm(root, { recursive: true, force: true });
  }
});

test('free model policy is explicit and rejects contradictory CLI selections', () => {
  for (const command of ['process', 'sync', 'relate']) assert.doesNotThrow(() => validateCommand(parseCommand([command, '--free-models'])));
  for (const args of [['collect', '--free-models'], ['process', '--free-models', '--model', 'fixture/paid'], ['process', '--free-models', '--effort', 'high']])
    assert.throws(() => validateCommand(parseCommand(args)));
});

test('run resume preserves its ordered free catalog and an empty catalog defers without a prompt', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-free-run-'));
  const prior = process.env.FEEDGARDEN_PEER_CONFIG;
  try {
    await setup({ workspace: root });
    const file = join(root, 'feedgarden.jsonc');
    await editConfig(file, ['sources'], []);
    await editConfig(file, ['agent'], context(root).agent);
    const { config } = loadInstance({ workspace: root });
    process.env.FEEDGARDEN_PEER_CONFIG = join(root, 'catalog.json');
    await writeFile(process.env.FEEDGARDEN_PEER_CONFIG, JSON.stringify({ models: ['fixture/z-free', 'fixture/a-free'] }));
    const run = await createRun(config, { 'free-models': true }, ['relate']);
    const first = await executeRun(config, run.id, run.token, async (config, ctx) => ({ ...await execute(config, ctx), state: 'deferred' }));
    assert.deepEqual((first.result as any).freeModels.models, ['fixture/z-free', 'fixture/a-free']);
    await writeFile(process.env.FEEDGARDEN_PEER_CONFIG, JSON.stringify({ models: [] }));
    const resumed = await executeRun(config, run.id, undefined, execute, true);
    assert.equal(resumed.state, 'completed');
    assert.deepEqual((resumed.result as any).freeModels.models, ['fixture/z-free', 'fixture/a-free']);
    const empty = await createRun(config, { 'free-models': true }, ['relate']);
    const deferred = await executeRun(config, empty.id, empty.token, execute);
    assert.equal(deferred.state, 'deferred');
    assert.deepEqual((deferred.result as any).freeModels.models, []);
    assert.equal((deferred.result as any).skipped[0].reason, 'no_unused_free_models');
    assert.equal((await status(config, empty.id)).runs[0]?.runExitCode, 4);
  } finally {
    if (prior === undefined) delete process.env.FEEDGARDEN_PEER_CONFIG; else process.env.FEEDGARDEN_PEER_CONFIG = prior;
    await rm(root, { recursive: true, force: true });
  }
});
