import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmod,copyFile,mkdir,mkdtemp,readFile,realpath,rename,rm,symlink,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter,dirname,join } from 'node:path';
import test from 'node:test';
import { editConfig,setup } from '../../src/app/index.js';
import { targetSchema } from '../../src/contracts/configuration.js';
import { loadInstance } from '../../src/instance/index.js';
import { exportTarget,confirmPush,inspectTarget,publish } from '../../src/publishing/index.js';
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
    await exportTarget(f.config, f.store, f.target);
    const first = await publish(f.config, f.target);
    assert.equal(first.confirmed, true);
    const second = await publish(f.config, f.target);
    assert.equal(second.commit, first.commit);
    assert.deepEqual(second.changes, []);
    assert.equal(git(f.remote, 'show', 'main:feed/topics.json').length > 0, true);
  } finally {
    await f.cleanup();
  }
});
test('two instances publish ordinary content without ownership or database import', async () => {
  const f = await fixture(true);
  try {
    const inspected = await inspectTarget(f.config, f.target);
    assert.equal('owner' in inspected, false);
    assert.equal(git(inspected.worktree, 'rev-parse', '--abbrev-ref', '@{upstream}'), 'origin/main');
    const other = { ...f.config, instanceId: '00000000-0000-4000-8000-000000000002' };
    const target = { ...f.target, worktree: inspected.worktree };
    await writeFile(join(inspected.worktree, 'feed/manual.md'), 'Authored outside the database');
    await publish(other, target);
    assert.equal(git(f.remote, 'show', 'main:feed/manual.md'), 'Authored outside the database');
    assert.equal(git(f.remote, 'show', 'main:README.md'), 'Unmanaged');
    assert.equal(git(f.remote, 'ls-tree', '-r', '--name-only', 'main').includes('owner'), false);
    assert.equal(f.store.statement('SELECT count(*) n FROM feed_archives').get().n, 0);
  } finally { await f.cleanup(); }
});

test('Windows checkout accepts a differently cased drive and directory', { skip: process.platform !== 'win32' }, async () => {
  const f = await fixture(true);
  try {
    const inspected = await inspectTarget(f.config, f.target);
    const target = { ...f.target, worktree: inspected.worktree.toLowerCase() };
    assert.equal((await inspectTarget(f.config, target)).head, inspected.head);
  } finally { await f.cleanup(); }
});

