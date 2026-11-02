import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import type { AcceptedItem } from '../../src/contracts/content.js';
import { targetSchema } from '../../src/contracts/configuration.js';
import { exportTarget } from '../../src/publishing/index.js';
import { writeProjection } from '../../src/app/projection.js';
import { testContext } from '../support/context.js';
import { TestDatabase } from '../support/database.js';

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const at = '2026-10-31T00:00:00.000Z';
const topic = { id: 'coding', name: { en: 'Coding', 'zh-CN': '编程' }, description: 'Tools', aliases: [], deprecated: false, hidden: false };
function record(id: string): AcceptedItem {
  return { item: { source: 'one', id, stream: 'main', channel: 'rss', title: id, text: 'Facts', url: 'https://example.com/' + id, publishedAt: at, observedAt: at, basis: 'published', metrics: {} }, copy: { source: 'one', id, topics: ['coding'], en: { title: id, summary: 'Summary ' + id }, 'zh-CN': { title: id, summary: '摘要' } }, firstSeen: at, date: at, dateBasis: 'published', updated: at };
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'fdg-export-')), worktree = join(root, 'repo'), content = join(worktree, 'content');
  await mkdir(content, { recursive: true });
  git(worktree, 'init', '--initial-branch=main'); git(worktree, 'config', 'user.name', 'Fixture'); git(worktree, 'config', 'user.email', 'test@example.com'); git(worktree, 'config', 'core.autocrlf', 'false');
  git(worktree, 'remote', 'add', 'origin', 'https://example.invalid/repository');
  await writeFile(join(worktree, 'README.md'), 'Unrelated'); git(worktree, 'add', '.'); git(worktree, 'commit', '-m', 'Initial');
  const config = testContext({ version: 3, instanceId: '00000000-0000-4000-8000-000000000001', storage: { dataDir: join(root, 'data') }, feed: { directory: join(root, 'core'), topics: join(root, 'topics.json') }, agent: { model: 'fixture/model' }, sources: [] });
  await mkdir(config.paths.dataDir, { recursive: true });
  await writeFile(config.feed.topics, JSON.stringify({ version: 1, topics: [topic] }));
  const store = new TestDatabase(config.paths.database);
  const target = targetSchema.parse({ id: 'test', repository: 'https://example.invalid/repository', worktree, format: 'jekyll', managedPrefix: 'content', auxiliaryFiles: ['config/topics.json'] });
  const put = async (path: string, body: string) => { await mkdir(dirname(join(content, path)), { recursive: true }); await writeFile(join(content, path), body); };
  const accept = (id: string) => { const value = record(id); store.db.prepare('INSERT INTO feed_summaries VALUES(?,?,?,?,?)').run('one', id, id, JSON.stringify(value), at); return value; };
  const legacy = (id: string) => '---\npublish: true\ncontent_type: post\ntitle: Historical\ndate: ' + at + '\nsource_url: https://example.com/' + id + '\ntags: [source/one]\n---\nHistorical prose\n';
  return { root, config, store, worktree, content, target, put, accept, legacy, cleanup: async () => { store.close(); await rm(root, { recursive: true, force: true }); } };
}

test('incremental generation preserves edits/deletions and rebuild keeps Git paths and numbering', async () => {
  const f = await fixture();
  try {
    for (const id of ['a', 'b', 'c']) f.accept(id);
    const a = 'one/2026-10/31/item-7.md', b = 'one/2026-10/31/item-9.md', retired = 'one/2026-10/31/item-55.md';
    for (const [path, id] of [[a, 'a'], [b, 'b']]) {
      await f.put(path!, f.legacy(id!)); await f.put('_translations/zh-CN/' + path, f.legacy(id!));
    }
    await f.put(retired, 'Unidentifiable file reserving a number');
    git(f.worktree, 'add', '.'); git(f.worktree, 'commit', '-m', 'History');
    for (const path of [b, '_translations/zh-CN/' + b, retired]) await rm(join(f.content, path));
    git(f.worktree, 'add', '.'); git(f.worktree, 'commit', '-m', 'Delete historical items');
    const edited = f.legacy('a') + 'Human edits'; await f.put(a, edited);
    await f.put('one/2026-10/31/item-12.md', 'Opaque manual content');
    f.store.itemNumber('one', 'c', '2026-10-31'); // Instance numbering is deliberately different.
    await exportTarget(f.config, f.store, f.target);
    assert.equal(await readFile(join(f.content, a), 'utf8'), edited);
    await assert.rejects(readFile(join(f.content, b)), { code: 'ENOENT' });
    const generated = 'one/2026-10/31/item-56.md';
    assert.match(await readFile(join(f.content, generated), 'utf8'), /feed_source_id: "c"/);
    assert.equal(await readFile(join(f.content, 'one/2026-10/31/item-12.md'), 'utf8'), 'Opaque manual content');
    await exportTarget(f.config, f.store, f.target, { rebuild: true });
    assert.match(await readFile(join(f.content, a), 'utf8'), /feed_source_id: "a"/);
    assert.match(await readFile(join(f.content, b), 'utf8'), /feed_source_id: "b"/);
    await assert.rejects(readFile(join(f.content, retired)), { code: 'ENOENT' });
    await assert.rejects(readFile(join(f.content, 'one/2026-10/31/item-1.md')), { code: 'ENOENT' });
    await assert.rejects(readFile(join(f.config.paths.dataDir, 'targets/test/export.json')), { code: 'ENOENT' });
    const before = git(f.worktree, 'diff'); await exportTarget(f.config, f.store, f.target);
    assert.equal(git(f.worktree, 'diff'), before);
  } finally { await f.cleanup(); }
});

