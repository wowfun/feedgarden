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
import { saveItems } from '../../src/content/index.js';
import { testContext } from '../support/context.js';
import { openTestInstance, TestDatabase } from '../support/database.js';

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
      assert.equal((await paidTask(store, agent, 'expired', {}, options)).deferred, true);
    }
    assert.equal(begins, 1);
    now = boundary - 1;
    const rollover = await paidTask(store, agent, 'cross-boundary', {}, { ...options,
      generate: async candidate => {
        called.push(candidate.model);
        now = boundary;
        throw new ModelError('MODEL_FREE_QUOTA_EXHAUSTED', 'fixture');
      },
    });
    assert.equal(rollover.deferred, true);
    assert.deepEqual(called, ['fixture/first-free', 'fixture/first-free']);
    assert.equal(begins, 2, 'crossing midnight must not reserve another call');
    now = boundary - 1;
    const slowResolution = await paidTask(store, agentRuntime(selected), 'slow-resolution', {}, { ...options,
      resolver: async candidate => {
        const resolved = await configuredAgent(candidate);
        now = boundary;
        return resolved;
      },
    });
    assert.equal(slowResolution.deferred, true);
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

test('free model policy accepts an explicit opt-out and rejects contradictory CLI selections', () => {
  for (const command of ['process', 'sync', 'relate']) {
    assert.doesNotThrow(() => validateCommand(parseCommand([command, '--free-models'])));
    const disabled = parseCommand([command, '--no-free-models']);
    assert.doesNotThrow(() => validateCommand(disabled));
    assert.equal(disabled.options['free-models'], false);
  }
  for (const args of [['collect', '--free-models'], ['collect', '--no-free-models'], ['process', '--free-models', '--no-free-models'], ['process', '--free-models', '--model', 'fixture/paid'], ['process', '--free-models', '--effort', 'high']])
    assert.throws(() => validateCommand(parseCommand(args)));
  for (const command of ['collect', 'export'])
    assert.throws(() => validateCommand(parseCommand([command, '--no-free-models'])), { message: 'Unsupported option for ' + command + ': --no-free-models' });
});

test('run scope freezes the OpenCode default and honors explicit routing and other backends', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-default-free-'));
  try {
    await setup({ workspace: root });
    const { config } = loadInstance({ workspace: root });
    for (const command of ['process', 'sync', 'relate']) {
      for (const [args, expected] of [
        [[], true], [['--free-models'], true], [['--no-free-models'], false],
        [['--model', 'fixture/paid'], false], [['--effort', 'high'], false], [['--fallback'], false],
      ] as const) {
        const request = parseCommand([command, ...args]);
        validateCommand(request);
        const run = await createRun(config, request.options, request.positionals);
        const frozen = (await status(config, run.id)).runs[0]!.scope;
        assert.equal(frozen.options['free-models'], expected, [command, ...args].join(' '));
        assert.equal(frozen.policies.freeModels, expected);
      }
      const dsh = { ...config, agent: { ...config.agent, backend: 'dsh' as const, model: 'fixture/other' } };
      const run = await createRun(dsh, {}, [command]);
      assert.equal((await status(dsh, run.id)).runs[0]!.scope.options['free-models'], false);
      await assert.rejects(createRun(dsh, { 'free-models': true }, [command]), /requires OpenCode/);
    }
    const collect = await createRun(config, {}, ['collect']);
    assert.equal((await status(config, collect.id)).runs[0]!.scope.options['free-models'], undefined);
  } finally { await rm(root, { recursive: true, force: true }); }
});

async function withModelWork(command: 'process' | 'relate', runTest: (config: ReturnType<typeof loadInstance>['config'], catalog: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'fdg-free-run-'));
  const prior = process.env.FEEDGARDEN_PEER_CONFIG;
  try {
    await setup({ workspace: root });
    const file = join(root, 'feedgarden.jsonc');
    await editConfig(file, ['sources'], context(root).sources);
    await editConfig(file, ['agent'], context(root).agent);
    const { config } = loadInstance({ workspace: root });
    process.env.FEEDGARDEN_PEER_CONFIG = join(root, 'catalog.json');
    const at = new Date().toISOString();
    if (command === 'process') {
      await saveItems(config, [{ source: 'one', id: 'saved', stream: 'explicit', channel: 'public-http', title: 'Saved evidence',
        text: 'Supplied facts', url: 'https://example.invalid/saved', publishedAt: '2000-01-01T00:00:00Z', observedAt: at, basis: 'published', metrics: {} }]);
    } else {
      const store = openTestInstance(config);
      try {
        for (const id of ['one', 'two']) store.db.prepare('INSERT INTO feed_archive_files VALUES (?,?)').run(id + '.md',
          Buffer.from(`---\npublish: true\ncontent_type: post\ntitle: Related article ${id}\ndate: "${at}"\n---\nShared evidence for a pending pair.\n`));
      } finally { store.close(); }
    }
    await runTest(config, process.env.FEEDGARDEN_PEER_CONFIG);
  } finally {
    if (prior === undefined) delete process.env.FEEDGARDEN_PEER_CONFIG; else process.env.FEEDGARDEN_PEER_CONFIG = prior;
    await rm(root, { recursive: true, force: true });
  }
}

