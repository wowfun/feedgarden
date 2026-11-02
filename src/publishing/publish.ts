import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { FdgError } from '../contracts/errors.js';
import type { Target } from '../contracts/publishing.js';
import type { InstanceContext } from '../instance/index.js';
import { configureGitDns, git } from '../platform/git.js';
import { isAtomicWriteTemp } from '../platform/files.js';
import { checkout } from './checkout.js';
import { indexSession, inScope, materialize, mergeHead, names, scopePaths, selectIndex } from './snapshot.js';
import { confirmPush, remoteHead } from './transport.js';
import { validateSnapshot } from './validate.js';
import { changeSummary } from './summary.js';

type PublicationReceipt = { targetId: string; worktree: string } & Awaited<ReturnType<typeof changeSummary>> & (
  | { dryRun: true; head: string | null; baseTree: string; tree: string; diffStat: string; commit?: never; confirmed?: never }
  | { dryRun?: false; commit: string | null; confirmed: true }
);

/** A remote file/directory replacement can obstruct a different literal path. */
function pathOverlap(incoming: string[]) {
  const files = new Set(incoming), directories = new Set<string>();
  function* parents(path: string) {
    for (let end = path.indexOf('/'); end !== -1; end = path.indexOf('/', end + 1)) yield path.slice(0, end);
  }
  for (const file of files) for (const parent of parents(file)) directories.add(parent);
  return (local: string) => {
    const path = local.replace(/\/$/, '');
    if (files.has(path) || directories.has(path)) return true;
    for (const parent of parents(path)) if (files.has(parent)) return true;
    return false;
  };
}

