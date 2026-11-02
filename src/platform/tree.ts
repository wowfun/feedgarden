import { existsSync } from 'node:fs';
import { lstat, readdir } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { FdgError } from '../contracts/errors.js';

/** Visit regular files without loading their bodies; links and devices are never followed. */
export async function* treeFiles(root: string, prefix = ''): AsyncGenerator<string> {
  if (!existsSync(root)) return;
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name),
      key = prefix + entry.name,
      stat = await lstat(path);
    if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory()))
      throw new FdgError('UNSAFE_PATH', 'Managed tree contains a special file: ' + key);
    if (stat.isDirectory()) yield* treeFiles(path, key + '/');
    else yield key;
  }
}
export async function ensureSafe(root: string, path: string): Promise<string> {
  const target = resolve(root, path),
    rel = relative(root, target);
  if (!rel || isAbsolute(rel) || rel === '..' || rel.startsWith('..\\') || rel.startsWith('../') || /[:\\\0]/.test(path) || isAbsolute(path) || path.split('/').some(part => ['', '.', '..', '.git'].includes(part.toLowerCase())))
    throw new FdgError('UNSAFE_PATH', 'Invalid managed path');
  let parent = root;
  for (const part of rel.split(/[\\/]/)) {
    parent = join(parent, part);
    let stat;
    try { stat = await lstat(parent); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') break;
      throw error;
    }
    if (!stat.isFile() && !stat.isDirectory())
      throw new FdgError('UNSAFE_PATH', 'Managed path traverses a special file');
  }
  return target;
}
