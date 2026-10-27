import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.apng': 'image/apng', '.bmp': 'image/bmp',
  '.md': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};

// Shared by local previews and browser validation; callers own listening/closing.
export function staticServer(directory: string, baseurl = '') {
  const root = resolve(directory), base = baseurl.replace(/\/$/, '');
  if (base && (!base.startsWith('/') || base.startsWith('//') || /[?#]/.test(base))) throw new Error('baseurl must be a root-relative path');
  return createServer(async (request, response) => {
    let sitePath: string | undefined;
    try {
      const pathname = decodeURIComponent(new URL(request.url!, 'http://localhost').pathname);
      if (pathname === '/' && base) { response.writeHead(302, { Location: base + '/' }).end(); return; }
      if (!pathname.startsWith(base + '/')) { response.writeHead(404).end(); return; }
      let path = resolve(root, '.' + pathname.slice(base.length));
      if (path !== root && !path.startsWith(root + sep)) { response.writeHead(404).end(); return; }
      // Derive fallback locations from the checked path, after decoding and normalization.
      sitePath = relative(root, path);
      if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
      const bytes = await readFile(path);
      response.writeHead(200, { 'Content-Type': types[extname(path).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(bytes);
    } catch (error) {
      if (response.headersSent) { response.end(); return; }
      let body: Buffer | undefined;
      if (sitePath !== undefined && ['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) {
        const first = sitePath.split(sep)[0];
        const candidates = first ? [join(root, first, '404.html'), join(root, '404.html')] : [join(root, '404.html')];
        for (const candidate of candidates) {
          body = await readFile(candidate).catch(() => undefined);
          if (body) break;
        }
      }
      response.writeHead(404, body ? { 'Content-Type': types['.html']!, 'Cache-Control': 'no-store' } : {});
      response.end(body);
    }
  });
}
