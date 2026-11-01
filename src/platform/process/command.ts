import { existsSync, readFileSync, statSync } from 'node:fs';
import { delimiter, dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Use interpreter entrypoints for package-manager shims on Windows, without a shell. */
export function processCommand(program: string, args: string[], env = process.env): [string, string[]] {
  if (process.platform !== 'win32' || !['npm', 'pnpm', 'bundle'].includes(program)) return [program, args];
  if (program === 'pnpm') {
    const found = windowsCommand(program, env);
    if (found) {
      try { return agentCommand(found, args, env); }
      catch (error) {
        // npm-generated cmd shims dispatch through %_prog%. Read the installed
        // package's bin declaration for both global and project-local layouts.
        for (const manifest of [resolve(dirname(found), 'node_modules/pnpm/package.json'), resolve(dirname(found), '../pnpm/package.json')]) {
          if (!existsSync(manifest)) continue;
          let metadata;
          try { metadata = JSON.parse(readFileSync(manifest, 'utf8')); }
          catch { continue; }
          const bin = metadata?.name === 'pnpm' && metadata.bin?.pnpm;
          if (typeof bin !== 'string') continue;
          const entry = resolve(dirname(manifest), bin);
          if (/\.[cm]?js$/i.test(entry) && existsSync(entry)) return [process.execPath, [entry, ...args]];
        }
        throw error;
      }
    }
    throw new Error('MANUAL_ACTION: Cannot locate pnpm on PATH. Install the packageManager version from package.json and reopen the terminal');
  }
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

export function agentCommand(program: string, args: string[], env = process.env): [string, string[]] {
  if (/\.[cm]?js$/i.test(program)) return [process.execPath, [resolve(program), ...args]];
  if (program === 'dsh') {
    // Resolving from this module also works after entering an isolated task directory.
    let directory = dirname(fileURLToPath(import.meta.url));
    while (true) {
      const entry = join(directory, 'node_modules/@deepseek-ai/dsh/lib/bin.js');
      if (existsSync(entry)) return [process.execPath, [entry, ...args]];
      const parent = dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  }
  if (process.platform === 'win32') {
    const explicit = isAbsolute(program) || /[\\/]/.test(program);
    const found = windowsCommand(program, env);
    if (found) {
      if (extname(found).toLowerCase() === '.exe') return [found, args];
      // Read literal package-manager targets rather than executing shell syntax
      // or assuming an npm/pnpm installation layout. Fixed extra args and opaque
      // launchers need an explicitly configured executable/JavaScript entrypoint.
      if (statSync(found).size <= 65536) {
        const shim = readFileSync(found, 'utf8');
        const targets = [...shim.matchAll(/"([^"\r\n]+\.(?:exe|[cm]?js))"\s*(?:%\*|\$args)(?=\s|$)/gi)].map(match => {
          const target = match[1]!;
          const before = shim.slice(shim.lastIndexOf('\n', match.index!) + 1, match.index).trim().replace(/^@/, '').replace(/^(?:\$input\s*\|\s*)?&\s*|^call\s+/i, '').trim();
          const nodePrefix = /^(?:"(?:[^"\r\n]*[\\/]|%~dp0|%dp0%)?node(?:\.exe|\$exe)?"|node(?:\.exe)?)$/i;
          if (/\bNODE_OPTIONS\s*=/i.test(shim) || before && !(/\.[cm]?js$/i.test(target) && nodePrefix.test(before))) return undefined;
          if (/^(?:%~dp0|%dp0%|\$basedir[\\/])/i.test(target)) return resolve(dirname(found), target.replace(/^(?:%~dp0|%dp0%|\$basedir)[\\/]*/i, ''));
          return isAbsolute(target) && !/[%$]/.test(target) ? resolve(target) : undefined;
        });
        const unique = [...new Set(targets)];
        if (unique.length === 1 && unique[0] && existsSync(unique[0])) {
          return /\.[cm]?js$/i.test(unique[0]) ? [process.execPath, [unique[0], ...args]] : [unique[0], args];
        }
      }
      throw new Error('MANUAL_ACTION: Cannot resolve a literal executable or JavaScript entrypoint from agent shim; configure its entrypoint directly: ' + found);
    }
    if (explicit) throw new Error('MANUAL_ACTION: Agent executable does not exist: ' + program);
  }
  return [program, args];
}

function windowsCommand(program: string, env: NodeJS.ProcessEnv): string | undefined {
  const paths = (env.PATH ?? env.Path ?? '').split(delimiter).map(value => value.replace(/^"|"$/g, ''));
  const explicit = isAbsolute(program) || /[\\/]/.test(program);
  const candidates = explicit ? [resolve(program)] : paths.flatMap(path => ['', '.exe', '.cmd', '.bat', '.ps1'].map(extension => join(path, program + extension)));
  return candidates.find(path => existsSync(path) && /\.(exe|cmd|bat|ps1)$/i.test(path));
}

export function pythonExecutable(environment: string, name = 'python'): string {
  return resolve(environment, process.platform === 'win32' ? 'Scripts' : 'bin', name + (process.platform === 'win32' ? '.exe' : ''));
}
