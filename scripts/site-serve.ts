import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { parse } from 'yaml';

const config = parse(await readFile('.github/jekyll-obsidian.yml', 'utf8')) as { baseurl?: string };
const base = (config.baseurl ?? '').replace(/\/$/, '');
const root = resolve('.jekyll-obsidian-cache/site');
await stat(join(root, 'index.html')).catch(() => { throw new Error('Run npm run site:build before starting the preview.'); });
const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.md': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url!, 'http://localhost').pathname);
    if (pathname === '/' && base) { response.writeHead(302, { Location: base + '/' }).end(); return; }
    if (!pathname.startsWith(base + '/')) { response.writeHead(404).end(); return; }
    let path = resolve(root, '.' + pathname.slice(base.length));
    if (path !== root && !path.startsWith(root + sep)) { response.writeHead(404).end(); return; }
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    response.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(await readFile(path));
  } catch { if (!response.headersSent) response.writeHead(404); response.end(); }
});
server.listen(4174, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:4174${base}/`));
