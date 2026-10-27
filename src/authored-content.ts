import { lstat, readdir, rename } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export const authoredDirectory = 'clippings';

export function isAuthoredPath(path: string): boolean {
  const original = path.replace(/^_translations\/[^/]+\//, '');
  return original === authoredDirectory || original.startsWith(authoredDirectory + '/');
}

async function assertNoAuthoredTranslations(root: string): Promise<void> {
  const translations = join(root, '_translations');
  const locales = await readdir(translations).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  for (const locale of locales) {
    const path = join(translations, locale, authoredDirectory);
    const info = await lstat(path).catch(error => {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return undefined;
      throw error;
    });
    if (info) throw new Error('Clippings share one body; remove or relocate the translation mirror before rendering: ' + path);
  }
}

export async function assertAuthoredContent(root: string): Promise<void> {
  await assertNoAuthoredTranslations(root);
  const directory = resolve(root, authoredDirectory);
  const info = await lstat(directory).catch(error => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (!info) return;
  if (info.isSymbolicLink() || !info.isDirectory()) throw new Error('Authored clippings must be a regular directory: ' + directory);
  async function walk(path: string): Promise<void> {
    for (const name of await readdir(path)) {
      const entry = join(path, name), info = await lstat(entry);
      if (info.isSymbolicLink()) throw new Error('Authored clippings do not follow symlinks: ' + entry);
      if (info.isDirectory()) await walk(entry);
      else if (!info.isFile()) throw new Error('Authored clippings must contain regular files and directories: ' + entry);
    }
  }
  await walk(directory);
}

// Move the directory itself at the content-tree handoff. Copying an earlier
// snapshot would lose edits, additions or deletions made while rendering.
export async function transferAuthoredContent(previous: string, staging: string): Promise<void> {
  await assertAuthoredContent(previous);
  await assertAuthoredContent(staging);
  const source = join(previous, authoredDirectory), target = join(staging, authoredDirectory);
  const info = await lstat(source).catch(error => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (!info) return; // Also covers a completed transfer during crash recovery.
  if (info.isSymbolicLink() || !info.isDirectory()) throw new Error('Authored clippings must be a regular directory: ' + source);
  const occupied = await lstat(target).catch(error => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (occupied) throw new Error('Content handoff found two clippings directories; both trees have been kept');
  await rename(source, target);
}
