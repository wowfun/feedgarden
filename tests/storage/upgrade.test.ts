import assert from 'node:assert/strict';
import { mkdir,mkdtemp,readFile,rm,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fixedTask,reportSkill,reportTaskSkill } from '../../src/agent/index.js';
import { upgrade } from '../../src/app/index.js';
import { corePublications,publication,recommendationManifest,summarize,summaryItem,summaryKey } from '../../src/content/index.js';
import type { Item } from '../../src/contracts/items.js';
import { agentRuntime,loadInstance } from '../../src/instance/index.js';
import { hash } from '../../src/platform/hash.js';
import { testContext } from '../support/context.js';
import { openTestInstance as openInstance,TestDatabase as Store } from '../support/database.js';

test('default-root upgrade retries an interrupted copy from its original backup', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-upgrade-retry-'));
  const oldRoot = join(root, '.local', 'feedgarden'),
    data = join(oldRoot, 'data');
  try {
    await mkdir(join(oldRoot, 'tools'), { recursive: true });
    await mkdir(join(data, 'tools', 'proof.txt'), { recursive: true });
    await writeFile(join(oldRoot, 'tools', 'proof.txt'), 'durable tool metadata');
    await writeFile(
      join(root, 'feedgarden.jsonc'),
      JSON.stringify({ version: 2, agent: { model: 'fixture/a' }, sources: [] }),
    );
    const legacy = new Store(join(data, 'feedgarden.sqlite'));
    legacy.setMeta('cutoff', '2026-01-01T00:00:00Z');
    legacy.close();
    await assert.rejects(upgrade({ workspace: root }));
    const journal = JSON.parse(await readFile(join(data, 'recovery', 'upgrade.json'), 'utf8'));
    assert.equal(journal.complete, false);
    assert.equal(JSON.parse(await readFile(join(root, 'feedgarden.jsonc'), 'utf8')).version, 2);
    await rm(join(data, 'tools', 'proof.txt'), { recursive: true });
    await upgrade({ workspace: root });
    const loaded = loadInstance({ workspace: root }),
      reader = openInstance(loaded.config, true);
    try {
      assert.equal(reader.meta('cutoff'), '2026-01-01T00:00:00Z');
    } finally {
      reader.close();
    }
    assert.equal(loaded.config.instanceId, journal.instanceId);
    assert.equal(await readFile(join(data, 'tools', 'proof.txt'), 'utf8'), 'durable tool metadata');
    const original = new Store(join(data, 'backups', 'upgrade', 'original.sqlite'), { readonly: true });
    try {
      assert.equal(original.meta('instanceId'), undefined);
    } finally {
      original.close();
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('explicit upgrade preserves custom-root data, cutoff and pending task recovery paths', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-upgrade-')),
    oldRoot = join(root, 'custom'),
    workspace = join(oldRoot, 'workspaces', 'agents', 'task-fixture');
  await mkdir(join(oldRoot, 'data'), { recursive: true });
  await mkdir(workspace, { recursive: true });
  await writeFile(
    join(workspace, '.feedgarden-workspace.json'),
    JSON.stringify({ version: 1, task: 'fixture' }),
  );
  await writeFile(join(workspace, 'result.json'), '{}');
  await writeFile(
    join(root, 'feedgarden.jsonc'),
    JSON.stringify({
      version: 2,
      storage: { root: 'custom' },
      agent: { model: 'fixture/a' },
      sources: [
        {
          id: 'one',
          name: 'One',
          intervalHours: 1,
          streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }],
        },
      ],
    }),
  );
  const legacy = new Store(join(oldRoot, 'data', 'feedgarden.sqlite'));
  legacy.setMeta('cutoff', '2026-01-01T00:00:00Z');
  legacy
    .statement(
      "INSERT INTO feed_tasks(key,kind,input,workspace,state,created_at) VALUES('fixture','transcript','{}',?,'running',?)",
    )
    .run(workspace, new Date().toISOString());
  legacy.close();
  try {
    const preview = await upgrade({ workspace: root }, { dryRun: true });
    assert.equal(preview.oldRoot, oldRoot);
    await upgrade({ workspace: root });
    const loaded = loadInstance({ workspace: root }),
      store = openInstance(loaded.config, true);
    try {
      assert.equal(store.meta('cutoff'), '2026-01-01T00:00:00Z');
      const task = store.statement('SELECT workspace FROM feed_tasks').get();
      assert.ok(task.workspace.startsWith(loaded.paths.dataDir));
      assert.equal(await readFile(join(task.workspace, 'result.json'), 'utf8'), '{}');
    } finally {
      store.close();
    }
    assert.equal((await readFile(join(oldRoot, 'data', 'feedgarden.sqlite'))).length > 0, true);
    assert.equal(loaded.config.sources[0]!.streams[0]!.routes[0]!.kind, 'feed');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('upgrade reuses proven summaries, pending artifacts, numbering and relation verdicts without paid calls', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-upgrade-evidence-')),
    oldRoot = join(root, 'legacy'),
    content = join(root, 'content');
  const at = new Date().toISOString(),
    date = new Date(Date.now() - 3600000).toISOString(),
    identity = { backend: 'opencode', version: 'injected', model: 'fixture/a' };
  const source = {
    id: 'one',
    name: 'One',
    intervalHours: 1,
    streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }],
  };
  await mkdir(join(oldRoot, 'data'), { recursive: true });
  await mkdir(content);
  await writeFile(join(root, 'topics.json'), JSON.stringify({ version: 1, topics: [] }));
  await writeFile(
    join(root, 'feedgarden.jsonc'),
    '// keep root comment\n' +
      JSON.stringify(
        {
          version: 2,
          storage: { root: 'legacy' },
          feed: { directory: 'content', topics: 'topics.json' },
          agent: { model: 'fixture/a' },
          sources: [source],
        },
        null,
        2,
      ).replace('"channels": [', '"channels": [\n // keep route comment'),
  );
  const seed = testContext({
    version: 3,
    instanceId: '00000000-0000-4000-8000-000000000001',
    agent: { model: 'fixture/a' },
    sources: [{ ...source, streams: [{ id: 'main', routes: [{ id: 'feed', kind: 'feed' }] }] }],
  });
  const item: Item = {
    source: 'one',
    id: 'saved',
    stream: 'main',
    channel: 'feed',
    title: 'Saved title',
    text: '',
    url: 'https://example.test/saved',
    publishedAt: date,
    observedAt: at,
    basis: 'published',
    metrics: {},
  };
  const skillHash = hash(await reportSkill(['one'])),
    legacyKey = hash({
      ...summaryItem(item, seed.agent.maxItemChars),
      ...identity,
      skillHash,
      contractVersion: 2,
      summaryRevision: 3,
    }),
    copy = {
      source: 'one',
      id: 'saved',
      topics: [],
      en: { title: 'Saved title', summary: '' },
      'zh-CN': { title: '保留标题', summary: '' },
    };
  const input = { taskId: 'pending', parts: [{ id: 'part', text: 'Verified evidence.' }] },
    taskKey = hash({
      kind: 'transcript',
      input,
      ...identity,
      revision: 1,
      skill: await reportTaskSkill('transcript'),
    }),
    workspace = join(oldRoot, 'workspaces', 'agents', 'task-pending');
  await mkdir(workspace, { recursive: true });
  await writeFile(
    join(workspace, '.feedgarden-workspace.json'),
    JSON.stringify({ version: 1, task: taskKey }),
  );
  await writeFile(
    join(workspace, 'result.json'),
    JSON.stringify({ taskId: 'pending', inputIds: ['part'], facts: 'Verified evidence.' }),
  );
  const posts = [];
  for (const name of ['a', 'b']) {
    const body = `---\npublish: true\ncontent_type: post\ntitle: Model release ${name}\ndate: ${date}\nsource_url: https://example.test/${name}\n---\nRelated model release evidence.\n`;
    await writeFile(join(content, name + '.md'), body);
    posts.push(publication(name + '.md', body, at)!);
  }
  const oldPolicy = hash({ revision: 1, ...identity, skill: await reportTaskSkill('relations') }),
    pairInput = hash({ paths: posts.map((p) => p.path), hashes: posts.map((p) => p.hash) }),
    pairKey = hash({ input: pairInput, policy: oldPolicy }),
    expiry = new Date(Date.parse(date) + 72 * 3600000).toISOString();
  const db = new Store(join(oldRoot, 'data/feedgarden.sqlite'));
  db.setMeta('cutoff', '2000-01-01T00:00:00Z');
  db.saveCollection(
    'one',
    'main',
    'feed',
    { items: [item], raw: [], coverage: { status: 'complete', to: at, notes: [] } },
    '',
  );
  db.statement("INSERT INTO feed_jobs VALUES(?,?,?,?,'ready',1,'',NULL)").run(
    'one',
    'saved',
    legacyKey,
    JSON.stringify({ item, firstSeen: at }),
  );
  db.statement('INSERT INTO feed_cache VALUES(?,?)').run(legacyKey, JSON.stringify(copy));
  db.statement('INSERT INTO feed_summaries VALUES(?,?,?,?,?)').run(
    'one',
    'saved',
    legacyKey,
    JSON.stringify({ item, copy, firstSeen: at, date, dateBasis: 'published', updated: at }),
    at,
  );
  db.statement('INSERT INTO feed_item_paths VALUES(?,?,?,?)').run('one', 'saved', date.slice(0, 10), 41);
  db.statement(
    "INSERT INTO feed_tasks(key,kind,input,workspace,state,created_at) VALUES(?,'transcript',?,?,'running',?)",
  ).run(taskKey, JSON.stringify(input), workspace, at);
  db.statement('INSERT INTO feed_relation_pairs VALUES(?,?,?,?,?,?,?)').run(
    pairKey,
    posts[0]!.path,
    posts[1]!.path,
    posts[0]!.hash,
    posts[1]!.hash,
    JSON.stringify({ id: pairKey, verdict: 'same-event', policy: oldPolicy, execution: identity }),
    expiry,
  );
  const call = db.startCall('legacy', 'fixture/a', 80);
  db.finishCall(call, 'succeeded', { execution: identity });
  db.close();
  try {
    await upgrade({ workspace: root });
    const loaded = loadInstance({ workspace: root }),
      store = openInstance(loaded.config);
    try {
      assert.equal(
        store.statement('SELECT cache_key FROM feed_summaries').get().cache_key,
        summaryKey(item, seed.agent, skillHash),
      );
      assert.equal(store.statement('SELECT number FROM feed_item_paths WHERE id=?').get('saved').number, 41);
      const task = await fixedTask(store, agentRuntime(loaded.config), 'transcript', input, {
        generator: async () => {
          throw new Error('Must recover the saved artifact');
        },
      });
      assert.equal(task.state, 'accepted');
      assert.equal(task.performed, false);
      const nextPolicy = hash({ revision: 1, skill: await reportTaskSkill('relations') }),
        pair = store
          .statement('SELECT * FROM feed_relation_pairs WHERE key=?')
          .get(hash({ input: pairInput, policy: nextPolicy }));
      assert.equal(pair.expires_at, expiry);
      assert.deepEqual(JSON.parse(pair.output).execution, identity);
      const recommendations = await recommendationManifest(
        corePublications(loaded.config, store, at),
        store,
        at,
      );
      assert.equal(recommendations.items['a.md']?.[0]?.path, 'b.md');
      const result = await summarize(
        loaded.config,
        store,
        {},
        async () => {
          throw new Error('Accepted summary must not be regenerated');
        },
        at,
        async (item) => item,
      );
      assert.equal(result.generated, 0);
      assert.equal(store.statement('SELECT count(*) n FROM agent_calls').get().n, 1);
      assert.match(await readFile(loaded.paths.configFile, 'utf8'), /keep root comment/);
      assert.match(await readFile(loaded.paths.configFile, 'utf8'), /keep route comment/);
    } finally {
      store.close();
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
