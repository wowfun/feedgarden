import { existsSync } from 'node:fs';
import { lstat, mkdir, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { FdgError } from '../contracts/errors.js';
import type { Target } from '../contracts/publishing.js';
import type { InstanceContext } from '../instance/index.js';
import { assertExportDirectory } from '../instance/index.js';
import { configureGitDns, git } from '../platform/git.js';
import { ensureSafe, treeFiles } from '../platform/tree.js';
import { remoteHead } from './transport.js';
import { statusSummary } from './summary.js';

export function targetWorktree(config: InstanceContext, target: Target): string {
  return resolve(target.worktree ?? join(config.paths.dataDir, 'repositories', target.id));
}

/** A target is a regular, persistent checkout. Never reset, clean or claim it. */
export async function checkout(config: InstanceContext, target: Target, signal?: AbortSignal, { scanPrefix = true } = {}) {
  if (target.repository.startsWith('-') || /^(ext|file):/i.test(target.repository))
    throw new FdgError('CONFIG_INVALID', 'Unsupported repository transport');
  const root = targetWorktree(config, target);
  for (const path of [target.managedPrefix, ...target.auxiliaryFiles]) assertExportDirectory(config.paths, join(root, path));
  if (!existsSync(join(root, '.git'))) {
    if (target.worktree) throw new FdgError('BAD_INPUT', 'Target worktree must be an existing Git checkout: ' + root);
    await mkdir(root, { recursive: true });
    if ((await readdir(root)).length) throw new FdgError('BAD_INPUT', 'Repository directory is not empty: ' + root);
    await git(['init', '--quiet', '--initial-branch=' + target.branch], root, signal);
    await git(['remote', 'add', 'origin', target.repository], root, signal);
    await git(['config', 'branch.' + target.branch + '.remote', 'origin'], root, signal);
    await git(['config', 'branch.' + target.branch + '.merge', 'refs/heads/' + target.branch], root, signal);
  }
  if (relative(root, resolve(await git(['rev-parse', '--show-toplevel'], root, signal))))
    throw new FdgError('BAD_INPUT', 'Target worktree must be the Git checkout root');
  const branch = await git(['symbolic-ref', '--short', 'HEAD'], root, signal);
  if (branch !== target.branch) throw new FdgError('BAD_INPUT', 'Target worktree is on ' + branch + '; expected ' + target.branch);
  const remote = await git(['remote', 'get-url', 'origin'], root, signal);
  if (remote !== target.repository) throw new FdgError('BAD_INPUT', 'Target origin differs from configured repository');
  let head = await git(['rev-parse', '--verify', '--quiet', 'HEAD'], root, signal).catch(() => undefined);
  // Also completes a clone whose first network request was interrupted. Git
  // refuses checkout if a retry would overwrite locally created files.
  if (!head && !target.worktree) {
    await configureGitDns(target.repository, root, signal);
    if (await remoteHead(root, target, git, signal)) {
      await git(['fetch', '--no-tags', 'origin', target.branch], root, signal);
      await git(['checkout', '-B', target.branch, 'FETCH_HEAD'], root, signal);
      head = await git(['rev-parse', 'HEAD'], root, signal);
    }
  }
  if (head) await assertTreeModes(root, 'HEAD', target, signal);
  const prefix = await ensureSafe(root, target.managedPrefix);
  // Check ignored/untracked special files too, without reading file contents.
  if (scanPrefix) for await (const _ of treeFiles(prefix)) signal?.throwIfAborted();
  for (const path of target.auxiliaryFiles) {
    const full = await ensureSafe(root, path);
    if (existsSync(full) && !(await lstat(full)).isFile()) throw new FdgError('UNSAFE_PATH', 'Auxiliary path must be a file: ' + path);
  }
  return { root, prefix, head, branch, remote };
}

export async function assertTreeModes(root: string, revision: string, target: Target, signal?: AbortSignal) {
  for (const entry of (await git(['ls-tree', '-r', '-z', revision, '--', target.managedPrefix, ...target.auxiliaryFiles], root, signal)).split('\0').filter(Boolean))
    if (!/^100(?:644|755) /.test(entry))
      throw new FdgError('UNSAFE_PATH', 'Target contains a symlink or submodule: ' + entry.split('\t')[1]);
}

export async function inspectTarget(config: InstanceContext, target: Target) {
  const current = await checkout(config, target);
  return {
    targetId: target.id, worktree: current.root, branch: current.branch, remote: current.remote,
    head: current.head ?? null,
    ...await statusSummary(current.root),
    diffStat: await git(['diff', '--shortstat', ...(current.head ? ['HEAD'] : ['--cached']), '--', target.managedPrefix, ...target.auxiliaryFiles], current.root),
  };
}
