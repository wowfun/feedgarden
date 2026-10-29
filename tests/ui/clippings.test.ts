import assert from 'node:assert/strict';
import { existsSync,readdirSync,renameSync,rmSync,symlinkSync,writeFileSync } from 'node:fs';
import { mkdir,mkdtemp,readdir,readFile,rename,rm,symlink,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { importArchives,maintainArchive,recoverContent,scanArchives,writeSite } from '../../src/content/index.js';
import { testContext } from '../support/context.js';
import { TestDatabase as Store } from '../support/database.js';

test('fresh archive imports reconcile stale managed locale fields and retain custom messages', async () => {
  const f = await fixture(true);
  try {
    await writeFile(f.config.feed.topics, JSON.stringify({ version: 1, topics: [
      { id: 'agents', name: { en: 'Agents', 'zh-CN': '智能体' }, description: 'Agents', aliases: [], hidden: true, deprecated: false },
      { id: 'coding', name: { en: 'Coding', 'zh-CN': '编程' }, description: 'Coding', aliases: [], deprecated: false }
    ] }));
    for (const prefix of ['', '_translations/zh-CN/']) {
      await mkdir(join(f.config.feed.directory, prefix), { recursive: true });
      await writeFile(join(f.config.feed.directory, prefix, '_locale.yml'), JSON.stringify({
        name: prefix ? '简体中文' : 'English', messages: { search: 'Custom search' },
        tag_labels: { 'topics/agents': 'Old label', 'custom/note': 'Custom note', 'source/legacy': 'Historical source' },
        hidden_tags: ['topics/coding', 'custom/note'], tag_aliases: { 'custom/old': 'custom/note' }
      }));
    }
    await importArchives(f.config, f.store);
    for (const force of [false, true]) {
      await writeSite(f.config, f.store, undefined, force);
      for (const prefix of ['', '_translations/zh-CN/']) {
        const manifest = JSON.parse(await readFile(join(f.config.feed.directory, prefix, '_locale.yml'), 'utf8'));
        assert.deepEqual(manifest.hidden_tags, ['custom/note', 'topics/agents']);
        assert.equal(manifest.tag_labels['topics/agents'], prefix ? '智能体' : 'Agents');
        assert.ok(manifest.tag_labels['source/clippings']);
        assert.equal(manifest.tag_labels['custom/note'], 'Custom note');
        assert.equal(manifest.tag_labels['source/legacy'], 'Historical source');
        assert.equal(manifest.messages.search, 'Custom search');
        assert.equal(manifest.tag_aliases['custom/old'], 'custom/note');
      }
    }
  } finally { await f.cleanup(); }
});

test('Clippings translation mirrors are rejected without importing or discarding authored files', async () => {
  const f = await fixture(true);
  try {
    const mirror = '_translations/zh-CN/clippings/article.md', path = join(f.config.feed.directory, mirror);
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, 'User translation');
    await assert.rejects(importArchives(f.config, f.store), /Clippings.*translation/);
    await assert.rejects(writeSite(f.config, f.store), /Clippings.*translation/);
    assert.equal(await readFile(path, 'utf8'), 'User translation');
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_archive_files').get() as { n: number }).n, 0);
    await assert.rejects(maintainArchive(f.config, f.store, 'remove', mirror), /directly on disk/);
    await rm(join(f.config.feed.directory, '_translations/zh-CN/clippings'), { recursive: true });
    await importArchives(f.config, f.store);
    f.store.db.prepare('INSERT INTO feed_archive_files VALUES (?, ?)').run(mirror, Buffer.from('Stale translation'));
    await writeSite(f.config, f.store, undefined, true);
    assert.equal(existsSync(path), false);
    // The guard also runs after the archive import has already completed.
    await mkdir(join(path, '..'), { recursive: true }); await writeFile(path, 'Late translation');
    await assert.rejects(writeSite(f.config, f.store), /Clippings.*translation/);
    assert.equal(await readFile(path, 'utf8'), 'Late translation');
  } finally { await f.cleanup(); }
});

