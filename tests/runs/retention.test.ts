import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { setup } from '../../src/app/index.js';
import { loadInstance } from '../../src/instance/index.js';
import { pruneRunLogs } from '../../src/runs/retention.js';
import { openInstance } from '../../src/storage/index.js';

test('run log retention removes only old terminal logs with matching database ownership', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-log-retention-'));
  await setup({ workspace: root });
  const { config } = loadInstance({ workspace: root }), store = openInstance(config), logs = join(config.paths.state, 'runs');
  await mkdir(logs, { recursive: true });
  const paths: string[] = [];
  try {
    for (const state of ['completed', 'running', 'queued', 'unknown', 'recent']) {
      const id = randomUUID(), path = join(logs, id + '.log'); paths.push(path);
      await writeFile(path, state);
      if (state !== 'recent') await utimes(path, new Date('2020-01-01'), new Date('2020-01-01'));
      if (state === 'unknown') continue;
      store.runs.create(id, 'process', '{}', 'config', '2020-01-01', id);
      if (state !== 'queued') store.runs.complete(state === 'recent' ? 'completed' : state, '{}', 0, '2020-01-01', id);
    }
    await pruneRunLogs(config, store);
    await assert.rejects(stat(paths[0]!), { code: 'ENOENT' });
    for (const path of paths.slice(1)) assert.ok(await stat(path));
  } finally { store.close(); await rm(root, { recursive: true, force: true }); }
});
