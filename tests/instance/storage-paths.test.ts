import { DateTime } from 'luxon';
import assert from 'node:assert/strict';
import { mkdtemp,readdir,readFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { setup } from '../../src/app/index.js';
import { instancePaths,loadInstance,userPaths } from '../../src/instance/index.js';
import { openTestInstance as openInstance } from '../support/database.js';
test('XDG defaults, absolute overrides and relative variables follow the specification', () => {
  assert.deepEqual(userPaths({ platform: 'linux', env: {}, home: '/home/用户' }), {
    configDir: '/home/用户/.config/feedgarden',
    configFile: '/home/用户/.config/feedgarden/feedgarden.jsonc',
    dataDir: '/home/用户/.local/share/feedgarden',
    stateDir: '/home/用户/.local/state/feedgarden',
    cacheDir: '/home/用户/.cache/feedgarden',
  });
  const paths = userPaths({
    platform: 'darwin',
    env: {
      XDG_CONFIG_HOME: 'relative',
      XDG_DATA_HOME: '/data',
      XDG_STATE_HOME: '',
      XDG_CACHE_HOME: '/cache',
    },
    home: '/Users/a',
  });
  assert.equal(paths.configDir, '/Users/a/.config/feedgarden');
  assert.equal(paths.dataDir, '/data/feedgarden');
  assert.equal(paths.cacheDir, '/cache/feedgarden');
});
test('Windows uses valid known folders, never guesses USERPROFILE', () => {
  const calls: string[] = [];
  const paths = userPaths({
    platform: 'win32',
    env: { APPDATA: 'relative', LOCALAPPDATA: 'D:\\Local', USERPROFILE: 'Z:\\Wrong' },
    knownFolder: (name) => {
      calls.push(name);
      return 'C:\\Roaming';
    },
  });
  assert.equal(paths.configDir, 'C:\\Roaming\\Feedgarden');
  assert.equal(paths.dataDir, 'D:\\Local\\Feedgarden\\Data');
  assert.deepEqual(calls, ['ApplicationData']);
  assert.throws(() => userPaths({ platform: 'win32', env: {}, knownFolder: () => '' }), /known folder/);
  assert.throws(() => userPaths({ platform: 'win32', env: {APPDATA:'\\relative-to-drive',LOCALAPPDATA:'C:relative'}, knownFolder: () => '' }), /known folder/);
});
test('workspace resolution does not create files and overrides are config-relative', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-paths-'));
  try {
    const paths = instancePaths({ workspace: root, dataDir: '数据' });
    assert.equal(paths.dataDir, join(root, '数据'));
    assert.deepEqual(await readdir(root), []);
    assert.throws(
      () => instancePaths({ workspace: root, config: join(root, 'a.json') }),
      /mutually exclusive/,
    );
    await setup({ workspace: root }, { timezone: 'Asia/Shanghai' });
    const loaded = loadInstance({ workspace: root }),
      store = openInstance(loaded.config, true);
    try {
      assert.equal(
        store.meta('cutoff'),
        DateTime.now().setZone('Asia/Shanghai').startOf('day').minus({ days: 7 }).toUTC().toISO(),
      );
      assert.equal(store.meta('instanceId'), loaded.config.instanceId);
    } finally {
      store.close();
    }
    assert.equal(await readFile(join(loaded.paths.dataDir, '.gitignore'), 'utf8'), '*\n');
    const before = await readFile(loaded.paths.configFile);
    assert.deepEqual(await readFile(loaded.paths.configFile), before);
    await assert.rejects(setup({ workspace: root }), /new instances only/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