test('publication materializes media whose combined size exceeds the Git response cap', async () => {
  const f = await fixture(true);
  try {
    const { worktree } = await inspectTarget(f.config, f.target);
    const body = Buffer.alloc(17_000_000, 42);
    body[0] = 0; // Binary media: Git's textual diff stays small.
    for (let i = 0; i < 8; i++) { body[body.length - 1] = i; await writeFile(join(worktree, 'feed', 'media-' + i + '.bin'), body); }
    const result = await publish(f.config, f.target);
    assert.equal(result.confirmed, true);
    for (let i = 0; i < 8; i++) assert.equal(git(f.remote, 'cat-file', '-s', 'main:feed/media-' + i + '.bin'), String(body.length));
  } finally { await f.cleanup(); }
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
assert.equal(fs.realpathSync.native(process.env.BUNDLE_GEMFILE), fs.realpathSync.native(path.join(process.cwd(), 'Gemfile')));
assert.equal(process.env.BUNDLE_FROZEN, 'true');
assert.equal(fs.readFileSync('content/history.md', 'utf8'), 'Historical content');
assert.ok(fs.existsSync('.github/jekyll-obsidian.yml'));
if (process.argv.includes('build')) fs.writeFileSync(${JSON.stringify(join(f.config.paths.dataDir, 'repositories/test/feed/new.md'))}, 'Edited during validation');
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ args: process.argv.slice(2), cwd: fs.realpathSync.native('.') }) + '\\n');
`);
    if (process.platform === 'win32') await copyFile(process.execPath, join(toolchain, 'ruby.exe'));
    else await chmod(join(toolchain, 'bundle'), 0o755);
    process.env.PATH = toolchain + delimiter + (previousPath ?? '');
    const target = { ...f.target, format: 'jekyll' as const, ui: { url: 'https://example.com', baseurl: '/feed' } };
    const inspected = await inspectTarget(f.config, target);
    await writeFile(join(inspected.worktree, 'feed/new.md'), 'Before validation');
    await writeFile(join(f.seed, 'README.md'), 'Remote change outside the content snapshot');
    git(f.seed, 'add', 'README.md'); git(f.seed, 'commit', '-m', 'Update README'); git(f.seed, 'push', 'origin', 'main');
    const before = git(f.remote, 'rev-parse', 'main');
    const published = await publish(f.config, target);
    assert.equal(published.confirmed, true);
    assert.equal(git(f.remote, 'show', 'main:feed/new.md'), 'Before validation');
    assert.equal(await readFile(join(inspected.worktree, 'feed/new.md'), 'utf8'), 'Edited during validation');
    assert.notEqual(published.commit, before);
    assert.equal(git(f.remote, 'rev-parse', 'main'), published.commit);
    const builds = (await readFile(log, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    assert.deepEqual(builds.map(call => call.args), [['check'], ['exec', 'jekyll-obsidian', 'build']]);
    const uiCache = await realpath(join(f.config.paths.cache, 'ui'));
    assert.ok(builds.every(call => dirname(call.cwd) === uiCache));
    assert.ok(git(f.remote, 'diff', '--name-only', before, 'main').split('\n').every(path => path.startsWith('feed/')));
    assert.equal(git(f.remote, 'show', 'main:Gemfile'), gemfile.trim());
    assert.equal(git(f.remote, 'show', 'main:Gemfile.lock'), 'Existing site dependency lock');
    assert.equal(git(f.remote, 'show', 'main:feed/history.md'), 'Historical content');
    assert.equal(git(f.remote, 'show', 'main:README.md'), 'Remote change outside the content snapshot');
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

test('manual add/edit/delete and dry-run preserve unrelated staged and unstaged files', async () => {
  const f = await fixture(true);
  try {
    await writeFile(join(f.seed, 'before.md'), 'Staged rename');
    git(f.seed, 'add', 'before.md'); git(f.seed, 'commit', '-m', 'File to rename'); git(f.seed, 'push', 'origin', 'main');
    const { worktree } = await inspectTarget(f.config, f.target);
    git(worktree, 'mv', 'before.md', 'after.md');
    await writeFile(join(worktree, 'README.md'), 'Staged README');
    git(worktree, 'add', 'README.md');
    await writeFile(join(worktree, 'README.md'), 'Unstaged README');
    await writeFile(join(worktree, 'feed/new.md'), 'Manual new content');
    await rm(join(worktree, 'feed/history.md'));
    const before = git(worktree, 'status', '--porcelain=v1'), head = git(worktree, 'rev-parse', 'HEAD');
    const preview = await publish(f.config, f.target, { dryRun: true });
    assert.ok(preview.changes.some(row => row.path === 'feed/history.md' && row.action === 'delete'));
    assert.equal(git(worktree, 'status', '--porcelain=v1'), before);
    assert.equal(git(worktree, 'rev-parse', 'HEAD'), head);
    await publish(f.config, f.target);
    assert.throws(() => git(f.remote, 'show', 'main:feed/history.md'));
    assert.equal(git(f.remote, 'show', 'main:feed/new.md'), 'Manual new content');
    assert.equal(git(f.remote, 'show', 'main:README.md'), 'Unmanaged');
    assert.equal(git(worktree, 'show', ':README.md'), 'Staged README');
    assert.throws(() => git(worktree, 'show', ':before.md'));
    assert.equal(git(worktree, 'show', ':after.md'), 'Staged rename');
    assert.equal(git(f.remote, 'show', 'main:before.md'), 'Staged rename');
    assert.equal(await readFile(join(worktree, 'README.md'), 'utf8'), 'Unstaged README');
    await writeFile(join(worktree, 'feed/new.md'), 'Manual edit');
    await publish(f.config, f.target);
    assert.equal(git(f.remote, 'show', 'main:feed/new.md'), 'Manual edit');
  } finally { await f.cleanup(); }
});

test('publication previews stay bounded and omit abandoned atomic writes but accept ordinary tmp files', async () => {
  const f = await fixture(true);
  try {
    const { worktree } = await inspectTarget(f.config, f.target);
    const temp = 'feed/item-3.md.74b10e9a-464b-4c47-a0b3-88bdae209cb2.tmp';
    await writeFile(join(worktree, temp), 'Incomplete write');
    await writeFile(join(worktree, 'feed/notes.tmp'), 'Authored file');
    await writeFile(join(worktree, 'feed/history.md'), 'long article body '.repeat(80_000));
    await writeFile(join(worktree, '.git/info/exclude'), 'feed/ignored.md\nfeed/forced.md\n');
    await writeFile(join(worktree, 'feed/ignored.md'), 'Draft');
    await writeFile(join(worktree, 'feed/forced.md'), 'Explicitly included'); git(worktree, 'add', '-f', 'feed/forced.md');
    for (let i = 0; i < 105; i++) await writeFile(join(worktree, 'feed', `note-${i}.md`), 'Note');
    const inspection = await inspectTarget(f.config, f.target);
    assert.ok(JSON.stringify(inspection).length < 20_000);
    assert.ok(inspection.statusCount > 100);
    assert.equal(inspection.status.split('\n').length, 100);
    const preview = await publish(f.config, f.target, { dryRun: true });
    assert.ok(JSON.stringify(preview).length < 20_000);
    assert.equal(preview.dryRun, true);
    assert.equal(preview.diffStat, git(worktree, 'diff', '--shortstat', preview.baseTree, preview.tree, '--', 'feed'));
    assert.equal(preview.changeCount, 108);
    assert.equal(preview.changes.length, 100);
    await publish(f.config, f.target);
    assert.equal(git(f.remote, 'show', 'main:feed/notes.tmp'), 'Authored file');
    assert.equal(git(f.remote, 'show', 'main:feed/forced.md'), 'Explicitly included');
    for (const path of [temp, 'feed/ignored.md']) assert.throws(() => git(f.remote, 'show', 'main:' + path));
  } finally { await f.cleanup(); }
});

test('unchanged committed content must still validate before publication', async () => {
  const f = await fixture(true);
  try {
    await writeFile(join(f.seed, 'feed/broken.md'), '---\ntitle: [bad\n---\n');
    git(f.seed, 'add', 'feed/broken.md'); git(f.seed, 'commit', '-m', 'Invalid existing content'); git(f.seed, 'push', 'origin', 'main');
    const { worktree, head } = await inspectTarget(f.config, f.target);
    await assert.rejects(publish(f.config, f.target), { code: 'CONTENT_INVALID', message: /feed\/broken\.md/ });
    assert.equal(git(worktree, 'rev-parse', 'HEAD'), head);
    assert.equal(git(f.remote, 'rev-parse', 'main'), head);
  } finally { await f.cleanup(); }
});

test('publication respects an existing Git index lock', async () => {
  const f = await fixture(true);
  try {
    const { worktree } = await inspectTarget(f.config, f.target);
    const lock = join(worktree, '.git/index.lock');
    await writeFile(lock, 'Other writer');
    await assert.rejects(publish(f.config, f.target), { code: 'BUSY' });
    assert.equal(await readFile(lock, 'utf8'), 'Other writer');
    await rm(lock);
    assert.equal((await publish(f.config, f.target)).confirmed, true);
  } finally { await f.cleanup(); }
});

test('remote overlap reports the unstaged local file and keeps its bytes for retry', async () => {
  const f = await fixture(true);
  try {
    const { worktree } = await inspectTarget(f.config, f.target);
    await writeFile(join(worktree, 'README.md'), 'Unstaged work');
    await writeFile(join(f.seed, 'README.md'), 'Remote edit');
    git(f.seed, 'commit', '-am', 'Remote README'); git(f.seed, 'push', 'origin', 'main');
    await assert.rejects(publish(f.config, f.target), { code: 'GIT_LOCAL_CHANGES', message: /README\.md/ });
    assert.equal(await readFile(join(worktree, 'README.md'), 'utf8'), 'Unstaged work');
    git(worktree, 'restore', 'README.md');
    assert.equal((await publish(f.config, f.target)).confirmed, true);
  } finally { await f.cleanup(); }
});

test('a remote directory cannot displace an unrelated staged file at its parent path', async () => {
  const f = await fixture(true);
  try {
    const { worktree, head } = await inspectTarget(f.config, f.target);
    await writeFile(join(worktree, 'notes'), 'Staged local work'); git(worktree, 'add', 'notes');
    await rm(join(worktree, 'notes')); // Only the real index now holds this file.
    await mkdir(join(f.seed, 'notes')); await writeFile(join(f.seed, 'notes/remote.md'), 'Remote directory');
    git(f.seed, 'add', '.'); git(f.seed, 'commit', '-m', 'Add a directory'); git(f.seed, 'push', 'origin', 'main');
    await assert.rejects(publish(f.config, f.target), { code: 'GIT_LOCAL_CHANGES', message: /notes/ });
    assert.equal(git(worktree, 'show', ':notes'), 'Staged local work');
    assert.equal(git(worktree, 'rev-parse', 'HEAD'), head);
  } finally { await f.cleanup(); }
});

for (const conflict of [false, true]) test('ordinary Git merge handles ' + (conflict ? 'add/add conflicts and continuation' : 'independent remote changes'), async () => {
  const f = await fixture(true);
  try {
    if (conflict) {
      await writeFile(join(f.seed, 'old.md'), 'Remote rename');
      git(f.seed, 'add', 'old.md'); git(f.seed, 'commit', '-m', 'File to rename'); git(f.seed, 'push', 'origin', 'main');
    }
    const { worktree } = await inspectTarget(f.config, f.target);
    await writeFile(join(worktree, 'feed/local.md'), 'Local');
    await writeFile(join(worktree, 'README.md'), 'Staged unrelated'); git(worktree, 'add', 'README.md');
    await writeFile(join(f.seed, conflict ? 'feed/local.md' : 'feed/remote.md'), 'Remote');
    if (conflict) git(f.seed, 'mv', 'old.md', 'renamed.md');
    git(f.seed, 'add', '.'); git(f.seed, 'commit', '-m', 'Remote content'); git(f.seed, 'push', 'origin', 'main');
    if (conflict) {
      await assert.rejects(publish(f.config, f.target), /feed\/local.md/);
      assert.equal(git(worktree, 'diff', '--name-only', '--diff-filter=U'), 'feed/local.md');
      assert.equal(git(worktree, 'show', ':README.md'), 'Staged unrelated');
      await writeFile(join(worktree, 'feed/local.md'), 'Resolved'); git(worktree, 'add', 'feed/local.md');
    }
    await publish(f.config, f.target);
    assert.equal(git(f.remote, 'show', 'main:feed/local.md'), conflict ? 'Resolved' : 'Local');
    assert.equal(git(f.remote, 'show', 'main:README.md'), 'Unmanaged');
    assert.equal(git(worktree, 'show', ':README.md'), 'Staged unrelated');
    if (!conflict) assert.equal(git(f.remote, 'show', 'main:feed/remote.md'), 'Remote');
    else {
      assert.throws(() => git(f.remote, 'show', 'main:old.md'));
      assert.equal(git(f.remote, 'show', 'main:renamed.md'), 'Remote rename');
    }
  } finally { await f.cleanup(); }
});

test('invalid local and merged content is located and never pushed', async () => {
  const f = await fixture(true);
  try {
    const { worktree } = await inspectTarget(f.config, f.target);
    const initial = git(worktree, 'rev-parse', 'HEAD');
    await writeFile(join(worktree, 'feed/broken.md'), '---\ntitle: [bad\n---\n');
    await assert.rejects(publish(f.config, f.target), /feed\/broken.md/);
    assert.equal(git(worktree, 'rev-parse', 'HEAD'), initial);
    await rm(join(worktree, 'feed/broken.md'));
    await writeFile(join(worktree, 'feed/local.md'), 'Valid local');
    await writeFile(join(f.seed, 'feed/broken.md'), '---\ntitle: [bad\n---\n');
    git(f.seed, 'add', '.'); git(f.seed, 'commit', '-m', 'Broken remote content'); git(f.seed, 'push', 'origin', 'main');
    const remote = git(f.remote, 'rev-parse', 'main');
    await assert.rejects(publish(f.config, f.target), /feed\/broken.md/);
    assert.equal(git(f.remote, 'rev-parse', 'main'), remote);
    await writeFile(join(worktree, 'feed/broken.md'), 'Repaired'); git(worktree, 'add', 'feed/broken.md');
    await publish(f.config, f.target);
    assert.equal(git(f.remote, 'show', 'main:feed/broken.md'), 'Repaired');
  } finally { await f.cleanup(); }
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

test('Git diff preferences cannot hide a newly merged submodule from snapshot validation', async () => {
  const f = await fixture(true);
  try {
    const { worktree } = await inspectTarget(f.config, f.target);
    git(worktree, 'config', 'diff.ignoreSubmodules', 'all');
    git(f.seed, 'update-index', '--add', '--cacheinfo', '160000,' + git(f.seed, 'rev-parse', 'HEAD') + ',feed/link');
    git(f.seed, 'commit', '-m', 'Remote Git link'); git(f.seed, 'push', 'origin', 'main');
    const remote = git(f.remote, 'rev-parse', 'main');
    await assert.rejects(publish(f.config, f.target), { code: 'UNSAFE_PATH', message: /feed\/link/ });
    assert.equal(git(f.remote, 'rev-parse', 'main'), remote);
  } finally { await f.cleanup(); }
});

test('ignored working-tree links are rejected before Git staging', async () => {
  const f = await fixture(true);
  try {
    const { worktree } = await inspectTarget(f.config, f.target), outside = join(f.root, 'outside');
    await mkdir(outside); await writeFile(join(outside, 'private.md'), 'Private');
    await writeFile(join(worktree, '.git/info/exclude'), 'feed/ignored/\n');
    await symlink(outside, join(worktree, 'feed/ignored'), process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(publish(f.config, f.target), /special file/);
    assert.equal(await readFile(join(outside, 'private.md'), 'utf8'), 'Private');
  } finally { await f.cleanup(); }
});

test('an offline remote retains the local commit and retry publishes it without duplication', async () => {
  const f = await fixture(true);
  try {
    const { worktree } = await inspectTarget(f.config, f.target);
    const before = git(worktree, 'rev-parse', 'HEAD');
    await writeFile(join(worktree, 'feed/manual.md'), 'Waiting for remote');
    await rename(f.remote, f.remote + '.offline');
    await assert.rejects(publish(f.config, f.target), /Git command failed/);
    const commit = git(worktree, 'rev-parse', 'HEAD');
    assert.notEqual(commit, before);
    assert.equal(git(worktree, 'status', '--porcelain'), '');
    await rename(f.remote + '.offline', f.remote);
    const retried = await publish(f.config, f.target);
    assert.equal(retried.commit, commit);
    assert.equal(git(f.remote, 'rev-parse', 'main'), commit);
  } finally { await f.cleanup(); }
});

test('an existing linked Git worktree uses its own branch and index', async () => {
  const f = await fixture(true);
  try {
    const worktree = join(f.root, 'linked');
    git(f.seed, 'worktree', 'add', '-b', 'publication', worktree);
    const target = { ...f.target, branch: 'publication', worktree };
    await writeFile(join(worktree, 'feed/manual.md'), 'Linked checkout');
    await publish(f.config, target);
    assert.equal(git(f.remote, 'show', 'publication:feed/manual.md'), 'Linked checkout');
    assert.equal(git(f.seed, 'status', '--porcelain'), '');
    assert.throws(() => git(f.remote, 'show', 'main:feed/manual.md'));
  } finally { await f.cleanup(); }
});

test('ambient Git discovery variables cannot redirect the selected publication worktree', async () => {
  const f = await fixture(true), old = { GIT_DIR: process.env.GIT_DIR, GIT_WORK_TREE: process.env.GIT_WORK_TREE, GIT_INDEX_FILE: process.env.GIT_INDEX_FILE };
  try {
    process.env.GIT_DIR = join(f.seed, '.git'); process.env.GIT_WORK_TREE = f.seed; process.env.GIT_INDEX_FILE = join(f.root, 'ambient-index');
    const { worktree } = await inspectTarget(f.config, f.target);
    await writeFile(join(worktree, 'feed/manual.md'), 'Explicit target');
    await publish(f.config, f.target);
    for (const [name, value] of Object.entries(old)) if (value === undefined) delete process.env[name]; else process.env[name] = value;
    assert.equal(git(f.remote, 'show', 'main:feed/manual.md'), 'Explicit target');
    assert.equal(git(f.seed, 'status', '--porcelain'), '');
  } finally {
    for (const [name, value] of Object.entries(old)) if (value === undefined) delete process.env[name]; else process.env[name] = value;
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
