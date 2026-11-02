import { existsSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, open, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { FdgError } from '../contracts/errors.js';
import type { Target } from '../contracts/publishing.js';
import { git, gitBlobs } from '../platform/git.js';
import { markArtifact, pruneArtifacts } from '../platform/retention.js';
import { ensureSafe } from '../platform/tree.js';
import { assertTreeModes } from './checkout.js';

export const scopePaths = (target: Target) => [target.managedPrefix, ...target.auxiliaryFiles];
export const inScope = (path: string, target: Target) => path.startsWith(target.managedPrefix + '/') || target.auxiliaryFiles.includes(path);
export const names = (value: string) => value.split('\0').filter(Boolean);
export const selectIndex = (entries: string, paths: string[]) => {
  const selected = new Set(paths);
  return names(entries).filter(entry => selected.has(entry.slice(entry.indexOf('\t') + 1))).map(entry => entry + '\0').join('');
};

/** The real index stays locked and intact until an exact validated tree commits.
 * All staging/merging uses an alternate index; unrelated staged entries are restored. */
export async function indexSession(root: string, cache: string, dryRun: boolean, signal?: AbortSignal) {
  const realIndex = resolve(root, await git(['rev-parse', '--git-path', 'index'], root, signal));
  await mkdir(cache, { recursive: true });
  // Only abandoned validation scratch directories are eligible; active runs,
  // unmarked directories and ordinary repository clones remain untouched.
  await pruneArtifacts(cache, 'git-validation', 'git-validation', 0, 7);
  const directory = await mkdtemp(join(cache, 'git-'));
  try { await markArtifact(directory, 'git-validation', 'git-validation'); }
  catch (error) { await rm(directory, { recursive: true, force: true }); throw error; }
  const lockPath = realIndex + '.lock';
  let locked = false;
  if (!dryRun) {
    try { const lock = await open(lockPath, 'wx'); await lock.close(); locked = true; }
    catch { await rm(directory, { recursive: true, force: true }); throw new FdgError('BUSY', 'Git index is locked: ' + lockPath); }
  }
  const original = join(directory, 'original'), index = join(directory, 'index');
  try { if (existsSync(realIndex)) await copyFile(realIndex, original); }
  catch (error) {
    if (locked) await rm(lockPath, { force: true });
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
  const run = (args: string[], input?: string) => git(args, root, signal, { indexFile: index, input });
  const originalRun = (args: string[]) => git(args, root, signal, { indexFile: original });
  return {
    directory, index, run, originalRun,
    async install(preserve: string[]) {
      // Reset selected entries in the new index to their original staged values,
      // including staged deletions. This never touches working files.
      if (preserve.length) {
        const cleanup = (args: string[], input?: string) => git(args, root, undefined, { indexFile: index, input });
        await cleanup(['update-index', '--force-remove', '-z', '--stdin'], preserve.join('\0') + '\0');
        const entries = selectIndex(await git(['ls-files', '--stage', '-z'], root, undefined, { indexFile: original }), preserve);
        if (entries) await cleanup(['update-index', '-z', '--index-info'], entries);
      }
      await copyFile(index, lockPath);
      await rename(lockPath, realIndex); locked = false;
    },
    async dispose() {
      if (locked) await rm(lockPath, { force: true });
      await rm(directory, { recursive: true, force: true });
    },
  };
}

export async function materialize(root: string, revision: string, target: Target, destination: string, signal?: AbortSignal) {
  await assertTreeModes(root, revision, target, signal);
  await mkdir(join(destination, target.managedPrefix), { recursive: true });
  const rows = names(await git(['ls-tree', '-r', '-z', revision, '--', ...scopePaths(target)], root, signal))
    .map(line => ({ oid: line.slice(0, line.indexOf('\t')).split(' ')[2]!, path: line.slice(line.indexOf('\t') + 1) }));
  const paths = new Map<string, string[]>();
  for (const row of rows) { const list = paths.get(row.oid) ?? []; list.push(row.path); paths.set(row.oid, list); }
  for await (const { oid, body } of gitBlobs([...paths.keys()], root, signal)) {
    for (const name of paths.get(oid)!) {
      const path = await ensureSafe(destination, name);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, body, { signal });
    }
  }
}

export async function mergeHead(root: string): Promise<string | undefined> {
  const file = resolve(root, await git(['rev-parse', '--git-path', 'MERGE_HEAD'], root));
  return existsSync(file) ? (await readFile(file, 'utf8')).trim() : undefined;
}