test('Clippings labels follow each locale catalog and refresh after configuration changes', async () => {
  const f = await fixture(true), cwd = process.cwd();
  try {
    await mkdir(join(f.root, 'config/locales'), { recursive: true });
    for (const locale of ['en', 'zh-CN']) {
      const catalog = JSON.parse(await readFile(join(cwd, 'config/locales', locale + '.json'), 'utf8'));
      catalog.tag_labels['source/clippings'] = locale === 'en' ? 'Saved articles' : '摘录';
      await writeFile(join(f.root, 'config/locales', locale + '.json'), JSON.stringify(catalog));
    }
    f.config.feed.locales = join(f.root,'config/locales');
    process.chdir(f.root);
    await writeSite(f.config, f.store);
    for (const [locale, prefix] of [['en', ''], ['zh-CN', '_translations/zh-CN/']]) {
      const readManifest = async () => JSON.parse(await readFile(join(f.config.feed.directory, prefix!, '_locale.yml'), 'utf8'));
      assert.equal((await readManifest()).tag_labels['source/clippings'], locale === 'en' ? 'Saved articles' : '摘录');
      const path = join(f.root, 'config/locales', locale + '.json');
      const catalog = JSON.parse(await readFile(path, 'utf8'));
      catalog.tag_labels['source/clippings'] += ' 2';
      await writeFile(path, JSON.stringify(catalog));
      assert.equal(await writeSite(f.config, f.store), true);
      assert.equal((await readManifest()).tag_labels['source/clippings'], catalog.tag_labels['source/clippings']);
    }
  } finally { process.chdir(cwd); await f.cleanup(); }
});

test('Web Clipper source stays unchanged while bare topic aliases reach archived locale manifests', async () => {
  const f = await fixture(true);
  try {
    const topics = [
      { id: 'agents', name: { en: 'Agents', 'zh-CN': '智能体' }, description: 'Agents', aliases: [], deprecated: false },
      { id: 'old-agents', name: { en: 'Old agents', 'zh-CN': '旧智能体' }, description: 'Old agents', aliases: [], deprecated: true, replacedBy: 'agents' }
    ];
    await writeFile(f.config.feed.topics, JSON.stringify({ version: 1, topics }));
    const clipping = '---\ntitle: Clipped article\nsource: https://example.test/original\nauthor: ["[[Diane Sarkis]]"]\npublished: 2026-10-22\ncreated: 2026-10-24\ntags: [agents, subagents]\n---\nUnmodified body.\r\n';
    await writeFile(join(f.clippings, 'article.md'), clipping);
    for (const prefix of ['', '_translations/zh-CN/']) {
      await mkdir(join(f.config.feed.directory, prefix), { recursive: true });
      await writeFile(join(f.config.feed.directory, prefix, '_locale.yml'), JSON.stringify({
        name: prefix ? '简体中文' : 'English', messages: { search: 'Kept custom label' },
        tag_labels: { 'source/clippings': 'Clippings' }, tag_aliases: { 'topics/custom-old': 'topics/custom' }
      }));
    }
    await importArchives(f.config, f.store);
    await writeSite(f.config, f.store);
    await writeSite(f.config, f.store, undefined, true);
    assert.equal(await readFile(join(f.clippings, 'article.md'), 'utf8'), clipping);
    for (const prefix of ['', '_translations/zh-CN/']) {
      const manifest = JSON.parse(await readFile(join(f.config.feed.directory, prefix, '_locale.yml'), 'utf8'));
      assert.equal(manifest.messages.search, 'Kept custom label');
      assert.deepEqual(manifest.tag_aliases, { 'topics/custom-old': 'topics/custom', agents: 'topics/agents', 'old-agents': 'topics/agents', 'topics/old-agents': 'topics/agents' });
    }
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_jobs').get() as { n: number }).n, 0);
    // Even an out-of-band registry removal invalidates archived manifests;
    // the normal topic-update API prohibits removing IDs altogether.
    await writeFile(f.config.feed.topics, JSON.stringify({ version: 1, topics: [] }));
    await writeSite(f.config, f.store);
    for (const prefix of ['', '_translations/zh-CN/']) {
      const manifest = JSON.parse(await readFile(join(f.config.feed.directory, prefix, '_locale.yml'), 'utf8'));
      assert.deepEqual(manifest.tag_aliases, {});
    }
  } finally { await f.cleanup(); }
});

