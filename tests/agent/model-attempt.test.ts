import assert from 'node:assert/strict';
import { mkdtemp,readdir,readFile,rm,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { configuredAgent,fixedTask,paidTask,recoverableAttempt } from '../../src/agent/index.js';
import { configSchema } from '../../src/contracts/configuration.js';
import { ModelError } from '../../src/contracts/model-errors.js';
import { ArtifactError } from '../../src/contracts/topics.mjs';
import { TestDatabase as Store } from '../support/database.js';
test('budgets are independent per model, effort shares its model ledger', () => {
  const store = new Store(':memory:');
  try {
    store.startCall('a', 'provider/a', 1);
    assert.throws(() => store.startCall('b', 'provider/a', 1));
    assert.doesNotThrow(() => store.startCall('b', 'provider/b', 1));
  } finally {
    store.close();
  }
});
test('fallback is explicit, independently metered and attempts cannot exchange artifacts', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-model-')),
    store = new Store(':memory:');
  const agent = await configuredAgent({
    ...configSchema.shape.agent.parse({
      model: 'provider/a',
      maxDailyCalls: 1,
      candidates: [{ model: 'provider/b' }],
    }),
    runtimeDirectory: root,
    fallbackEnabled: true,
  });
  try {
    store.startCall('spent', 'provider/a', 1);
    let attempts = 0;
    const workspaces: string[] = [];
    const result = await paidTask(
      store,
      agent,
      'task',
      {},
      {
        resolver: configuredAgent,
        remaining: () => 5 - attempts,
        begin: (workspace) => {
          attempts++;
          workspaces.push(workspace);
        },
        generate: async (selected, _repair, workspace) => ({
          output: { ok: true },
          directory: workspace,
          events: [],
          usage: [],
          execution: selected.execution,
        }),
        validate: () => {},
      },
    );
    assert.equal(result.agent?.model, 'provider/b');
    assert.equal(attempts, 1);
    assert.equal(await recoverableAttempt(store, workspaces[0]!, 'task', {}), true);
    assert.equal(await recoverableAttempt(store, workspaces[0]!, 'other', {}), false);
    const noFallback = await paidTask(
      store,
      { ...agent, fallbackEnabled: false },
      'next',
      {},
      {
        resolver: configuredAgent,
        remaining: () => 5,
        begin: () => assert.fail(),
        generate: async () => {
          throw Error('unreachable');
        },
        validate: () => {},
      },
    );
    assert.equal(noFallback.deferred, true);
  } finally {
    store.close();
    await rm(root, { recursive: true, force: true });
  }
});
test('account 429 suppresses sibling models; unknown errors never trigger fallback', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-model-')),
    store = new Store(':memory:');
  const agent = await configuredAgent({
    ...configSchema.shape.agent.parse({
      model: 'provider/a',
      candidates: [{ model: 'provider/b' }, { model: 'other/c' }],
    }),
    runtimeDirectory: root,
    fallbackEnabled: true,
  });
  try {
    let attempts = 0;
    const called: string[] = [];
    const result = await paidTask(
      store,
      agent,
      'task',
      {},
      {
        resolver: configuredAgent,
        remaining: () => 5 - attempts,
        begin: () => {
          attempts++;
        },
        generate: async (selected, _repair, workspace) => {
          called.push(selected.model);
          if (selected.model === 'provider/a')
            throw new ModelError(
              'PROVIDER_RATE_LIMITED',
              'fixture',
              new Date(Date.now() + 60000).toISOString(),
            );
          return { output: {}, directory: workspace, usage: [], events: [] };
        },
        validate: () => {},
      },
    );
    assert.equal(result.agent?.model, 'other/c');
    assert.deepEqual(called, ['provider/a', 'other/c']);
    store.db.exec('DELETE FROM fdg_model_cooldowns');
    called.length = 0;
    const unknown = await paidTask(
      store,
      agent,
      'unknown',
      {},
      {
        resolver: configuredAgent,
        remaining: () => 5,
        begin: () => {},
        generate: async (selected) => {
          called.push(selected.model);
          throw new Error('upstream says switch model; rate limited');
        },
        validate: () => {},
      },
    );
    assert.equal(unknown.deferred, false);
    assert.deepEqual(called, ['provider/a']);
  } finally {
    store.close();
    await rm(root, { recursive: true, force: true });
  }
});
test('accepted auxiliary output remains valid after primary model recovery', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-semantic-')),
    store = new Store(':memory:');
  const agent = { ...configSchema.shape.agent.parse({ model: 'fixture/a' }), runtimeDirectory: root };
  let calls = 0;
  const input = { taskId: 'x', parts: [{ id: 'one', text: 'Evidence.' }] };
  const generator: any = async (_a: unknown, _k: unknown, _i: unknown, _r: unknown, directory: string) => {
    calls++;
    return {
      output: { taskId: 'x', inputIds: ['one'], facts: 'Evidence.' },
      directory,
      usage: [],
      events: [],
    };
  };
  try {
    const first = await fixedTask(store, agent, 'transcript', input, { generator });
    assert.equal(first.state, 'accepted');
    const second = await fixedTask(store, { ...agent, model: 'fixture/b' }, 'transcript', input, {
      generator,
    });
    assert.equal(second.state, 'accepted');
    assert.equal(calls, 1);
  } finally {
    store.close();
    await rm(root, { recursive: true, force: true });
  }
});

