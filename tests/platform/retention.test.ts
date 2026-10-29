import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { completeArtifact, holdArtifact, markArtifact, pinArtifact, pruneArtifacts } from '../../src/platform/retention.js';

test('retention keeps ownership boundaries, active users, pins, recent artifacts and newest per group', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-retention-')), cache = join(root, 'cache'), outside = join(root, 'outside');
  await mkdir(cache); await mkdir(outside); await writeFile(join(outside, 'keep'), 'User data');
  const make = async (name: string, age: number, options: { owner?: string; group?: string; active?: boolean } = {}) => {
    const path = join(cache, name); await mkdir(path);
    await markArtifact(path, 'ui', options.owner ?? 'instance', options.group ?? 'one');
    const marker = join(path, '.feedgarden-retention.json'), value = JSON.parse(await readFile(marker, 'utf8'));
    value.createdAt = new Date(Date.now() - age * 86400_000).toISOString();
    await writeFile(marker, JSON.stringify(value));
    if (!options.active) await completeArtifact(path);
    return path;
  };
  try {
    const expired = await make('expired', 80), newest = await make('newest', 40), other = await make('other-target', 90, { group: 'two' });
    const pinned = await make('pinned', 90), active = await make('active', 90, { active: true }), user = await make('serving', 90);
    const foreign = await make('foreign', 90, { owner: 'another-instance' }), recent = await make('recent', 1, { group: 'three' });
    const successful = await make('last-success', 80, { group: 'failures' }), failed = await make('later-failure', 40, { group: 'failures' });
    await completeArtifact(failed, false);
    await pinArtifact(pinned); await holdArtifact(user); await mkdir(join(cache, 'unmarked'));
    await symlink(outside, join(cache, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.deepEqual(await pruneArtifacts(cache, 'ui', 'instance', 1, 30), [expired]);
    await assert.rejects(stat(expired), { code: 'ENOENT' });
    for (const path of [newest, other, pinned, active, user, foreign, recent, successful, failed, join(cache, 'unmarked')]) assert.ok(await stat(path));
    assert.equal(await readFile(join(outside, 'keep'), 'utf8'), 'User data');
    assert.deepEqual(await pruneArtifacts(join(cache, 'linked'), 'ui', 'instance', 0, 0), []);
  } finally { await rm(root, { recursive: true, force: true }); }
});