test('ambiguous legacy identities remain unchanged and final foreign content supplies locale/index data', async () => {
  const f = await fixture();
  try {
    f.accept('a');
    for (const n of [4, 8]) await f.put('one/2026-10/31/item-' + n + '.md', f.legacy('a'));
    await f.put('github/manual.md', f.legacy('foreign').replace('source/one', 'source/github'));
    await mkdir(join(f.worktree, 'config'));
    await writeFile(join(f.worktree, 'config/topics.json'), JSON.stringify({ version: 1, topics: [{ ...topic, description: 'Human vocabulary' }] }));
    await exportTarget(f.config, f.store, f.target, { rebuild: true });
    for (const n of [4, 8]) assert.equal(await readFile(join(f.content, 'one/2026-10/31/item-' + n + '.md'), 'utf8'), f.legacy('a'));
    assert.match(await readFile(join(f.content, '_locale.yml'), 'utf8'), /source\/github/);
    assert.match(await readFile(join(f.content, 'github/index.md'), 'utf8'), /GitHub/);
    assert.equal(JSON.parse(await readFile(join(f.worktree, 'config/topics.json'), 'utf8')).topics[0].description, 'Human vocabulary');
    await assert.rejects(exportTarget(f.config, f.store, f.target, { output: join(f.root, 'elsewhere') }), /cannot be combined/);
  } finally { await f.cleanup(); }
});

test('unchanged default export reserves history paths without reading historical blobs', async () => {
  const f = await fixture(), previous = process.env.GIT_TRACE;
  try {
    f.accept('a'); await exportTarget(f.config, f.store, f.target);
    await f.put('one/2026-10/31/item-90.md', 'Historical number');
    git(f.worktree, 'add', '.'); git(f.worktree, 'commit', '-m', 'Historical paths');
    await rm(join(f.content, 'one/2026-10/31/item-90.md'));
    git(f.worktree, 'add', '.'); git(f.worktree, 'commit', '-m', 'Delete old path');
    const trace = join(f.root, 'git-trace.log'); process.env.GIT_TRACE = trace.replaceAll('\\', '/');
    await exportTarget(f.config, f.store, f.target);
    assert.doesNotMatch(await readFile(trace, 'utf8'), /cat-file/);
    f.accept('b'); await exportTarget(f.config, f.store, f.target);
    assert.match(await readFile(join(f.content, 'one/2026-10/31/item-91.md'), 'utf8'), /feed_source_id: "b"/);
  } finally {
    if (previous === undefined) delete process.env.GIT_TRACE; else process.env.GIT_TRACE = previous;
    await f.cleanup();
  }
});

test('removed historical Git links reserve their numbers without being read as article blobs', async () => {
  const f = await fixture();
  try {
    const path = 'content/one/2026-10/31/item-60.md';
    git(f.worktree, 'update-index', '--add', '--cacheinfo', '160000,' + git(f.worktree, 'rev-parse', 'HEAD') + ',' + path);
    git(f.worktree, 'commit', '-m', 'Historical Git link');
    git(f.worktree, 'update-index', '--force-remove', path); git(f.worktree, 'commit', '-m', 'Remove Git link');
    f.accept('a'); await exportTarget(f.config, f.store, f.target);
    assert.match(await readFile(join(f.content, 'one/2026-10/31/item-61.md'), 'utf8'), /feed_source_id: "a"/);
  } finally { await f.cleanup(); }
});

