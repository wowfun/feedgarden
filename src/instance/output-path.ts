import { lstatSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, parse, relative, resolve } from 'node:path';
import { FdgError } from '../contracts/errors.js';
import type { InstancePaths } from './paths.js';
const contains = (root: string, path: string) => {
  const part = relative(resolve(root), resolve(path));
  return !part || (!part.startsWith('..') && !isAbsolute(part));
};
// Resolve the existing prefix without creating a destination. Private-path
// comparisons must agree when an instance is reached through a system alias.
function physical(path: string): string {
  let parent = resolve(path);
  const suffix: string[] = [];
  for (;;) {
    try { return resolve(realpathSync(parent), ...suffix); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT' || dirname(parent) === parent) throw error;
      suffix.unshift(basename(parent));
      parent = dirname(parent);
    }
  }
}
export function assertExportDirectory(paths: InstancePaths, output: string): void {
  const destination = resolve(output);
  const physicalDestination = physical(destination);
  const instanceRoots = [paths.configDir, paths.dataDir, paths.stateDir, paths.cacheDir].map(path => resolve(path));
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
    contains(physicalDestination, physical(paths.dataDir)) ||
    contains(physicalDestination, physical(paths.configDir)) ||
    privateTrees.some((root) => {
      const canonical = physical(root);
      return contains(canonical, physicalDestination) || contains(physicalDestination, canonical);
    })
  )
    throw new FdgError('UNSAFE_PATH', 'Export directory overlaps private instance data');
  let parent = parse(destination).root;
  for (const part of relative(parent, destination).split(/[\\/]/)) {
    parent = join(parent, part);
    let linked = false;
    try { linked = lstatSync(parent).isSymbolicLink(); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    // macOS /var and /tmp aliases (and explicitly selected instance aliases)
    // precede the instance itself. Links introduced below that base stay unsafe.
    const instanceAncestor = instanceRoots.some(root => root !== parent && contains(parent, root));
    if (linked && !instanceAncestor)
      throw new FdgError('UNSAFE_PATH', 'Export directory traverses a symbolic link');
  }
}
