import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Some public RSS endpoints accept the system HTTP stack but reject Node's TLS
// stack. Keep this explicit, with the same honest identity and request limits.
export const curlFetch: typeof fetch = async (url, init) => {
  const directory = await mkdtemp(join(tmpdir(), 'feedgarden-http-'));
  try {
    const headerPath = join(directory, 'headers');
    const args = ['--silent', '--show-error', '--location', '--max-redirs', '3', '--connect-timeout', '10', '--max-time', '25', '--max-filesize', '12000000', '--dump-header', headerPath];
    for (const [name, value] of new Headers(init?.headers)) args.push('--header', name + ': ' + value);
    args.push('--url', String(url));
    const { stdout } = await promisify(execFile)('curl', args, { signal: init?.signal ?? undefined, maxBuffer: 12_000_000, encoding: 'buffer' });
    const blocks = (await readFile(headerPath, 'utf8')).trim().split(/\r?\n\r?\n/);
    const lines = blocks.at(-1)!.split(/\r?\n/), status = Number(lines.shift()!.split(' ')[1]);
    const headers = new Headers();
    for (const line of lines) {
      const colon = line.indexOf(':'); if (colon > 0) headers.append(line.slice(0, colon), line.slice(colon + 1).trim());
    }
    return new Response([204, 205, 304].includes(status) ? null : new Uint8Array(stdout), { status, headers });
  } finally { await rm(directory, { recursive: true, force: true }); }
};
