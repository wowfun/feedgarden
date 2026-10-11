import { readFile } from 'node:fs/promises';
async function readSkill(path: string): Promise<string> {
  try { return await readFile(path, 'utf8'); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new Error('MANUAL_ACTION: Restore the required report skill from this repository: ' + path); throw error; }
}
export async function reportSkill(sources: Iterable<string>): Promise<string> {
  const base = await readSkill('.agents/skills/feedgarden-report/SKILL.md');
  return new Set(sources).has('hackernews') ? base + '\n\n' + await readSkill('.agents/skills/feedgarden-report/hackernews.md') : base;
}
