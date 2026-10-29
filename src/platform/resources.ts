import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
let root = dirname(fileURLToPath(import.meta.url));
while (!existsSync(join(root, 'package.json'))) {
  const parent = dirname(root);
  if (parent === root) throw new Error('Cannot locate installed Feedgarden package');
  root = parent;
}
export const packageRoot = root;
export const packageVersion: string = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
export const resource = (...parts: string[]): string => join(root, 'resources', ...parts);
