import { readFile } from 'node:fs/promises';
import { FdgError } from '../contracts/errors.js';
/** Parse data, never shell syntax. Explicit process environment takes precedence. */
export async function loadEnvironment(file: string): Promise<void> {
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!match) throw new FdgError('CONFIG_INVALID', 'runner.env requires KEY=value lines');
    const key = match[1]!,
      value = match[2]!;
    if (process.env[key] === undefined)
      process.env[key] = value.startsWith('"')
        ? JSON.parse(value)
        : value.startsWith("'") && value.endsWith("'")
          ? value.slice(1, -1)
          : value;
  }
}
