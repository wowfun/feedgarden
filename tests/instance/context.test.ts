import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { configSchema } from '../../src/contracts/configuration.js';
import { agentRuntime, configuration, createInstanceContext, instancePaths, withExecutionPolicy } from '../../src/instance/index.js';
import { hash } from '../../src/platform/hash.js';
import { configHash } from '../../src/runs/lifecycle.js';
import type { ReadStorage, Storage } from '../../src/storage/index.js';

const settings = () => configSchema.parse({
  version: 3, instanceId: '00000000-0000-4000-8000-000000000001',
  agent: { model: 'fixture/model' }, sources: [],
});

test('instance paths and execution policy survive value copies without identity binding', () => {
  const base = createInstanceContext(settings(), instancePaths({ workspace: join(tmpdir(), 'fdg-context-contract') }));
  const fallback = withExecutionPolicy(base, { fallbackEnabled: true });
  const copied = { ...fallback, storage: { ...fallback.storage }, agent: { ...fallback.agent } };
  assert.equal(agentRuntime(copied).runtimeDirectory, base.paths.agents);
  assert.equal(agentRuntime(copied).fallbackEnabled, true);
  assert.equal(agentRuntime(base).fallbackEnabled, false);
  assert.ok(Object.isFrozen(base) && Object.isFrozen(base.paths) && Object.isFrozen(base.executionPolicy));
});

test('runtime paths and fallback never enter persisted configuration or its original hash', () => {
  const config = settings();
  const first = createInstanceContext(config, instancePaths({ workspace: join(tmpdir(), 'fdg-first') }));
  const second = createInstanceContext(config, instancePaths({ workspace: join(tmpdir(), 'fdg-second') }), { fallbackEnabled: true });
  assert.deepEqual(configuration(first), config);
  assert.equal(configHash(first), hash(config));
  assert.equal(configHash(second), hash(config));
  assert.equal(JSON.stringify(configuration(second)), JSON.stringify(config));
});

// Compile-time boundary checks: fixture SQL is available only through tests/support.
function storageCapabilities(reader: ReadStorage, writer: Storage) {
  // @ts-expect-error Read sessions cannot mutate metadata.
  reader.setMeta('key', 'value');
  // @ts-expect-error Read repositories cannot cancel a run.
  reader.runs.cancel('run');
  // @ts-expect-error Application writers cannot prepare raw SQL.
  writer.statement('DELETE FROM items');
  // @ts-expect-error The SQLite connection is private to storage implementations.
  writer.db;
}
void storageCapabilities;

