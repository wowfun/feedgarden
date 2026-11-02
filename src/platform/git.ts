import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { FdgError } from '../contracts/errors.js';
import { resolvePublicTarget } from './http/destination.js';
import { stopAgentProcess } from './process/lifecycle.js';
export type GitTransport = (args: string[], cwd: string, signal?: AbortSignal) => string | Promise<string>;

/** Refresh the worktree's HTTPS address pin before network synchronization. */
export async function configureGitDns(repository: string, cwd: string, signal?: AbortSignal): Promise<void> {
  if (!process.env.FEEDGARDEN_DNS_OVER_HTTPS || !/^https?:\/\//i.test(repository)) return;
  const url = new URL(repository), target = await resolvePublicTarget(url.origin);
  signal?.throwIfAborted();
  const address = target.address.includes(':') ? '[' + target.address + ']' : target.address;
  // Git only pins this origin. Redirects to another host/port use Git's normal
  // DNS/proxy route; this is not the HTTP collector's per-redirect validation.
  await git(['config', 'http.curloptResolve', url.hostname + ':' + (url.port || (url.protocol === 'https:' ? '443' : '80')) + ':' + address], cwd, signal);
}

/** Keep heartbeats and cooperative cancellation live during Git/network work. */
interface GitOptions { indexFile?: string; input?: string; raw?: boolean; outputLimit?: number }
export async function git(args: string[], cwd: string, signal?: AbortSignal, options: GitOptions = {}): Promise<string> {
  const output = (await gitBytes(args, cwd, signal, options)).toString('utf8');
  return options.raw || args.includes('-z') || args.includes('--null') ? output : output.trim();
}
export async function gitBytes(args: string[], cwd: string, signal?: AbortSignal, options: GitOptions = {}): Promise<Buffer> {
  return runGit(args, cwd, signal, options);
}

/** Stream NUL-delimited Git records without buffering a repository's entire history. */
export async function gitRecords(args: string[], cwd: string, record: (value: string) => void, signal?: AbortSignal): Promise<void> {
  let tail = Buffer.alloc(0);
  await runGit(args, cwd, signal, {}, chunk => {
    const data = tail.length ? Buffer.concat([tail, chunk]) : chunk;
    let start = 0, end;
    while ((end = data.indexOf(0, start)) !== -1) {
      record(data.toString('utf8', start, end));
      start = end + 1;
    }
    tail = Buffer.from(data.subarray(start));
    if (tail.length > 1_048_576) throw new Error('Invalid oversized Git record');
  });
  if (tail.length) throw new Error('Unterminated Git record');
}

async function runGit(args: string[], cwd: string, signal: AbortSignal | undefined, options: GitOptions, consume?: (chunk: Buffer) => void): Promise<Buffer> {
  signal?.throwIfAborted();
  const inherited = { ...process.env };
  // The caller selected this repository explicitly. Ambient Git discovery or
  // index variables must not redirect writes to a different checkout.
  for (const name of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_NAMESPACE']) delete inherited[name];
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
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...inherited,
          GIT_TERMINAL_PROMPT: '0',
          GCM_INTERACTIVE: 'never',
          GIT_EDITOR: 'false',
          GIT_CONFIG_COUNT: '0',
          GIT_LITERAL_PATHSPECS: '1',
          ...(options.indexFile ? { GIT_INDEX_FILE: options.indexFile } : {}),
        },
      },
    );
    child.stdin.on('error', () => {});
    child.stdin.end(options.input);
    const chunks: Buffer[] = [];
    let size = 0,
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
      if (failure) return;
      if (consume) {
        try { consume(data); } catch (error) { failure = error; stop(); }
        return;
      }
      size += data.length;
      if (size > (options.outputLimit ?? 128_000_000)) {
        failure = new FdgError('GIT_OUTPUT_LIMIT', 'Git response exceeded the output limit');
        stop();
      } else chunks.push(data);
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
      else if (code === 0) done(Buffer.concat(chunks));
      else
        fail(
          new FdgError('GIT_FAILED', 'Git command failed', undefined, { exitCode: code, text: errorText }),
        );
    });
  });
}

/** Read raw objects in byte-bounded batches, independent of checkout filters.
 * A single large blob gets its own exact-size allowance rather than failing an
 * arbitrary aggregate command cap. No object identities are persisted. */
export async function* gitBlobs(oids: readonly string[], cwd: string, signal?: AbortSignal): AsyncGenerator<{ oid: string; body: Buffer }> {
  const unique = [...new Set(oids)], budget = 8_000_000;
  type ObjectInfo = { oid: string; size: number; header: string };
  async function* readBatch(batch: ObjectInfo[], bytes: number) {
    const data = await gitBytes(['cat-file', '--batch'], cwd, signal, { input: batch.map(row => row.oid).join('\n') + '\n', outputLimit: bytes });
    let cursor = 0;
    for (const row of batch) {
      const end = data.indexOf(10, cursor), start = end + 1, next = start + row.size;
      if (end < 0 || data.subarray(cursor, end).toString() !== row.header || data[next] !== 10)
        throw new Error('Invalid Git blob response: ' + row.oid);
      yield { oid: row.oid, body: data.subarray(start, next) };
      cursor = next + 1;
    }
    if (cursor !== data.length) throw new Error('Unexpected data after Git blobs');
  }
  for (let offset = 0; offset < unique.length; offset += 128) {
    const ids = unique.slice(offset, offset + 128);
    const headers = (await git(['cat-file', '--batch-check'], cwd, signal, { input: ids.join('\n') + '\n' })).split('\n');
    let batch: ObjectInfo[] = [], bytes = 0;
    for (let index = 0; index < ids.length; index++) {
      const header = headers[index]!, match = /^([a-f0-9]+) blob (\d+)$/.exec(header), size = Number(match?.[2]);
      if (match?.[1] !== ids[index] || !Number.isSafeInteger(size) || size < 0)
        throw new Error('Invalid Git blob size: ' + ids[index]);
      const framedSize = size + Buffer.byteLength(header) + 2;
      if (batch.length && bytes + framedSize > budget) { yield* readBatch(batch, bytes); batch = []; bytes = 0; }
      batch.push({ oid: ids[index]!, size, header }); bytes += framedSize;
    }
    if (batch.length) yield* readBatch(batch, bytes);
  }
}