/** Publish current files. Generation and summary storage are deliberately absent. */
export async function publish(config: InstanceContext, target: Target, options: { dryRun?: boolean; signal?: AbortSignal } = {}): Promise<PublicationReceipt> {
  const { signal } = options, current = await checkout(config, target, signal), root = current.root;
  const session = await indexSession(root, join(config.paths.cache, 'git-validation'), !!options.dryRun, signal);
  const { run, originalRun } = session;
  let install = false, preserve: string[] = [];
  try {
    const unresolved = names(await originalRun(['diff', '--name-only', '--diff-filter=U', '-z']));
    if (unresolved.length) throw new FdgError('GIT_CONFLICT', 'Resolve and git add the conflicted paths: ' + unresolved.join(', '));
    let head = current.head, merging = await mergeHead(root);
    const base = head ? await run(['rev-parse', head + '^{tree}']) : await run(['hash-object', '-w', '-t', 'tree', '--stdin'], '');
    await run(['read-tree', base]);
    // Enumerate both sides of renames and every Git link, independent of the
    // user's display preferences. These paths will be used to restore the index.
    const pathDiff = ['diff', '--ignore-submodules=none', '--no-renames', '--name-only', '-z'];
    const staged = names(await originalRun([...pathDiff, '--cached', base]));
    // Continuing a resolved ordinary merge includes its remote changes outside
    // the publication scope, while keeping unrelated staging out of the commit.
    const mergePaths = merging && head ? names(await run([...pathDiff, await run(['merge-base', head, merging]), merging])) : [];
    if (mergePaths.length) {
      await run(['update-index', '--force-remove', '-z', '--stdin'], mergePaths.join('\0') + '\0');
      const entries = selectIndex(await originalRun(['ls-files', '--stage', '-z']), mergePaths);
      if (entries) await run(['update-index', '-z', '--index-info'], entries);
    }
    const mergingPaths = new Set(mergePaths);
    preserve = staged.filter(path => !inScope(path, target) && !mergingPaths.has(path));
    const scope = ['--', ...scopePaths(target)];
    const tracked = names(await run(['ls-files', '--cached', '-z', ...scope]));
    const additions = names(await run(['ls-files', '--others', '--exclude-standard', '-z', ...scope])).filter(path => !isAtomicWriteTemp(path));
    // Honor an explicit git add -f, even if the new path is normally ignored.
    const stagedAdditions = names(await originalRun([...pathDiff, '--cached', '--diff-filter=A', base, ...scope]))
      .filter(path => existsSync(join(root, path)));
    const files = new Set([...tracked, ...additions, ...stagedAdditions]);
    if (files.size) await run(['add', '-f', '-A', '--pathspec-from-file=-', '--pathspec-file-nul'], [...files].join('\0') + '\0');
    const tree = await run(['write-tree']);
    const summary = await changeSummary(root, base, tree, target, signal);
    const snapshot = join(session.directory, 'snapshot');
    await materialize(root, tree, target, snapshot, signal);
    await validateSnapshot(config, target, snapshot, signal);
    if (options.dryRun) return { targetId: target.id, worktree: root, head: head ?? null, baseTree: base, tree, ...summary,
      diffStat: await run(['diff', '--shortstat', base, tree, ...scope]), dryRun: true };

    async function commitTree(nextTree: string, parent: string | undefined, mergeParent?: string) {
      signal?.throwIfAborted();
      const parents = [parent, mergeParent].flatMap(oid => oid ? ['-p', oid] : []);
      const commit = await run(['-c', 'user.name=Feedgarden', '-c', 'user.email=feedgarden@localhost', 'commit-tree', nextTree, ...parents, '-m', mergeParent ? 'Merge publication changes' : 'Publish feed updates']);
      await run(['update-ref', '-m', 'feedgarden: publish validated tree', 'HEAD', commit, parent ?? '0'.repeat(commit.length)]);
      install = true;
      if (mergeParent) await run(['merge', '--quit']);
      return commit;
    }
    if (tree !== base || merging) {
      head = await commitTree(tree, head, merging);
      merging = undefined;
    }

    await configureGitDns(target.repository, root, signal);
    let remote = await remoteHead(root, target, git, signal);
    if (remote) {
      await run(['fetch', '--no-tags', 'origin', target.branch]);
      remote = await run(['rev-parse', 'FETCH_HEAD']);
      const common = head && remote !== head ? await run(['merge-base', head, remote]) : head;
      if (remote !== common) {
        const overlapsIncoming = pathOverlap(names(await run([...pathDiff, common ?? base, remote])));
        const overlap = preserve.filter(overlapsIncoming);
        if (overlap.length) throw new FdgError('GIT_LOCAL_CHANGES', 'Remote changes overlap unrelated staged paths: ' + overlap.join(', '));
        install = true;
        try { await run(['-c', 'user.name=Feedgarden', '-c', 'user.email=feedgarden@localhost', 'merge', '--no-overwrite-ignore', ...(head ? ['--no-ff', '--no-commit'] : ['--ff-only']), 'FETCH_HEAD']); }
        catch (error) {
          const conflicts = names(await run(['diff', '--name-only', '--diff-filter=U', '-z']));
          if (conflicts.length) throw new FdgError('GIT_CONFLICT', 'Resolve and git add the conflicted paths, then publish again: ' + conflicts.join(', '));
          if (error instanceof FdgError && error.code === 'GIT_FAILED') {
            const dirty = names(await run(pathDiff));
            const untracked = names(await run(['ls-files', '--others', '--directory', '--no-empty-directory', '-z']));
            const blocked = [...dirty, ...untracked].filter(overlapsIncoming);
            if (blocked.length) throw new FdgError('GIT_LOCAL_CHANGES', 'Remote changes overlap local working files: ' + blocked.join(', '));
          }
          throw error;
        }
        if (!head) head = await run(['rev-parse', 'HEAD']);
        merging = await mergeHead(root);
      }
      const mergedTree = await run(['write-tree']);
      // Compare modes and object IDs at the scope roots. A display diff can
      // hide a newly merged submodule, which must invalidate the trusted build.
      const scopedTree = (revision: string) => run(['ls-tree', '-z', revision, ...scope]);
      const changedSnapshot = mergedTree !== tree && await scopedTree(mergedTree) !== await scopedTree(tree);
      if (changedSnapshot) {
        const merged = join(session.directory, 'merged');
        await materialize(root, mergedTree, target, merged, signal);
        await validateSnapshot(config, target, merged, signal);
      }
      if (merging) head = await commitTree(mergedTree, head, merging);
    }
    if (!head) return { targetId: target.id, worktree: root, commit: null, ...summary, confirmed: true };
    if (head !== remote) await confirmPush(root, target, remote, head, git, signal);
    return { targetId: target.id, worktree: root, commit: head, ...summary, confirmed: true };
  } finally {
    try { if (install) await session.install(preserve); }
    finally { await session.dispose(); }
  }
}