test('export adds a new item without reading media or fetching identical live articles from history', async t => {
  const f = await fixture(), previous = process.env.GIT_TRACE;
  const spy = t.mock.method(fs, 'readFile');
  syncBuiltinESMExports();
  try {
    f.accept('a');
    const asset = join(f.content, 'image.bin');
    await writeFile(asset, Buffer.alloc(1_000_000, 42));
    await exportTarget(f.config, f.store, f.target);
    git(f.worktree, 'add', 'content'); git(f.worktree, 'commit', '-m', 'Live articles and asset');
    const trace = join(f.root, 'trace.log');
    process.env.GIT_TRACE = trace.replaceAll('\\', '/');
    f.accept('b');
    await exportTarget(f.config, f.store, f.target);
    assert.match(await readFile(join(f.content, 'one/2026-10/31/item-2.md'), 'utf8'), /feed_source_id: "b"/);
    assert.doesNotMatch(await readFile(trace, 'utf8'), /cat-file/);
    assert.ok(!spy.mock.calls.some(call => call.arguments[0] === asset));
  } finally {
    spy.mock.restore(); syncBuiltinESMExports();
    if (previous === undefined) delete process.env.GIT_TRACE; else process.env.GIT_TRACE = previous;
    await f.cleanup();
  }
});

test('a missing locale is preserved by default and restored by explicit rebuild', async () => {
  const f = await fixture();
  try {
    f.accept('a');
    const path = 'one/2026-10/31/item-7.md', mirror = join(f.content, '_translations/zh-CN', path);
    await f.put(path, f.legacy('a'));
    await exportTarget(f.config, f.store, f.target);
    await assert.rejects(readFile(mirror), { code: 'ENOENT' });
    await exportTarget(f.config, f.store, f.target, { rebuild: true });
    assert.match(await readFile(mirror, 'utf8'), /feed_source_id: "a"/);
  } finally { await f.cleanup(); }
});

test('a core projection configured at the target uses the incremental writer', async () => {
  const f = await fixture();
  try {
    f.accept('new');
    await f.put('manual.md', 'Authored content');
    f.store.db.prepare('INSERT INTO feed_archive_files VALUES(?,?)').run('deleted.md', Buffer.from('Do not replay private snapshots'));
    const publicDirectory = process.platform === 'win32' ? join(f.worktree, 'CONTENT') : f.content;
    const config = { ...f.config, feed: { ...f.config.feed, directory: publicDirectory }, targets: [f.target] };
    await writeProjection(config, f.store);
    assert.equal(await readFile(join(f.content, 'manual.md'), 'utf8'), 'Authored content');
    await assert.rejects(readFile(join(f.content, 'deleted.md')), { code: 'ENOENT' });
    assert.match(await readFile(join(f.content, 'one/2026-10/31/item-1.md'), 'utf8'), /feed_source_id: "new"/);
  } finally { await f.cleanup(); }
});

test('rebuild recognizes an explicitly renamed generated item and retains its path', async () => {
  const f = await fixture();
  try {
    f.accept('a'); await exportTarget(f.config, f.store, f.target);
    git(f.worktree, 'add', '.'); git(f.worktree, 'commit', '-m', 'Generated item');
    git(f.worktree, 'mv', 'content/one/2026-10/31/item-1.md', 'content/one/renamed.md');
    git(f.worktree, 'mv', 'content/_translations/zh-CN/one/2026-10/31/item-1.md', 'content/_translations/zh-CN/one/renamed.md');
    git(f.worktree, 'commit', '-m', 'Move article');
    await exportTarget(f.config, f.store, f.target, { rebuild: true });
    assert.match(await readFile(join(f.content, 'one/renamed.md'), 'utf8'), /feed_source_id: "a"/);
    await assert.rejects(readFile(join(f.content, 'one/2026-10/31/item-1.md')), { code: 'ENOENT' });
    f.accept('b'); await exportTarget(f.config, f.store, f.target);
    assert.match(await readFile(join(f.content, 'one/2026-10/31/item-2.md'), 'utf8'), /feed_source_id: "b"/);
  } finally { await f.cleanup(); }
});

test('rebuild preserves the representation of a known item in a mixed-format worktree', async () => {
  const f = await fixture();
  try {
    const value = f.accept('a');
    const path = 'one/2026-10/31/item-5.json';
    await f.put(path, JSON.stringify(value));
    await exportTarget(f.config, f.store, f.target, { rebuild: true });
    assert.equal(JSON.parse(await readFile(join(f.content, path), 'utf8')).item.id, 'a');
    await assert.rejects(readFile(join(f.content, path.replace('.json', '.md'))), { code: 'ENOENT' });
  } finally { await f.cleanup(); }
});

test('a current unique identity takes precedence over an older identity at the same path', async () => {
  const f = await fixture();
  try {
    f.accept('a'); f.accept('b');
    const path = 'one/2026-10/31/item-7.md';
    await f.put(path, f.legacy('a')); git(f.worktree, 'add', '.'); git(f.worktree, 'commit', '-m', 'Previous item');
    await f.put(path, f.legacy('b'));
    await exportTarget(f.config, f.store, f.target, { rebuild: true });
    assert.match(await readFile(join(f.content, path), 'utf8'), /feed_source_id: "b"/);
    await assert.rejects(readFile(join(f.content, 'one/2026-10/31/item-8.md')), { code: 'ENOENT' });
  } finally { await f.cleanup(); }
});