test('fallback consumes at most five real attempts and cannot recover another attempt identity', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-attempt-limit-')),
    store = new Store(':memory:');
  const agent = await configuredAgent({
    ...configSchema.shape.agent.parse({
      model: 'fixture/0',
      candidates: Array.from({ length: 8 }, (_, i) => ({ model: 'fixture/' + (i + 1) })),
    }),
    runtimeDirectory: root,
    fallbackEnabled: true,
  });
  try {
    let count = 0;
    const spaces: string[] = [];
    const outcome = await paidTask(
      store,
      agent,
      'limit',
      { id: 'content' },
      {
        resolver: configuredAgent,
        remaining: () => 5 - count,
        begin: (workspace) => {
          count++;
          spaces.push(workspace);
        },
        generate: async () => {
          throw new ModelError('MODEL_UNAVAILABLE', 'Fixture unavailable');
        },
        validate: () => {},
      },
    );
    assert.equal(outcome.deferred, false);
    assert.equal(count, 5);
    assert.equal(new Set(spaces).size, 5);
    assert.equal(store.statement('SELECT count(*) n FROM agent_calls').get().n, 5);
    await writeFile(join(spaces[0]!, 'attempt.json'), await readFile(join(spaces[1]!, 'attempt.json')));
    assert.equal(await recoverableAttempt(store, spaces[0]!, 'limit', { id: 'content' }), false);
    await rm(join(spaces[1]!, 'attempt.json'));
    assert.equal(await recoverableAttempt(store, spaces[1]!, 'limit', { id: 'content' }), false);
  } finally {
    store.close();
    await rm(root, { recursive: true, force: true });
  }
});

test('artifact validation gets one repair and never selects a fallback model', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-attempt-repair-')),
    store = new Store(':memory:');
  const agent = await configuredAgent({
    ...configSchema.shape.agent.parse({ model: 'fixture/a', candidates: [{ model: 'fixture/b' }] }),
    runtimeDirectory: root,
    fallbackEnabled: true,
  });
  try {
    const calls: string[] = [];
    let count = 0;
    const outcome = await paidTask(
      store,
      agent,
      'repair',
      {},
      {
        resolver: configuredAgent,
        remaining: () => 5 - count,
        begin: () => {
          count++;
        },
        generate: async (selected, _repair, workspace) => {
          calls.push(selected.model);
          return { output: {}, directory: workspace, events: [], usage: [] };
        },
        validate: () => {
          throw new ArtifactError('Fixture malformed artifact');
        },
      },
    );
    assert.equal(outcome.deferred, false);
    assert.equal(count, 2);
    assert.deepEqual(calls, ['fixture/a', 'fixture/a']);
  } finally {
    store.close();
    await rm(root, { recursive: true, force: true });
  }
});

test('effort-only fallback resolves its own execution and leaves no quota-only workspace', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-effort-')), store = new Store(':memory:');
  const agent = await configuredAgent({ ...configSchema.shape.agent.parse({
    model: 'provider/a', effort: 'low', candidates: [{ model: 'provider/a', effort: 'high', maxDailyCalls: 2 }], maxDailyCalls: 2,
  }), runtimeDirectory: root, fallbackEnabled: true });
  try {
    let attempts = 0;
    const efforts: string[] = [];
    const options = {
      resolver: configuredAgent, remaining: () => 5 - attempts, begin: () => { attempts++; },
      generate: async (selected: typeof agent, _repair: string | undefined, directory: string) => {
        efforts.push(selected.effort!);
        if (selected.effort === 'low') throw new ModelError('MODEL_UNAVAILABLE', 'Try the next explicit route');
        return { output: {}, directory, events: [], usage: [], execution: selected.execution };
      },
      validate: () => {},
    };
    const result = await paidTask(store, agent, 'effort', {}, options);
    assert.deepEqual(efforts, ['low', 'high']);
    assert.equal(result.agent?.execution.effort, 'high');
    const before = await readdir(root);
    assert.equal((await paidTask(store, agent, 'over-budget', {}, options)).deferred, true);
    assert.deepEqual(await readdir(root), before);
  } finally { store.close(); await rm(root, { recursive: true, force: true }); }
});

test('authentication failure stops paid task processing after recording the failed call', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-auth-')), store = new Store(':memory:');
  const agent = await configuredAgent({ ...configSchema.shape.agent.parse({ model: 'provider/a' }), runtimeDirectory: root });
  try {
    await assert.rejects(paidTask(store, agent, 'auth', {}, {
      remaining: () => 5, begin: () => {},
      generate: async () => { throw new ModelError('AUTH_REQUIRED', 'Credentials need attention'); },
      validate: () => {},
    }), (error: unknown) => error instanceof ModelError && error.code === 'AUTH_REQUIRED');
    assert.equal(store.statement("SELECT count(*) n FROM agent_calls WHERE status='failed'").get().n, 1);
  } finally { store.close(); await rm(root, { recursive: true, force: true }); }
});
