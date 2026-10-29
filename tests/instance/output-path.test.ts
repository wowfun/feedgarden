import assert from 'node:assert/strict';
import { realpathSync } from 'node:fs';
import { mkdir, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { setup } from '../../src/app/index.js';
import { assertExportDirectory, loadInstance } from '../../src/instance/index.js';

test('instance ancestor aliases allow exports while private aliases and nested links remain unsafe', async () => {
  const root = realpathSync(await mkdtemp(join(tmpdir(), 'fdg-output-alias-')));
  const actual = join(root, 'actual'), alias = join(root, 'alias'), outside = join(root, 'outside');
  try {
    await mkdir(join(actual, 'workspace'), { recursive: true });
    await mkdir(outside);
    const type = process.platform === 'win32' ? 'junction' : 'dir';
    await symlink(actual, alias, type);
    const workspace = join(alias, 'workspace');
    await setup({ workspace });
    const { config, paths } = loadInstance({ workspace });
    assert.doesNotThrow(() => assertExportDirectory(paths, config.feed.directory));
    assert.doesNotThrow(() => assertExportDirectory(paths, join(workspace, 'public')));
    assert.throws(() => assertExportDirectory(paths, join(actual, 'workspace', '.local', 'feedgarden', 'state', 'public')), /overlaps private/);
    const linkedOutput = join(workspace, 'linked-output');
    await symlink(outside, linkedOutput, type);
    assert.throws(() => assertExportDirectory(paths, join(linkedOutput, 'public')), /symbolic link/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
