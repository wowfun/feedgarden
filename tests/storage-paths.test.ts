import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { configSchema, loadConfig } from '../src/config.js';
import { agentRuntime, storagePaths } from '../src/storage-paths.js';
import { validationDirectory } from '../scripts/validation-paths.js';
import { Store } from '../src/store.js';
import { backup } from '../src/backup.js';
import { collect } from '../src/collect.js';
import { adapters } from '../src/channels/index.js';

const source = { id: 'x', name: 'X', intervalHours: 1, streams: [{ id: 'fixture', channels: [{ id: 'cli', kind: 'x-cli' }] }] };
const input = { version: 2, agent: {}, sources: [source] };
const exec = promisify(execFile);
const loader = pathToFileURL(resolve('node_modules/tsx/dist/loader.mjs')).href;
const cli = resolve('src/cli.ts'), scheduler = resolve('scripts/schedule.ts');

test('ambiguous default config requires an explicit choice without creating storage', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'feedgarden-config-choice-')), cwd = process.cwd();
  try {
    await writeFile(join(temporary, 'feedgarden.json'), JSON.stringify({ ...input, storage: { root: 'json-storage' } }));
    await writeFile(join(temporary, 'feedgarden.jsonc'), '// Explicit JSONC choice\n' + JSON.stringify({ ...input, storage: { root: 'jsonc-storage' } }));
    process.chdir(temporary);
    assert.throws(() => loadConfig(), /Both JSON and JSONC exist; use --config/);
    assert.equal(loadConfig('feedgarden.json').storage.root, 'json-storage');
    assert.equal(loadConfig('feedgarden.jsonc').storage.root, 'jsonc-storage');
    assert.deepEqual((await readdir(temporary)).sort(), ['feedgarden.json', 'feedgarden.jsonc']);
  } finally { process.chdir(cwd); await rm(temporary, { recursive: true, force: true }); }
});

test('storage roots resolve without writes, and old independent path settings are rejected', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'feedgarden-paths-'));
  try {
    const config = configSchema.parse(input);
    assert.equal(config.storage.root, '.local/feedgarden');
    for (const root of ['.local/feedgarden', 'private data', join(temporary, 'absolute storage')]) {
      const paths = storagePaths({ root }, temporary);
      assert.equal(paths.database, join(resolve(temporary, root), 'data/feedgarden.sqlite'));
      assert.equal(paths.agents, join(paths.root, 'workspaces/agents'));
      assert.equal(paths.runner, join(paths.root, 'state/runner'));
      assert.equal(paths.archiveBackups, join(paths.root, 'backups/archives'));
      for (const path of Object.values(paths)) {
        assert.ok(isAbsolute(path));
        assert.ok(!relative(paths.root, path).startsWith('..'));
      }
      assert.equal(existsSync(paths.root), false);
    }
    for (const storage of [{ directory: temporary }, { database: ':memory:' }, { root: '' }, { root: '  ' }]) {
      assert.equal(configSchema.safeParse({ ...input, storage }).success, false);
    }
    assert.equal(configSchema.safeParse({ ...input, agent: { runtimeDirectory: temporary } }).success, false);
    const configured = configSchema.parse({ ...input, storage: { root: temporary } });
    assert.equal(agentRuntime(configured).runtimeDirectory, join(temporary, 'workspaces/agents'));
    assert.equal('runtimeDirectory' in configured.agent, false);
    assert.equal(configSchema.safeParse(JSON.parse(JSON.stringify(configured))).success, true);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test('custom root owns database, retained backups and Twitter collection tools', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'feedgarden-owned-paths-'));
  const config = configSchema.parse({ ...input, storage: { root: join(temporary, 'private data') }, feed: { directory: join(temporary, 'content') } });
  const paths = storagePaths(config.storage), store = new Store(paths.database);
  try {
    store.setMeta('fixture', 'preserved');
    for (let day = 1; day <= 35; day++) await backup(store, paths.backups, new Date(Date.UTC(2026, 8, day)).toISOString());
    assert.equal((await readdir(join(paths.backups, 'daily'))).length, 7);
    assert.equal((await readdir(join(paths.backups, 'weekly'))).length, 4);
    let toolDirectory: string | undefined;
    await collect(config, store, 'x', false, { ...adapters, 'x-cli': async context => {
      toolDirectory = context.twitterEnvironment;
      return { items: [], raw: [], coverage: { status: 'complete', to: context.now, notes: [] } };
    } });
    assert.equal(toolDirectory, paths.twitterEnvironment);
    const copies = await backup(store, paths.backups, '2026-10-26T00:00:00Z');
    for (const file of copies) {
      const restored = new Store(file);
      try { assert.equal(restored.meta('fixture'), 'preserved'); } finally { restored.close(); }
    }
    assert.equal(existsSync(join(temporary, '.local')), false);
  } finally { store.close(); await rm(temporary, { recursive: true, force: true }); }
});

