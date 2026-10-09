import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdtemp, mkdir, rm, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import type { Config } from './config.js';
import { buildSite, run } from './build-site.js';
import { applyTopics, loadTopics, mergeTopics, type Registry } from './topics.js';
import { validateRegistry } from './topics-contract.mjs';
import { atomicWrite, hash } from './util.js';
import { Store } from './store.js';
import { writeSite } from './site.js';
export function assertManagedPaths(paths: string[], legacyDeletions: string[] = []): void {
  const legacy = new Set(legacyDeletions);
  if (paths.some(path => path.split('/').some(part => part === '..' || part === '') || !(path.startsWith('content/') || path === 'config/topics.json' || legacy.has(path) && path.startsWith('reports/')))) throw new Error('Publication contains unmanaged paths');
}
function git(args: string[], cwd = process.cwd()): string { return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim(); }
export function remoteTopics(revision: string): Registry {
  let file: string;
  try { file = git(['show', revision + ':config/topics.json']); }
  catch { if (!git(['ls-tree', '--name-only', revision, '--', 'config/topics.json'])) return { version: 1, topics: [] }; throw new Error('Cannot read remote topic registry'); }
  return validateRegistry(JSON.parse(file)) as Registry;
}
export async function publish(config: Config, store?: Store, validate: (root: string) => Promise<unknown> = buildSite): Promise<void> {
  if (config.feed.directory !== 'content' || config.feed.topics !== 'config/topics.json') throw new Error('Publishing requires the managed content/ and config/topics.json paths');
  const root = process.cwd();
  if (git(['remote', 'get-url', 'origin']) !== config.publish.repository) throw new Error('Origin differs from the configured publication repository');
  await run('git', ['fetch', 'origin', config.publish.branch], root);
  const remoteCommit = git(['rev-parse', 'FETCH_HEAD']), baseFile = resolve(config.storage.directory, 'topic-remote-base.json');
  const recorded = existsSync(baseFile) ? JSON.parse(await readFile(baseFile, 'utf8')) as { registry: Registry; commit: string } : undefined;
  const baseCommit = recorded?.commit ?? git(['merge-base', 'HEAD', remoteCommit]);
  const base = recorded?.registry ?? remoteTopics(baseCommit), local = await loadTopics(config.feed.topics), remote = remoteTopics(remoteCommit);
  let merged: Registry;
  try { merged = mergeTopics(base, local, remote); }
  catch (error) {
    await atomicWrite(resolve(config.storage.directory, 'publish-conflict.json'), JSON.stringify({ baseCommit, remoteCommit, base, local, remote, error: String(error) }, null, 2));
    throw new Error('MANUAL_ACTION: ' + String(error) + '. Merge config/topics.json, then topics apply FILE --remote-base ' + remoteCommit + ' and retry publication. Details: .local/publish-conflict.json');
  }
  await applyTopics(config.feed.topics, merged, hash(local));
  const opened = store ?? new Store(config.storage.database);
  try { await writeSite(config, opened); } finally { if (!store) opened.close(); }
  await mkdir(config.storage.directory, { recursive: true });
  const temporary = await mkdtemp(resolve(config.storage.directory, 'publish-')), worktree = join(temporary, 'checkout');
  let attached = false;
  try {
    await run('git', ['worktree', 'add', '--detach', worktree, remoteCommit], root); attached = true;
    const siteConfig = await readFile(join(worktree, '.github/jekyll-obsidian.yml'), 'utf8');
    if (!/source:\s*content\b/.test(siteConfig)) throw new Error('MANUAL_ACTION: integrate the item-feed implementation into the publication branch before publishing its content');
    await rm(join(worktree, 'content'), { recursive: true, force: true });
    await cp(resolve('content'), join(worktree, 'content'), { recursive: true });
    await cp(resolve('config/topics.json'), join(worktree, 'config/topics.json'));
    const legacy = git(['ls-files', '--', 'reports'], worktree).split('\n').filter(Boolean);
    if (legacy.length && !existsSync(resolve(config.storage.directory, 'migration.json'))) throw new Error('Legacy report deletion requires the migration journal');
    if (legacy.length) await rm(join(worktree, 'reports'), { recursive: true, force: true });
    await run('git', ['add', '--', 'content', 'config/topics.json', ...(legacy.length ? ['reports'] : [])], worktree);
    const paths = execFileSync('git', ['diff', '--cached', '--name-only', '-z'], { cwd: worktree, encoding: 'utf8' }).split('\0').filter(Boolean);
    const deletions = git(['diff', '--cached', '--name-only', '--diff-filter=D', '--', 'reports'], worktree).split('\n');
    assertManagedPaths(paths, legacy.filter(path => deletions.includes(path)));
    if (!paths.length) { await atomicWrite(baseFile, JSON.stringify({ commit: remoteCommit, registry: merged })); console.log('No item changes to publish.'); return; }
    await validate(worktree);
    await run('git', ['commit', '-m', 'Publish Feedgarden items and topics'], worktree);
    await run('git', ['push', 'origin', 'HEAD:refs/heads/' + config.publish.branch], worktree);
    await atomicWrite(baseFile, JSON.stringify({ commit: git(['rev-parse', 'HEAD'], worktree), registry: merged }));
  } finally {
    if (attached) await run('git', ['worktree', 'remove', '--force', worktree], root);
    await rm(temporary, { recursive: true, force: true });
  }
}