async function fixture(selection = false) {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-clippings-'));
  await writeFile(join(root, 'topics.json'), JSON.stringify({ version: 1, topics: [] }));
  const config = testContext({ version:3,instanceId:'00000000-0000-4000-8000-000000000001', storage: { dataDir: root },
    feed: { directory: join(root, 'content'), topics: join(root, 'topics.json') }, agent: { model: 'fixture/local' },
    sources: [{ id: 'hackernews', name: 'HN', intervalHours: 1, ...(selection ? { selection: { method: 'hn-engagement' } } : {}),
      streams: [{ id: 'main', routes: [{ id: 'rss', kind: 'feed' }] }] }] });
  const store = new Store(config.paths.database), clippings = join(config.feed.directory, 'clippings');
  await mkdir(clippings, { recursive: true });
  await writeFile(join(clippings, 'index.md'), '---\npublish: true\ncontent_type: page\ntitle: Clippings\n---\nFixture notes.\n');
  await writeFile(join(clippings, 'article.md'), '---\npublish: true\ncontent_type: post\ntitle: Note\ndate: 2026-10-24\ntags: [source/clippings]\n---\nOne original.\r\n');
  return { root, config, store, clippings, cleanup: async () => { store.close(); await rm(root, { recursive: true, force: true }); } };
}

for (const selection of [false, true]) test(`authored files stay live through render and archive initialization (selection=${selection})`, async () => {
  const f = await fixture(selection);
  try {
    const original = await readFile(join(f.clippings, 'article.md'));
    await mkdir(join(f.clippings, 'assets'));
    const binary = Buffer.from([0, 255, 2, 13, 10]);
    await writeFile(join(f.clippings, 'assets', 'clip.bin'), binary);
    const assetManifest = '{"version":1,"images":{}}\n';
    await writeFile(join(f.clippings, 'assets', 'manifest.json'), assetManifest);
    await importArchives(f.config, f.store);
    assert.equal((f.store.db.prepare("SELECT count(*) n FROM feed_archive_files WHERE path LIKE 'clippings/%'").get() as { n: number }).n, 0);
    assert.equal(await writeSite(f.config, f.store), true);
    assert.deepEqual(await readFile(join(f.clippings, 'article.md')), original);
    assert.deepEqual(await readFile(join(f.clippings, 'assets', 'clip.bin')), binary);
    assert.equal(await readFile(join(f.clippings, 'assets', 'manifest.json'), 'utf8'), assetManifest);
    assert.equal(await writeSite(f.config, f.store), false);
    await writeFile(join(f.clippings, 'article.md'), 'Edited original');
    await rename(join(f.clippings, 'article.md'), join(f.clippings, 'renamed.md'));
    await writeFile(join(f.clippings, 'added.md'), 'New original');
    // A stale opaque snapshot must never overwrite a live directory or revive deletions.
    f.store.db.prepare('INSERT INTO feed_archive_files VALUES (?, ?)').run('clippings/article.md', Buffer.from('Stale snapshot'));
    await writeSite(f.config, f.store, undefined, true);
    assert.equal(await readFile(join(f.clippings, 'renamed.md'), 'utf8'), 'Edited original');
    assert.deepEqual(await readFile(join(f.clippings, 'assets', 'clip.bin')), binary);
    assert.equal(await readFile(join(f.clippings, 'assets', 'manifest.json'), 'utf8'), assetManifest);
    assert.equal(await readFile(join(f.clippings, 'added.md'), 'utf8'), 'New original');
    await assert.rejects(readFile(join(f.clippings, 'article.md')), { code: 'ENOENT' });
    await rm(join(f.clippings, 'added.md'));
    await writeSite(f.config, f.store, undefined, true);
    await assert.rejects(readFile(join(f.clippings, 'added.md')), { code: 'ENOENT' });
    await assert.rejects(readdir(join(f.config.feed.directory, '_translations/zh-CN/clippings')), { code: 'ENOENT' });
    for (const prefix of ['', '_translations/zh-CN/']) {
      const manifest = JSON.parse(await readFile(join(f.config.feed.directory, prefix, '_locale.yml'), 'utf8'));
      assert.equal(manifest.tag_labels['source/clippings'], 'Clippings');
    }
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_jobs').get() as { n: number }).n, 0);
    await assert.rejects(maintainArchive(f.config, f.store, 'remove', './clippings/renamed.md'), /directly on disk/);
  } finally { await f.cleanup(); }
});

