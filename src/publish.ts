import { storagePaths } from './storage-paths.js';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdtemp, mkdir, rm, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import type { Config } from './config.js';
import { buildSite, run } from './build-site.js';
import { assertSiteBundle, parseSiteBundle, readSiteBundle } from './site-bundle.js';
import { applyTopics, loadTopics, mergeTopics, type Registry } from './topics.js';
import { validateRegistry } from './topics-contract.mjs';
import { atomicWrite, hash } from './util.js';
import { Store } from './store.js';
import { writeSite } from './site.js';
import { assertAuthoredContent } from './authored-content.js';
export function assertManagedPaths(paths: string[]): void {
  if (paths.some(path => path.split('/').some(part => part === '..' || part === '') || !(path.startsWith('content/') || path === 'config/topics.json'))) throw new Error('Publication contains unmanaged paths');
}
function git(args: string[], cwd = process.cwd()): string { return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim(); }
export function remoteTopics(revision: string): Registry {
  let file: string;
  try { file = git(['show', revision + ':config/topics.json']); }
  catch { if (!git(['ls-tree', '--name-only', revision, '--', 'config/topics.json'])) return { version: 1, topics: [] }; throw new Error('Cannot read remote topic registry'); }
  return validateRegistry(JSON.parse(file)) as Registry;
}
export async function publish(config: Config, store?: Store, validate: (root: string) => Promise<unknown> = buildSite, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  if (config.feed.directory !== 'content' || config.feed.topics !== 'config/topics.json') throw new Error('Publishing requires the managed content/ and config/topics.json paths');
  await assertAuthoredContent(config.feed.directory);
  const root = process.cwd();
  const trustedBundle = await readSiteBundle(root);
  if (git(['remote', 'get-url', 'origin']) !== config.publish.repository) throw new Error('Origin differs from the configured publication repository');
  await run('git', ['fetch', 'origin', config.publish.branch], root);
  const remoteCommit = git(['rev-parse', 'FETCH_HEAD']), baseFile = storagePaths(config.storage).topicRemoteBase;
  const remoteFile = (file: string) => execFileSync('git', ['show', remoteCommit + ':' + file], { cwd: root, encoding: 'utf8' });
  assertSiteBundle(trustedBundle, parseSiteBundle(remoteFile('Gemfile'), remoteFile('Gemfile.lock')));
  const recorded = existsSync(baseFile) ? JSON.parse(await readFile(baseFile, 'utf8')) as { registry: Registry; commit: string } : undefined;
  const baseCommit = recorded?.commit ?? git(['merge-base', 'HEAD', remoteCommit]);
  const base = recorded?.registry ?? remoteTopics(baseCommit), local = await loadTopics(config.feed.topics), remote = remoteTopics(remoteCommit);
  let merged: Registry;
  try { merged = mergeTopics(base, local, remote); }
  catch (error) {
    await atomicWrite(storagePaths(config.storage).publishConflict, JSON.stringify({ baseCommit, remoteCommit, base, local, remote, error: String(error) }, null, 2));
    throw new Error('MANUAL_ACTION: ' + String(error) + '. Merge config/topics.json, then topics apply FILE --remote-base ' + remoteCommit + ' and retry publication. Details: ' + storagePaths(config.storage).publishConflict);
  }
  await applyTopics(config.feed.topics, merged, hash(local), signal);
  const opened = store ?? new Store(storagePaths(config.storage).database);
  try { await writeSite(config, opened, signal); } finally { if (!store) opened.close(); }
  await mkdir(storagePaths(config.storage).workspaces, { recursive: true, mode: 0o700 });
  const temporary = await mkdtemp(join(storagePaths(config.storage).workspaces, 'publish-')), worktree = join(temporary, 'checkout');
  let attached = false;
  try {
    await run('git', ['worktree', 'add', '--detach', worktree, remoteCommit], root); attached = true;
    const siteConfig = await readFile(join(worktree, '.github/jekyll-obsidian.yml'), 'utf8');
    if (!/source:\s*content\b/.test(siteConfig)) throw new Error('MANUAL_ACTION: integrate the item-feed implementation into the publication branch before publishing its content');
    await rm(join(worktree, 'content'), { recursive: true, force: true });
    await cp(resolve('content'), join(worktree, 'content'), { recursive: true, dereference: false });
    // Recheck the copied tree: authored files can change after render's handoff.
    await assertAuthoredContent(join(worktree, 'content'));
    await cp(resolve('config/topics.json'), join(worktree, 'config/topics.json'));
    await run('git', ['add', '--', 'content', 'config/topics.json'], worktree);
    const paths = execFileSync('git', ['diff', '--cached', '--name-only', '-z'], { cwd: worktree, encoding: 'utf8' }).split('\0').filter(Boolean);
    assertManagedPaths(paths);
    if (!paths.length) { await atomicWrite(baseFile, JSON.stringify({ commit: remoteCommit, registry: merged })); console.log('No item changes to publish.'); return; }
    await validate(worktree);
    signal?.throwIfAborted();
    store?.assertLease();
    await run('git', ['commit', '-m', 'Publish Feedgarden items and topics'], worktree);
    signal?.throwIfAborted();
    store?.assertLease();
    await run('git', ['push', 'origin', 'HEAD:refs/heads/' + config.publish.branch], worktree);
    await atomicWrite(baseFile, JSON.stringify({ commit: git(['rev-parse', 'HEAD'], worktree), registry: merged }));
  } finally {
    if (attached) await run('git', ['worktree', 'remove', '--force', worktree], root);
    await rm(temporary, { recursive: true, force: true });
  }
}
