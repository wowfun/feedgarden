import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { editConfig, setup } from '../../src/app/index.js';
import type { Item } from '../../src/contracts/items.js';
import { loadInstance } from '../../src/instance/index.js';
import { openTestInstance } from '../support/database.js';

test('explicit admission preserves the live channel checkpoint, schedule and gaps', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-admission-'));
  await setup({ workspace: root });
  const { config } = loadInstance({ workspace: root }), store = openTestInstance(config);
  const at = '2026-10-29T00:00:00.000Z';
  const item: Item = { source: 'rss', id: 'saved', stream: 'main', channel: 'feed', title: 'Saved', text: 'Evidence', url: 'https://example.test/saved', publishedAt: at, observedAt: at, basis: 'published', metrics: {} };
  try {
    store.saveCollection('rss', 'main', 'feed', { items: [], raw: [], cursor: 'live', coverage: { status: 'partial', to: '2026-10-29T12:00:00Z', notes: ['Real gap'] } }, '2026-10-30T00:00:00Z');
    const states = store.states(), gaps = store.statement('SELECT * FROM gaps').all();
    store.inbox.save([item], at);
    assert.equal(store.inbox.accept(), 1);
    assert.deepEqual(store.states(), states);
    assert.deepEqual(store.statement('SELECT * FROM gaps').all(), gaps);
    assert.equal(store.items('rss')[0]?.metadata?.fdgExplicitAdmission, true);
    assert.equal(store.statement('SELECT count(*) n FROM observations').get().n, 1);
    assert.equal(store.statement('SELECT count(*) n FROM fdg_subscriptions').get().n, 1);
  } finally { store.close(); await rm(root, { recursive: true, force: true }); }
});

test('a source checkout without dist completes work without preparing an advisory runtime', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-no-build-')), checkout = join(root, 'checkout'), workspace = join(root, 'instance');
  try {
    for (const path of ['src', 'resources', 'package.json']) await cp(resolve(path), join(checkout, path), { recursive: true });
    await symlink(resolve('node_modules'), join(checkout, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    await setup({ workspace });
    const { paths } = loadInstance({ workspace });
    await editConfig(paths.configFile, ['sources'], []);
    const output = await promisify(execFile)(process.execPath, ['--import', 'tsx', join(checkout, 'src/cli.ts'), '--workspace', workspace, 'process'], { timeout: 30000 });
    const result = JSON.parse(output.stdout);
    assert.equal(result.state, 'completed');
    assert.ok(result.runId);
    const next = result.nextActions[0];
    const status = JSON.parse((await promisify(execFile)(next.executable, next.argv, { timeout: 30000 })).stdout);
    assert.equal(status.result.runs[0].state, 'completed');
  } finally { await rm(root, { recursive: true, force: true }); }
});
