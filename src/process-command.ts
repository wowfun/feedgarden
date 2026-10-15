import { existsSync } from 'node:fs';
import { delimiter, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Use interpreter entrypoints for package-manager shims on Windows, without a shell. */
export function processCommand(program: string, args: string[], env = process.env): [string, string[]] {
  if (process.platform !== 'win32' || !['npm', 'bundle'].includes(program)) return [program, args];
  const directories = (env.PATH ?? env.Path ?? '').split(delimiter).map(value => value.replace(/^"|"$/g, ''));
  if (program === 'npm') {
    const directory = directories.find(path => existsSync(join(path, 'node_modules/npm/bin/npm-cli.js')));
    if (directory) return [process.execPath, [join(directory, 'node_modules/npm/bin/npm-cli.js'), ...args]];
  } else {
    const directory = directories.find(path => existsSync(join(path, 'bundle')) && existsSync(join(path, 'ruby.exe')));
    if (directory) return [join(directory, 'ruby.exe'), [join(directory, 'bundle'), ...args]];
  }
  throw new Error(`MANUAL_ACTION: Cannot locate ${program === 'npm' ? 'npm/bin/npm-cli.js' : 'Bundler with ruby.exe'} on PATH. Check the active ${program === 'npm' ? 'Node.js/npm' : 'Ruby/Bundler'} installation and reopen the terminal`);
}

export function agentCommand(program: string, args: string[]): [string, string[]] {
  if (process.platform === 'win32' && /\.[cm]?js$/i.test(program)) return [process.execPath, [resolve(program), ...args]];
  if (program === 'dsh') {
    // Resolving from this module also works after entering an isolated task directory.
    const entry = fileURLToPath(new URL('../node_modules/@deepseek-ai/dsh/lib/bin.js', import.meta.url));
    if (existsSync(entry)) return [process.execPath, [entry, ...args]];
  }
  return [program, args];
}

export function pythonExecutable(environment: string, name = 'python'): string {
  return resolve(environment, process.platform === 'win32' ? 'Scripts' : 'bin', name + (process.platform === 'win32' ? '.exe' : ''));
}
