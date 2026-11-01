import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmod,copyFile,mkdir,mkdtemp,readFile,rm,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter,join } from 'node:path';
import test from 'node:test';
import { editConfig,setup } from '../../src/app/index.js';
import { targetSchema } from '../../src/contracts/configuration.js';
import { loadInstance } from '../../src/instance/index.js';
import { adoptTarget,confirmPush,inspectTarget,publish } from '../../src/publishing/index.js';
import { openTestInstance as openInstance } from '../support/database.js';
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
async function fixture(nonempty = false) {
  const root = await mkdtemp(join(tmpdir(), 'fdg-publish-')),
    remote = join(root, 'remote.git'),
    workspace = join(root, 'instance'),
    seed = join(root, 'seed');
  await mkdir(remote);
  git(remote, 'init', '--bare', '--initial-branch=main');
  if (nonempty) {
    await mkdir(seed);
    git(seed, 'init', '--initial-branch=main');
    git(seed, 'config', 'user.email', 'test@example.test');
    git(seed, 'config', 'user.name', 'Fixture');
    await mkdir(join(seed, 'feed'));
    await writeFile(join(seed, 'feed', 'history.md'), 'Historical content');
    await writeFile(join(seed, 'README.md'), 'Unmanaged');
    git(seed, 'add', '.');
    git(seed, 'commit', '-m', 'Seed');
    git(seed, 'remote', 'add', 'origin', remote);
    git(seed, 'push', 'origin', 'main');
  }
  await setup({ workspace });
  let loaded = loadInstance({ workspace });
  const target = targetSchema.parse({ id: 'test', repository: remote, format: 'json' });
  await editConfig(loaded.paths.configFile, ['targets'], [target]);
  loaded = loadInstance({ workspace });
  const store = openInstance(loaded.config);
  return {
    root,
    remote,
    workspace,
    seed,
    store,
    config: loaded.config,
    target,
    cleanup: async () => {
      store.close();
      await rm(root, { recursive: true, force: true });
    },
  };
}
test('new target publishes without cwd Git and repeated publish is a no-op', async () => {
  const f = await fixture();
  try {
    const first = await publish(f.config, f.store, f.target);
    assert.equal(first.confirmed, true);
    const second = await publish(f.config, f.store, f.target);
    assert.equal(second.commit, first.commit);
    assert.deepEqual(second.changes, []);
    assert.equal(git(f.remote, 'show', 'main:feed/topics.json').length > 0, true);
  } finally {
    await f.cleanup();
  }
});
test('nonempty target requires adoption and retains opaque history and unrelated files', async () => {
  const f = await fixture(true);
  try {
    await assert.rejects(publish(f.config, f.store, f.target), /adopt/);
    const inspected = await inspectTarget(f.config, f.target);
    await assert.rejects(adoptTarget(f.config, f.store, f.target, '0'.repeat(40)), /head changed/);
    await adoptTarget(f.config, f.store, f.target, inspected.head!);
    await publish(f.config, f.store, f.target);
    assert.equal(git(f.remote, 'show', 'main:feed/history.md'), 'Historical content');
    assert.equal(git(f.remote, 'show', 'main:README.md'), 'Unmanaged');
    const other = { ...f.config, instanceId: '00000000-0000-4000-8000-000000000002' };
    await assert.rejects(publish(other, f.store, f.target), /adopt/);
  } finally {
    await f.cleanup();
  }
});