test('removed storage settings explain storage.root before the CLI creates any state', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'feedgarden-removed-settings-'));
  const file = join(temporary, 'config.json'), root = join(temporary, 'new storage');
  try {
    const cases = [
      { storage: { root, database: 'old.sqlite' } },
      { storage: { root, directory: 'old-state' } },
      { storage: { root }, agent: { runtimeDirectory: 'old-agents' } },
      { storage: { root }, agent: { backend: 'dsh', model: 'deepseek-test', runtimeDirectory: 'old-agents' } },
    ];
    for (const fields of cases) {
      const value = { ...input, ...fields };
      assert.throws(() => configSchema.parse(value), /storage\.root/);
      await writeFile(file, JSON.stringify(value));
      await assert.rejects(exec(process.execPath, ['--import', loader, cli, 'backup', '--config', file], { cwd: temporary }), error => {
        assert.match((error as { stderr: string }).stderr, /storage\.root/); return true;
      });
      assert.deepEqual(await readdir(temporary), ['config.json']);
    }
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test('CLI help and rejected commands leave custom storage absent; backup honors config paths', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'feedgarden-cli-paths-'));
  const file = join(temporary, 'custom config.json'), root = join(temporary, 'private data');
  try {
    await writeFile(file, JSON.stringify({ ...input, storage: { root }, feed: { directory: join(temporary, 'content') } }));
    const invoke = (...args: string[]) => exec(process.execPath, ['--import', loader, cli, ...args, '--config', file], { cwd: temporary });
    const help = await invoke('--help');
    assert.doesNotMatch(help.stdout, /migrate|rollback/);
    for (const command of ['migrate', 'rollback', 'unknown']) await assert.rejects(invoke(command), error => {
      assert.match((error as { stderr: string }).stderr, /Unknown command/); return true;
    });
    assert.equal(existsSync(root), false);
    await invoke('backup');
    const paths = storagePaths(loadConfig(file).storage);
    assert.ok(existsSync(paths.database));
    assert.ok(existsSync(paths.runner));
    assert.equal(existsSync(paths.runner + '.lock'), false);
    assert.equal(existsSync(paths.agents), false);
    assert.equal(existsSync(join(temporary, '.local')), false);
    assert.equal(existsSync(join(temporary, 'content')), false);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test('scheduler and validation outputs follow selected config and explicit overrides', async t => {
  const temporary = await mkdtemp(join(tmpdir(), 'feedgarden-script-paths-'));
  const file = join(temporary, 'chosen config.json'), config = configSchema.parse({ ...input, storage: { root: join(temporary, 'private data') } });
  const paths = storagePaths(config.storage);
  try {
    await writeFile(file, JSON.stringify(config));
    await exec(process.execPath, ['--import', loader, scheduler, '--config', file], { cwd: temporary });
    const script = await readFile(join(paths.scheduler, 'run.sh'), 'utf8');
    assert.ok(script.includes("--config '" + file + "'"));
    assert.ok(script.includes("source '" + paths.runnerEnvironment + "'"));
    assert.equal(existsSync(paths.database), false);
    assert.equal(existsSync(paths.runnerEnvironment), false);
    const output = join(temporary, 'custom scheduler');
    await exec(process.execPath, ['--import', loader, scheduler, '--config', file, '--output', output], { cwd: temporary });
    assert.equal(await readFile(join(output, 'run.sh'), 'utf8'), script);
    const original = process.env.FEEDGARDEN_VALIDATION_DIR;
    t.after(() => { if (original === undefined) delete process.env.FEEDGARDEN_VALIDATION_DIR; else process.env.FEEDGARDEN_VALIDATION_DIR = original; });
    delete process.env.FEEDGARDEN_VALIDATION_DIR;
    assert.equal(validationDirectory(config), paths.validation);
    process.env.FEEDGARDEN_VALIDATION_DIR = join(temporary, 'evidence override');
    assert.equal(validationDirectory(config), process.env.FEEDGARDEN_VALIDATION_DIR);
    assert.equal(existsSync(paths.validation), false);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
