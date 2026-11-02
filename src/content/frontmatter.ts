import { parse } from 'yaml';

export interface Frontmatter { fields: Record<string, unknown>; end: number }

/** Absent frontmatter is ordinary prose. Malformed frontmatter is an error
 * for publication, while callers inspecting historical content can skip it. */
export function parseFrontmatter(markdown: string): Frontmatter | undefined {
  if (!/^---\r?\n/.test(markdown)) return;
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(markdown);
  if (!match) throw new Error('Unterminated frontmatter');
  const fields = parse(match[1]!);
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new Error('Frontmatter must be an object');
  return { fields, end: match[0].length };
}
