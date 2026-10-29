import { existsSync } from 'node:fs';
import { lstat, readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { FdgError } from '../contracts/errors.js';

export async function tree(root: string, prefix = ''): Promise<Record<string, Buffer>> {
  const result: Record<string, Buffer> = {};
  if (!existsSync(root)) return result;
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name),
      key = prefix + entry.name,
      stat = await lstat(path);
    if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory()))
      throw new FdgError('UNSAFE_PATH', 'Managed tree contains a special file: ' + key);
    if (stat.isDirectory()) Object.assign(result, await tree(path, key + '/'));
    else result[key] = await readFile(path);
  }
  return result;
}
export async function ensureSafe(root: string, path: string): Promise<string> {
  const target = resolve(root, path),
    rel = relative(root, target);
  if (!rel || rel.startsWith('..') || resolve(root) === target)
    throw new FdgError('UNSAFE_PATH', 'Invalid managed path');
  let parent = root;
  for (const part of rel.split(/[\\/]/)) {
    parent = join(parent, part);
    if (
      (existsSync(parent) && !(await lstat(parent)).isFile() && !(await lstat(parent)).isDirectory()) ||
      (existsSync(parent) && (await lstat(parent)).isSymbolicLink())
    )
      throw new FdgError('UNSAFE_PATH', 'Managed path traverses a special file');
  }
  return target;
}
