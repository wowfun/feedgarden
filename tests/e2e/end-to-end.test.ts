import assert from 'node:assert/strict';
import { execFile,execFileSync } from 'node:child_process';
import { mkdir,mkdtemp,rm,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { editConfig,setup } from '../../src/app/index.js';
import { saveItems } from '../../src/content/index.js';
import type { Item } from '../../src/contracts/items.js';
import { loadInstance } from '../../src/instance/index.js';
import { openTestInstance as openInstance } from '../support/database.js';

test('one sync processes explicit history and reuses accepted work with inherited CRLF settings', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-e2e-')),
    workspace = join(root, 'instance'),
    remote = join(root, 'remote.git');
  const globalConfig = join(root, 'gitconfig');
  await writeFile(globalConfig, '[core]\n\tautocrlf = true\n\teol = crlf\n');
  await mkdir(remote);
  execFileSync('git', ['init', '--bare', '--initial-branch=main'], { cwd: remote, stdio: 'ignore' });
  await setup({ workspace });
  let loaded = loadInstance({ workspace });
  await editConfig(loaded.paths.configFile, ['sources'], []);
  await editConfig(loaded.paths.configFile, ['agent'], {
    command: resolve('tests/support/fixtures/acp-peer.mjs'),
    model: 'fixture/other',
    maxDailyCalls: 1,
    maxBatchItems: 1,
  });
  await editConfig(
    loaded.paths.configFile,
    ['targets'],
    [{ id: 'local', repository: remote, format: 'json' }],
  );
  loaded = loadInstance({ workspace });
  const item: Item = {
    source: 'web',
    id: 'a',
    stream: 'explicit',
    channel: 'public-http',
    title: 'Old saved evidence',
    text: '',
    url: 'https://example.invalid/a',
    publishedAt: '2000-01-01T00:00:00.000Z',
    observedAt: new Date().toISOString(),
    basis: 'published',
    metrics: {},
  };
  await saveItems(loaded.config, [item, { ...item, id: 'b', url: 'https://example.invalid/b' }]);
  const invoke = async () => {
    const args = [
      resolve('dist/src/cli.js'),
      '--workspace',
      workspace,
      'sync',
      '--publish',
      '--target',
      'local',
    ];
    try {
      return {
        code: 0,
        ...JSON.parse(
          (await promisify(execFile)(process.execPath, args, { timeout: 120000, windowsHide: true, env: { ...process.env, GIT_CONFIG_GLOBAL: globalConfig } })).stdout,
        ),
      };
    } catch (error) {
      const e = error as { code: number; stdout: string };
      return { code: e.code, ...JSON.parse(e.stdout) };
    }
  };
  try {
    const first = await invoke();
    assert.equal(first.code, 3, JSON.stringify(first));
    assert.equal(first.state, 'partial');
    assert.equal(first.result.summary.generated, 1);
    assert.equal(first.result.summary.pending, 1);
    assert.equal(first.result.targets[0].confirmed, true);
    assert.ok(first.result.retryAt);
    const path = execFileSync('git', ['ls-tree', '-r', '--name-only', 'main'], {
      cwd: remote,
      encoding: 'utf8',
    })
      .split('\n')
      .find((path) => /item-.*\.json$/.test(path))!;
    assert.equal(
      JSON.parse(execFileSync('git', ['show', 'main:' + path], { cwd: remote, encoding: 'utf8' })).date,
      item.publishedAt,
    );
    await editConfig(loaded.paths.configFile, ['agent', 'model'], 'deepseek/deepseek-flash');
    const second = await invoke();
    assert.equal(second.code, 0, JSON.stringify(second));
    assert.equal(second.result.summary.generated, 1);
    assert.equal(second.result.summary.pending, 0);
    const store = openInstance(loadInstance({ workspace }).config, true);
    try {
      assert.equal(store.statement('SELECT count(*) n FROM agent_calls').get().n, 2);
      assert.equal(store.statement('SELECT count(*) n FROM feed_summaries').get().n, 2);
      assert.equal(
        store.statement('SELECT count(*) n FROM fdg_run_tasks WHERE run_id=?').get(second.runId).n,
        2,
      );
    } finally {
      store.close();
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
