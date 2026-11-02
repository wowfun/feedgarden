import { XMLValidator } from 'fast-xml-parser';
import { DateTime } from 'luxon';
import assert from 'node:assert/strict';
import { mkdtemp,readFile,readdir,rm,stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { setup } from '../../src/app/index.js';
import { loadInstance } from '../../src/instance/index.js';
import { createRun,prepareSchedule,scheduledScope } from '../../src/runs/index.js';
import { openTestInstance } from '../support/database.js';

test('scheduled ticks wait for pending work retryAt and retry when it is due', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-schedule-retry-'));
  try {
    await setup({ workspace: root });
    const { config } = loadInstance({ workspace: root });
    const at = DateTime.fromISO('2026-10-29T07:00:00+08:00');
    const tick = (time: DateTime) => scheduledScope(config, 'hackernews', config.instanceId, time);
    const { key } = tick(at);
    const retryAt = at.plus({ minutes: 45 }).toUTC().toISO()!;
    const run = await createRun(config, { source: 'hackernews', scheduledKey: key }, ['process']);
    const store = openTestInstance(config);
    try {
      for (const state of ['deferred', 'partial']) {
        store.statement('UPDATE fdg_runs SET state=?,result=? WHERE id=?').run(state, JSON.stringify({ state, result: { retryAt } }), run.id);
        assert.deepEqual(tick(at.plus({ minutes: 15 })), { skip: 'retry_not_due', key, runId: run.id, retryAt });
        assert.equal(tick(at.plus({ minutes: 45 })).skip, undefined);
      }
      store.statement("UPDATE fdg_runs SET state='failed' WHERE id=?").run(run.id);
      assert.equal(tick(at).skip, undefined);
    } finally { store.close(); }
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('native schedules use stable argv, no shell, and instance-local readiness across host timezones', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-schedules-'));
  try {
    await setup({ workspace: root });
    const { config } = loadInstance({ workspace: root });
    for (const platform of ['windows', 'systemd', 'launchd']) {
      const result = await prepareSchedule(config, platform, join(root, platform));
      assert.equal(result.activated, false);
      const runtimes = await readdir(config.paths.runtime);
      assert.equal(runtimes.length, 1);
      assert.ok(await stat(join(config.paths.runtime, runtimes[0]!, '.feedgarden-pinned')));
      for (const file of result.files) {
        const body = await readFile(file, 'utf8');
        assert.doesNotMatch(body, /wsl|cmd\.exe|run\.sh/);
        if (platform !== 'systemd') assert.equal(XMLValidator.validate(body), true);
        if (platform === 'windows') {
          assert.match(body, /<ExecutionTimeLimit>PT0S/);
          assert.match(body, /<MultipleInstancesPolicy>IgnoreNew/);
          assert.ok(
            Date.now() - Date.parse(/<StartBoundary>(.*?)<\/StartBoundary>/.exec(body)![1]!) < 86400000,
          );
        }
      }
    }
    assert.equal(
      scheduledScope(config, 'hackernews', config.instanceId, DateTime.fromISO('2026-10-29T05:59:00+08:00'))
        .skip,
      'not_ready',
    );
    assert.equal(
      scheduledScope(config, 'hackernews', config.instanceId, DateTime.fromISO('2026-10-29T06:00:00+08:00'))
        .skip,
      undefined,
    );
    assert.throws(() => scheduledScope(config, 'hackernews', 'foreign'), /another instance/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