test('edits made after rendering starts survive the directory handoff', async t => {
  const f = await fixture();
  try {
    await writeFile(join(f.clippings, 'delete.md'), 'Remove during render');
    let edited = false;
    const originalLease = f.store.assertLease.bind(f.store);
    t.mock.method(f.store, 'assertLease', () => {
      originalLease();
      if (edited || !readdirSync(f.root).some(name => name.startsWith('.content-stage-') && existsSync(join(f.root, name, '_recommendations.json')))) return;
      // assertLease is called at the commit boundary after staging is rendered.
      edited = true;
      writeFileSync(join(f.clippings, 'article.md'), 'Edited during render');
      renameSync(join(f.clippings, 'article.md'), join(f.clippings, 'renamed.md'));
      writeFileSync(join(f.clippings, 'late.md'), 'Added during render');
      rmSync(join(f.clippings, 'delete.md'));
    });
    await writeSite(f.config, f.store);
    assert.equal(edited, true);
    assert.equal(await readFile(join(f.clippings, 'renamed.md'), 'utf8'), 'Edited during render');
    assert.equal(await readFile(join(f.clippings, 'late.md'), 'utf8'), 'Added during render');
    await assert.rejects(readFile(join(f.clippings, 'delete.md')), { code: 'ENOENT' });
  } finally { await f.cleanup(); }
});

for (const phase of ['prepared', 'between-renames', 'transferred', 'installed', 'rollback']) test(`clippings survive recovery at ${phase}`, async () => {
  const f = await fixture();
  try {
    const staging = join(f.root, '.content-stage-test'), previous = join(f.root, 'content.previous-test');
    const bytes = await readFile(join(f.clippings, 'article.md'));
    await mkdir(join(f.clippings, 'assets'));
    await writeFile(join(f.clippings, 'assets', 'image.gif'), Buffer.from('GIF89a-original-bytes'));
    await writeFile(join(f.clippings, 'assets', 'manifest.json'), '{"version":1,"images":{}}\n');
    if (phase !== 'rollback') { await mkdir(staging); await writeFile(join(staging, 'index.md'), 'New generated home'); }
    if (phase !== 'prepared') await rename(f.config.feed.directory, previous);
    if (phase === 'transferred' || phase === 'installed') await rename(join(previous, 'clippings'), join(staging, 'clippings'));
    if (phase === 'installed') await rename(staging, f.config.feed.directory);
    await mkdir(f.config.paths.recovery, { recursive: true });
    await writeFile(f.config.paths.contentJournal, JSON.stringify({ destination: f.config.feed.directory, staging, previous, publications: [] }));
    await recoverContent(f.config, f.store);
    await recoverContent(f.config, f.store);
    assert.deepEqual(await readFile(join(f.clippings, 'article.md')), bytes);
    assert.equal(await readFile(join(f.clippings, 'assets', 'image.gif'), 'utf8'), 'GIF89a-original-bytes');
    assert.equal(await readFile(join(f.clippings, 'assets', 'manifest.json'), 'utf8'), '{"version":1,"images":{}}\n');
    await assert.rejects(readFile(f.config.paths.contentJournal), { code: 'ENOENT' });
  } finally { await f.cleanup(); }
});

test('concurrent recreation during the handoff preserves every tree for recovery', async () => {
  const f = await fixture();
  try {
    const staging = join(f.root, '.content-stage-test'), previous = join(f.root, 'content.previous-test');
    await rename(f.config.feed.directory, previous);
    await mkdir(staging); await writeFile(join(staging, 'index.md'), 'New home');
    await mkdir(f.clippings, { recursive: true }); await writeFile(join(f.clippings, 'concurrent.md'), 'Concurrent addition');
    await mkdir(f.config.paths.recovery, { recursive: true });
    await writeFile(f.config.paths.contentJournal, JSON.stringify({ destination: f.config.feed.directory, staging, previous }));
    await assert.rejects(recoverContent(f.config, f.store), /all trees have been kept/);
    assert.equal(await readFile(join(f.clippings, 'concurrent.md'), 'utf8'), 'Concurrent addition');
    assert.match(await readFile(join(previous, 'clippings/article.md'), 'utf8'), /One original/);
    assert.equal(await readFile(join(staging, 'index.md'), 'utf8'), 'New home');
  } finally { await f.cleanup(); }
});

