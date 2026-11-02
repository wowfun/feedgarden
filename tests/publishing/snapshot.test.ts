import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { markArtifact } from '../../src/platform/retention.js';
import { indexSession } from '../../src/publishing/snapshot.js';

test('index sessions prune abandoned scratch data but preserve active and unmarked directories', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-index-')), repository = join(root, 'repository'), cache = join(root, 'cache');
  await mkdir(repository); await mkdir(cache);
  execFileSync('git', ['init', '--quiet'], { cwd: repository });
  const stale = join(cache, 'git-stale'), unmarked = join(cache, 'git-unmarked');
  await mkdir(stale); await mkdir(unmarked);
  const age = async (directory: string, dead = false) => {
    const path = join(directory, '.feedgarden-retention.json'), value = JSON.parse(await readFile(path, 'utf8'));
    value.createdAt = '2000-01-01T00:00:00.000Z';
    if (dead) value.pid = 2_147_483_647;
    await writeFile(path, JSON.stringify(value));
  };
  let active: Awaited<ReturnType<typeof indexSession>> | undefined;
  try {
    active = await indexSession(repository, cache, true); await age(active.directory);
    await markArtifact(stale, 'git-validation', 'git-validation'); await age(stale, true);
    const next = await indexSession(repository, cache, true);
    try {
      await assert.rejects(stat(stale), { code: 'ENOENT' });
      for (const path of [active.directory, next.directory, unmarked, repository]) assert.ok((await stat(path)).isDirectory());
    } finally { await next.dispose(); }
  } finally { await active?.dispose(); await rm(root, { recursive: true, force: true }); }
});