for (const command of ['relate', 'process'] as const) test(command + ' resumes an exhausted selection after instance midnight', async t => {
  let clock = Date.now();
  t.mock.method(Date, 'now', () => clock);
  await withModelWork(command, async (config, catalog) => {
    const run = await createRun(config, {}, [command]);
    await writeFile(catalog, JSON.stringify({ models: [] }));
    const first = await executeRun(config, run.id, run.token, execute);
    const result = first.result as any;
    assert.ok(['partial', 'deferred'].includes(first.state), JSON.stringify(first));
    assert.deepEqual(result.freeModels.models, []);
    assert.equal(result.retryAt, result.freeModels.until);
    assert.ok(result.skipped.some((row: any) => row.reason === 'no_unused_free_models'));
    assert.ok(result.skipped.some((row: any) => row.reason === 'configured_routing_bypassed' && row.model === 'fixture/paid'));
    if (command === 'process') assert.ok(result.skipped.some((row: any) => row.source === 'one' && row.model === 'fixture/source'));
    await writeFile(catalog, JSON.stringify({ models: ['fixture/next-free'] }));
    const sameDay = await executeRun(config, run.id, undefined, execute, true);
    assert.deepEqual((sameDay.result as any).freeModels, result.freeModels);
    clock = Date.parse(result.retryAt);
    if (command === 'relate') {
      await writeFile(catalog, JSON.stringify({ models: [] }));
      const stillEmpty = await executeRun(config, run.id, undefined, execute, true);
      assert.equal(stillEmpty.state, 'deferred');
      const retry = Date.parse((stillEmpty.result as any).retryAt);
      assert.ok(retry > clock);
      clock = retry;
      await writeFile(catalog, JSON.stringify({ models: ['fixture/next-free'] }));
    }
    const resumed = await executeRun(config, run.id, undefined, execute, true);
    assert.equal(resumed.state, 'completed', JSON.stringify(resumed));
    const next = resumed.result as any;
    assert.notEqual(next.freeModels.day, result.freeModels.day);
    assert.equal(Date.parse(next.freeModels.since), clock);
    assert.deepEqual(next.freeModels.models, ['fixture/next-free']);
    assert.equal(command === 'process' ? next.summary.generated : next.relations.judged, 1);
    assert.equal(next.retryAt, undefined);
    const reader = openTestInstance(config, true);
    try {
      const calls = reader.modelCallRecords();
      assert.ok(calls.length);
      assert.ok(calls.every(row => JSON.parse(row.model)[2] === 'fixture/next-free'));
    } finally { reader.close(); }
  });
});

test('same-day resume retains a nonempty ordered selection after free-quota exhaustion', async () => {
  await withModelWork('relate', async (config, catalog) => {
    const models = ['fixture/z-free', 'fixture/a-free'];
    await writeFile(catalog, JSON.stringify({ models, promptError: { code: -32603, message: 'Free usage limit reached. Connect a provider or subscribe to OpenCode Go to keep going, or switch models.' } }));
    const run = await createRun(config, {}, ['relate']);
    const first = await executeRun(config, run.id, run.token, execute);
    assert.equal(first.state, 'deferred', JSON.stringify(first));
    await writeFile(catalog, JSON.stringify({ models: [...models].reverse() }));
    const resumed = await executeRun(config, run.id, undefined, execute, true);
    assert.equal(resumed.state, 'deferred', JSON.stringify(resumed));
    assert.deepEqual((resumed.result as any).freeModels.models, models);
    const reader = openTestInstance(config, true);
    try { assert.equal(reader.modelCallRecords().length, 2); } finally { reader.close(); }
  });
});
