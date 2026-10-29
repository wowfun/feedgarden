import { existsSync, lstatSync } from 'node:fs';
import { isAbsolute, join, parse, relative, resolve } from 'node:path';
import { FdgError } from '../contracts/errors.js';
import type { InstancePaths } from './paths.js';
const contains = (root: string, path: string) => {
  const part = relative(resolve(root), resolve(path));
  return !part || (!part.startsWith('..') && !isAbsolute(part));
};
export function assertExportDirectory(paths: InstancePaths, output: string): void {
  const destination = resolve(output);
  const privateTrees = [
    paths.stateDir,
    paths.cacheDir,
    ...[
      'workspaces',
      'backups',
      'recovery',
      'targets',
      'runtime',
      'tools',
      'secrets',
      'runner',
      'maintenance',
    ].map((name) => join(paths.dataDir, name)),
  ];
  if (
    contains(destination, paths.dataDir) ||
    contains(destination, paths.configDir) ||
    privateTrees.some((root) => contains(root, destination) || contains(destination, root))
  )
    throw new FdgError('UNSAFE_PATH', 'Export directory overlaps private instance data');
  let parent = parse(destination).root;
  for (const part of relative(parent, destination).split(/[\\/]/)) {
    parent = join(parent, part);
    if (existsSync(parent) && lstatSync(parent).isSymbolicLink())
      throw new FdgError('UNSAFE_PATH', 'Export directory traverses a symbolic link');
  }
}