test('Jekyll publication builds from bundled dependencies and pushes without changing target dependencies', async () => {
  const f = await fixture(true);
  const previousPath = process.env.PATH;
  try {
    const gemfile = 'raise "Target Gemfile must never execute during publication"\n';
    await writeFile(join(f.seed, 'Gemfile'), gemfile);
    await writeFile(join(f.seed, 'Gemfile.lock'), 'Existing site dependency lock\n');
    git(f.seed, 'add', '.');
    git(f.seed, 'commit', '-m', 'Existing UI version');
    git(f.seed, 'push', 'origin', 'main');
    // Stub only the external Bundler process. The real builder must stage its
    // trusted files, and publication must still commit and push to the fixture.
    const toolchain = join(f.root, 'toolchain'), log = join(f.root, 'build-calls.jsonl');
    await mkdir(toolchain);
    const expected = Object.fromEntries(await Promise.all(['Gemfile', 'Gemfile.lock'].map(async name =>
      [name, await readFile(new URL('../../resources/ui/' + name, import.meta.url), 'utf8')])));
    await writeFile(join(toolchain, 'bundle'), `#!${process.execPath}
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
for (const [name, body] of Object.entries(${JSON.stringify(expected)})) assert.equal(fs.readFileSync(name, 'utf8'), body);
assert.equal(process.env.BUNDLE_GEMFILE, path.join(process.cwd(), 'Gemfile'));
assert.equal(process.env.BUNDLE_FROZEN, 'true');
assert.equal(fs.readFileSync('content/history.md', 'utf8'), 'Historical content');
assert.ok(fs.existsSync('.github/jekyll-obsidian.yml'));
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ args: process.argv.slice(2), cwd: process.cwd() }) + '\\n');
`);
    if (process.platform === 'win32') await copyFile(process.execPath, join(toolchain, 'ruby.exe'));
    else await chmod(join(toolchain, 'bundle'), 0o755);
    process.env.PATH = toolchain + delimiter + (previousPath ?? '');
    const target = { ...f.target, format: 'jekyll' as const, ui: { url: 'https://example.com', baseurl: '/feed' } };
    const inspected = await inspectTarget(f.config, target);
    await adoptTarget(f.config, f.store, target, inspected.head!);
    const before = git(f.remote, 'rev-parse', 'main');
    const published = await publish(f.config, f.store, target);
    assert.equal(published.confirmed, true);
    assert.notEqual(published.commit, before);
    assert.equal(git(f.remote, 'rev-parse', 'main'), published.commit);
    const builds = (await readFile(log, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    assert.deepEqual(builds.map(call => call.args), [['check'], ['exec', 'jekyll-obsidian', 'build']]);
    assert.ok(builds.every(call => call.cwd.startsWith(join(f.config.paths.cache, 'ui'))));
    assert.ok(git(f.remote, 'diff', '--name-only', before, 'main').split('\n').every(path => path.startsWith('feed/')));
    assert.equal(git(f.remote, 'show', 'main:Gemfile'), gemfile.trim());
    assert.equal(git(f.remote, 'show', 'main:Gemfile.lock'), 'Existing site dependency lock');
    assert.equal(git(f.remote, 'show', 'main:feed/history.md'), 'Historical content');
  } finally {
    if (previousPath === undefined) delete process.env.PATH; else process.env.PATH = previousPath;
    await f.cleanup();
  }
});
test('target paths reject roots, traversal, Git internals and separators', () => {
  for (const managedPrefix of ['.', '../content', '/content', '.git/x', 'a\\b', 'a/../b', 'a//b'])
    assert.equal(
      targetSchema.safeParse({ id: 'test', repository: 'repo', managedPrefix }).success,
      false,
      managedPrefix,
    );
});

test('takeover changes the generation and stops the previous owner', async () => {
  const f = await fixture(true),
    otherRoot = join(f.root, 'other');
  try {
    const initial = await inspectTarget(f.config, f.target);
    await adoptTarget(f.config, f.store, f.target, initial.head!);
    await setup({ workspace: otherRoot });
    const other = loadInstance({ workspace: otherRoot }).config,
      store = openInstance(other);
    try {
      const current = await inspectTarget(other, f.target);
      await assert.rejects(adoptTarget(other, store, f.target, current.head!), /takeover/);
      const adopted = await adoptTarget(other, store, f.target, current.head!, true);
      assert.notEqual(adopted.generation, current.owner!.generation);
      await assert.rejects(publish(f.config, f.store, f.target), /adopt/);
      assert.equal(git(f.remote, 'show', 'main:feed/history.md'), 'Historical content');
    } finally {
      store.close();
    }
  } finally {
    await f.cleanup();
  }
});

test('remote changes to opaque files are rejected and deletion requires a durable explicit intent', async () => {
  const f = await fixture(true);
  try {
    await adoptTarget(f.config, f.store, f.target, (await inspectTarget(f.config, f.target)).head!);
    git(f.seed, 'pull', '--ff-only', 'origin', 'main');
    await writeFile(join(f.seed, 'feed/history.md'), 'Remote edit');
    git(f.seed, 'add', '.');
    git(f.seed, 'commit', '-m', 'Remote edit');
    git(f.seed, 'push', 'origin', 'main');
    await assert.rejects(publish(f.config, f.store, f.target), /Remote managed file changed/);
    await writeFile(join(f.seed, 'feed/history.md'), 'Historical content');
    git(f.seed, 'add', '.');
    git(f.seed, 'commit', '-m', 'Restore expected bytes');
    git(f.seed, 'push', 'origin', 'main');
    f.store.statement('INSERT INTO fdg_deletions VALUES(?,?)').run(f.target.id, 'history.md');
    const preview = await publish(f.config, f.store, f.target, { dryRun: true });
    assert.ok(preview.changes.some((row) => row.path === 'history.md' && row.action === 'delete'));
    await publish(f.config, f.store, f.target);
    assert.throws(() => git(f.remote, 'show', 'main:feed/history.md'));
    assert.equal(f.store.statement('SELECT count(*) n FROM fdg_deletions').get().n, 0);
    assert.deepEqual((await publish(f.config, f.store, f.target)).changes, []);
  } finally {
    await f.cleanup();
  }
});

test('managed Git symlinks are rejected even without OS symlink privileges', async () => {
  const f = await fixture(true);
  try {
    const oid = git(f.seed, 'hash-object', '-w', 'README.md');
    git(f.seed, 'update-index', '--add', '--cacheinfo', '120000,' + oid + ',feed/link');
    git(f.seed, 'commit', '-m', 'Symlink');
    git(f.seed, 'push', 'origin', 'main');
    await assert.rejects(inspectTarget(f.config, f.target), /symlink|special file/);
  } finally {
    await f.cleanup();
  }
});

test('push checks the expected head and confirms a successful but interrupted response', async () => {
  const f = await fixture(true);
  try {
    const expected = git(f.remote, 'rev-parse', 'main');
    await writeFile(join(f.seed, 'README.md'), 'Next');
    git(f.seed, 'add', '.');
    git(f.seed, 'commit', '-m', 'Next');
    const commit = git(f.seed, 'rev-parse', 'HEAD');
    let pushes = 0;
    await confirmPush(f.seed, f.target, expected, commit, (args, cwd) => {
      const output = git(cwd, ...args);
      if (args[0] === 'push') {
        pushes++;
        throw new Error('Fixture connection lost after delivery');
      }
      return output;
    });
    assert.equal(pushes, 1);
    assert.equal(git(f.remote, 'rev-parse', 'main'), commit);
    await assert.rejects(confirmPush(f.seed, f.target, expected, commit), /Remote advanced/);
    let reads = 0;
    await assert.rejects(
      confirmPush(f.seed, f.target, commit, commit, (args) => {
        if (args[0] === 'ls-remote' && reads++ === 0) return commit + '\trefs/heads/main';
        throw new Error('Fixture offline');
      }),
      /could not be confirmed/,
    );
  } finally {
    await f.cleanup();
  }
});