test('recovery keeps the journal and every tree when a Clippings translation mirror exists', async () => {
  for (const location of ['previous', 'staging', 'destination'] as const) {
    const f = await fixture();
    try {
      const staging = join(f.root, '.content-stage-test'), previous = join(f.root, 'content.previous-test');
      await rename(f.config.feed.directory, previous);
      await mkdir(staging); await writeFile(join(staging, 'index.md'), 'New home');
      if (location === 'destination') await rename(staging, f.config.feed.directory);
      const tree = location === 'previous' ? previous : location === 'staging' ? staging : f.config.feed.directory;
      const mirror = join(tree, '_translations/fr/clippings/article.md');
      await mkdir(join(mirror, '..'), { recursive: true }); await writeFile(mirror, 'Keep this translation');
      const journal = f.config.paths.contentJournal;
      await mkdir(f.config.paths.recovery, { recursive: true });
      await writeFile(journal, JSON.stringify({ destination: f.config.feed.directory, staging, previous }));
      await assert.rejects(recoverContent(f.config, f.store), /Clippings.*translation/);
      assert.equal(await readFile(mirror, 'utf8'), 'Keep this translation');
      assert.ok(existsSync(journal));
      assert.match(await readFile(join(previous, 'clippings/article.md'), 'utf8'), /One original/);
    } finally { await f.cleanup(); }
  }
});

test('clippings cannot be configured as a collected source', async () => {
  const f = await fixture();
  try { assert.throws(() => testContext({ ...f.config, sources: [{ ...f.config.sources[0], id: 'clippings' }] }), /reserved/); }
  finally { await f.cleanup(); }
});

for (const kind of ['root-link', 'root-file', 'nested-link'] as const) test(`archive and render reject ${kind} without adopting or moving authored content`, async () => {
  const f = await fixture(true);
  const outside = join(f.root, 'outside'), original = await readFile(join(f.clippings, 'article.md'));
  try {
    await mkdir(outside); await writeFile(join(outside, 'private.md'), 'Keep private');
    let unsafe = f.clippings;
    if (kind === 'root-file') { await rename(f.clippings, join(f.root, 'saved-clippings')); await writeFile(f.clippings, 'Keep this file'); }
    else {
      if (kind === 'root-link') await rename(f.clippings, join(f.root, 'saved-clippings'));
      else { await mkdir(join(f.clippings, 'assets')); unsafe = join(f.clippings, 'assets', 'external'); }
      await symlink(outside, unsafe, process.platform === 'win32' ? 'junction' : 'dir');
    }
    const rejected = /Authored clippings.*(?:regular directory|symlink)/;
    await assert.rejects(async () => { const snapshot = await scanArchives(f.config); await snapshot.dispose(); }, rejected);
    await assert.rejects(importArchives(f.config, f.store), rejected);
    await assert.rejects(writeSite(f.config, f.store), rejected);
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM feed_archive_files').get() as { n: number }).n, 0);
    assert.equal(await readFile(join(outside, 'private.md'), 'utf8'), 'Keep private');
    assert.deepEqual(await readFile(join(kind === 'nested-link' ? f.clippings : join(f.root, 'saved-clippings'), 'article.md')), original);
    assert.equal(existsSync(f.config.paths.contentJournal), false);
  } finally { await f.cleanup(); }
});

test('a link introduced during rendering stops handoff and remains recoverable', async t => {
  const f = await fixture(), outside = join(f.root, 'outside');
  try {
    await mkdir(outside); await writeFile(join(outside, 'private.md'), 'Keep private');
    let inserted = false;
    const originalLease = f.store.assertLease.bind(f.store);
    t.mock.method(f.store, 'assertLease', () => {
      originalLease();
      if (inserted || !readdirSync(f.root).some(name => name.startsWith('.content-stage-') && existsSync(join(f.root, name, '_recommendations.json')))) return;
      inserted = true;
      symlinkSync(outside, join(f.clippings, 'external'), process.platform === 'win32' ? 'junction' : 'dir');
    });
    await assert.rejects(writeSite(f.config, f.store), /Authored clippings.*symlink/);
    assert.equal(inserted, true);
    const journal = f.config.paths.contentJournal;
    const { previous } = JSON.parse(await readFile(journal, 'utf8'));
    await assert.rejects(recoverContent(f.config, f.store), /Authored clippings.*symlink/);
    assert.match(await readFile(join(previous, 'clippings/article.md'), 'utf8'), /One original/);
    // Unlink only the junction; recovery can then complete the original handoff.
    await rm(join(previous, 'clippings/external'), { recursive: true });
    await recoverContent(f.config, f.store);
    assert.match(await readFile(join(f.clippings, 'article.md'), 'utf8'), /One original/);
    assert.equal(await readFile(join(outside, 'private.md'), 'utf8'), 'Keep private');
    assert.equal(existsSync(journal), false);
  } finally { await f.cleanup(); }
});

