import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { taskSchemas } from './task-contract.mjs';

export type ReportTask = keyof typeof taskSchemas;
let root = dirname(fileURLToPath(import.meta.url));
while (!existsSync(join(root, 'package.json'))) {
  const parent = dirname(root);
  if (parent === root) throw new Error('MANUAL_ACTION: Cannot locate the Feedgarden package containing its trusted skills');
  root = parent;
}
const directory = join(root, '.agents/skills/feedgarden-report');
const skills = new Map<string, Promise<string>>();
async function readSkill(path: string): Promise<string> {
  let pending = skills.get(path);
  if (!pending) {
    pending = readFile(join(directory, path), 'utf8').catch(error => {
      skills.delete(path);
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new Error('MANUAL_ACTION: Restore the required report skill from this repository: ' + join(directory, path));
      throw error;
    });
    skills.set(path, pending);
  }
  return pending;
}
export async function reportSkill(sources: Iterable<string>): Promise<string> {
  const base = await readSkill('SKILL.md');
  return new Set(sources).has('hackernews') ? base + '\n\n' + await readSkill('hackernews.md') : base;
}
export async function reportTaskSkill(task: ReportTask): Promise<string> {
  if (task !== 'transcript' && task !== 'relations') throw new Error('Unknown fixed report task');
  return readSkill(task + '.md');
}
