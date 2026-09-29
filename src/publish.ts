import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import type { Config } from './config.js';
import { buildSite, run } from './build-site.js';

export function assertManagedPaths(paths: string[]): void {
  if (paths.some(path => !path.startsWith('reports/') || path.split('/').some(part => part === '..'))) throw new Error('Publication contains unmanaged paths');
}
export async function publish(config: Config): Promise<void> {
  if (config.reports.directory !== 'reports') throw new Error('Publishing requires the managed reports/ directory');
  const root = process.cwd();
  const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
  if (remote !== config.publish.repository) throw new Error('Origin differs from the configured publication repository');
  await run('git', ['fetch', 'origin', config.publish.branch], root);
  await mkdir(config.storage.directory, { recursive: true });
  const temporary = await mkdtemp(resolve(config.storage.directory, 'publish-'));
  const worktree = join(temporary, 'checkout');
  let attached = false;
  try {
    await run('git', ['worktree', 'add', '--detach', worktree, 'FETCH_HEAD'], root); attached = true;
    await rm(join(worktree, 'reports'), { recursive: true, force: true });
    await cp(resolve('reports'), join(worktree, 'reports'), { recursive: true });
    await run('git', ['add', '--', 'reports'], worktree);
    const paths = execFileSync('git', ['diff', '--cached', '--name-only', '-z'], { cwd: worktree, encoding: 'utf8' }).split('\0').filter(Boolean);
    assertManagedPaths(paths);
    if (!paths.length) { console.log('No report changes to publish.'); return; }
    await buildSite(worktree);
    await run('git', ['commit', '-m', 'Publish Feedgarden reports'], worktree);
    // A concurrent remote update rejects this push. A later run starts from its new HEAD.
    await run('git', ['push', 'origin', 'HEAD:refs/heads/' + config.publish.branch], worktree);
  } finally {
    if (attached) await run('git', ['worktree', 'remove', '--force', worktree], root);
    await rm(temporary, { recursive: true, force: true });
  }
}