for (const location of ['previous', 'staging', 'destination'] as const) test(`recovery rejects authored links in ${location} before deleting any tree`, async () => {
  const f = await fixture();
  try {
    const staging = join(f.root, '.content-stage-test'), previous = join(f.root, 'content.previous-test'), outside = join(f.root, 'outside');
    await mkdir(outside); await writeFile(join(outside, 'private.md'), 'Keep private');
    await rename(f.config.feed.directory, previous);
    await mkdir(staging); await writeFile(join(staging, 'index.md'), 'New home');
    if (location === 'destination') await rename(staging, f.config.feed.directory);
    const tree = location === 'previous' ? previous : location === 'staging' ? staging : f.config.feed.directory;
    await mkdir(join(tree, 'clippings'), { recursive: true });
    await symlink(outside, join(tree, 'clippings/external'), process.platform === 'win32' ? 'junction' : 'dir');
    const journal = f.config.paths.contentJournal;
    await mkdir(f.config.paths.recovery, { recursive: true });
    const state = JSON.stringify({ destination: f.config.feed.directory, staging, previous });
    await writeFile(journal, state);
    await assert.rejects(recoverContent(f.config, f.store), /Authored clippings.*symlink/);
    assert.equal(await readFile(journal, 'utf8'), state);
    assert.match(await readFile(join(previous, 'clippings/article.md'), 'utf8'), /One original/);
    assert.equal(await readFile(join(location === 'destination' ? f.config.feed.directory : staging, 'index.md'), 'utf8'), 'New home');
    assert.equal(await readFile(join(outside, 'private.md'), 'utf8'), 'Keep private');
  } finally { await f.cleanup(); }
});

for (const kind of ['archive', 'summary'] as const) test(`a stored ${kind} targeting clippings cannot overwrite authored content`, async () => {
  const f = await fixture();
  try {
    const original = await readFile(join(f.clippings, 'article.md')), at = '2026-10-24T00:00:00.000Z';
    const source = kind === 'summary' ? 'clippings' : 'one', id = 'collision';
    const item = { source, id, stream: 'main', channel: 'rss', title: 'Collision', text: '', url: 'https://example.test/item', basis: 'published', publishedAt: at, observedAt: at, metrics: {} };
    f.store.db.prepare('INSERT INTO feed_publications VALUES (?,?)').run(source, id);
    if (kind === 'summary') {
      const record = { item, copy: { source, id, topics: [], en: { title: 'Collision', summary: '' }, 'zh-CN': { title: '冲突', summary: '' } }, firstSeen: at, date: at, dateBasis: 'published', updated: at };
      f.store.db.prepare('INSERT INTO feed_summaries VALUES (?,?,?,?,?)').run(source, id, 'fixture', JSON.stringify(record), at);
    } else {
      f.store.db.prepare('INSERT INTO items VALUES (?,?,?,?,?,?,?)').run(source, id, at, at, at, JSON.stringify(item), 'fixture');
      f.store.db.prepare('INSERT INTO feed_archives VALUES (?,?,?,?,?,?,?,?)').run('clippings/article.md', source, id, '2026-10-24', 1, JSON.stringify(item), 'Overwrite English', 'Overwrite Chinese');
    }
    await assert.rejects(writeSite(f.config, f.store), /Generated (?:archive|item) occupies the authored clippings directory/);
    assert.deepEqual(await readFile(join(f.clippings, 'article.md')), original);
    assert.equal(existsSync(f.config.paths.contentJournal), false);
    assert.equal((await readdir(f.root)).some(name => name.startsWith('.content-stage-')), false);
  } finally { await f.cleanup(); }
});
