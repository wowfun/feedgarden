import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { FdgError } from '../contracts/errors.js';
import { stopAgentProcess } from './process/lifecycle.js';
export type GitTransport = (args: string[], cwd: string, signal?: AbortSignal) => string | Promise<string>;
/** Keep heartbeats and cooperative cancellation live during Git/network work. */
export async function git(args: string[], cwd: string, signal?: AbortSignal): Promise<string> {
  signal?.throwIfAborted();
  return new Promise((done, fail) => {
    const child = spawn(
      'git',
      [
        '-c',
        'core.hooksPath=' + join(cwd, '.git', 'fdg-disabled-hooks'),
        '-c',
        'commit.gpgsign=false',
        ...args,
      ],
      {
        cwd,
        windowsHide: true,
        detached: process.platform !== 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: '0',
          GCM_INTERACTIVE: 'never',
          GIT_EDITOR: 'false',
          GIT_CONFIG_COUNT: '0',
        },
      },
    );
    let output = '',
      errorText = '',
      failure: unknown;
    const stop = () => stopAgentProcess(child),
      timeout = setTimeout(() => {
        failure = new FdgError('GIT_TIMEOUT', 'Git request timed out');
        stop();
      }, 120000);
    const aborted = () => {
      failure = signal?.reason;
      stop();
    };
    signal?.addEventListener('abort', aborted, { once: true });
    const clean = () => {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', aborted);
    };
    child.stdout.on('data', (data) => {
      output += data.toString();
      if (Buffer.byteLength(output) > 32_000_000) {
        failure = new FdgError('GIT_OUTPUT_LIMIT', 'Git response exceeded the output limit');
        stop();
      }
    });
    child.stderr.on('data', (data) => {
      errorText = (errorText + data.toString()).slice(-32000);
      process.stderr.write(data);
    });
    child.once('error', (error) => {
      clean();
      fail(error);
    });
    child.once('close', (code) => {
      clean();
      if (failure) fail(failure);
      else if (code === 0) done(output.trim());
      else
        fail(
          new FdgError('GIT_FAILED', 'Git command failed', undefined, { exitCode: code, text: errorText }),
        );
    });
  });
}
