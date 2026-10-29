import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { PublicTarget } from './destination.js';

// Some public RSS endpoints accept the system HTTP stack but reject Node's TLS
// stack. Keep this explicit, with the same honest identity and request limits.
export const curlFetch: typeof fetch = (url, init) => request(String(url), init);

/** DNS validation is owned by Http; this adapter pins one hop and never follows redirects. */
export function publicCurlFetch(target: PublicTarget, init: RequestInit): Promise<Response> {
  const url = new URL(target.url), port = url.port || (url.protocol === 'https:' ? '443' : '80');
  const proxy = (url.protocol === 'https:' ? process.env.https_proxy ?? process.env.HTTPS_PROXY : process.env.http_proxy ?? process.env.HTTP_PROXY) ?? process.env.all_proxy ?? process.env.ALL_PROXY ?? '';
  const noProxy = process.env.no_proxy ?? process.env.NO_PROXY ?? '';
  if (proxy && noProxy !== '*' && !['http:', 'https:'].includes(new URL(proxy).protocol))
    throw new Error('Public curl requests require an HTTP(S) proxy for destination pinning');
  const address = target.address.includes(':') ? '[' + target.address + ']' : target.address;
  return request(target.url, { ...init, redirect: 'manual' }, [
    '--connect-to', `${url.hostname}:${port}:${address}:${port}`, '--proxytunnel',
    '--proxy', noProxy === '*' ? '' : proxy, '--noproxy', noProxy,
  ]);
}

async function request(url: string, init?: RequestInit, connection: string[] = []): Promise<Response> {
  const directory = await mkdtemp(join(tmpdir(), 'feedgarden-http-'));
  try {
    const headerPath = join(directory, 'headers');
    const args = ['--disable', '--globoff', '--silent', '--show-error', '--proto', '=http,https', '--proto-redir', '=http,https', '--connect-timeout', '10', '--max-time', '25', '--max-filesize', '12000000', '--dump-header', headerPath, ...connection];
    if (init?.redirect !== 'manual') args.push('--location', '--max-redirs', '3');
    for (const [name, value] of new Headers(init?.headers)) args.push('--header', name + ': ' + value);
    args.push('--url', String(url));
    const { stdout } = await promisify(execFile)('curl', args, { signal: init?.signal ?? undefined, maxBuffer: 12_000_000, encoding: 'buffer', windowsHide: true });
    const blocks = (await readFile(headerPath, 'utf8')).trim().split(/\r?\n\r?\n/);
    const lines = blocks.at(-1)!.split(/\r?\n/), status = Number(lines.shift()!.split(' ')[1]);
    const headers = new Headers();
    for (const line of lines) {
      const colon = line.indexOf(':'); if (colon > 0) headers.append(line.slice(0, colon), line.slice(colon + 1).trim());
    }
    return new Response([204, 205, 304].includes(status) ? null : new Uint8Array(stdout), { status, headers });
  } finally { await rm(directory, { recursive: true, force: true }); }
}
