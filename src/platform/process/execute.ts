import { spawn } from 'node:child_process';
import { processCommand } from './command.js';
import { stopAgentProcess } from './lifecycle.js';
export async function run(program: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = process.env, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  await new Promise<void>((done, fail) => {
    const [executable, argv] = processCommand(program, args, env);
    const child = spawn(executable, argv, { cwd, env: { ...env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' }, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const abort = () => stopAgentProcess(child), timeout = setTimeout(abort, 600000);
    signal?.addEventListener('abort', abort, { once: true });
    const clean = () => { clearTimeout(timeout); signal?.removeEventListener('abort', abort); };
    child.stdout.pipe(process.stderr, { end: false }); child.stderr.pipe(process.stderr, { end: false });
    child.on('error', error => { clean(); fail(error); }); child.on('close', code => { clean(); if (signal?.aborted) fail(signal.reason); else code === 0 ? done() : fail(new Error(program + ' exited with ' + code)); });
  });
}
export function validationEnvironment(inherited: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' };
  for (const name of ['PATH', 'HOME', 'USERPROFILE', 'HOMEDRIVE', 'HOMEPATH', 'APPDATA', 'LOCALAPPDATA', 'PATHEXT', 'COMSPEC', 'LANG', 'LC_ALL', 'TZ', 'TMPDIR', 'TEMP', 'TMP', 'SystemRoot', 'WINDIR']) if (inherited[name]) env[name] = inherited[name];
  return env;
}
