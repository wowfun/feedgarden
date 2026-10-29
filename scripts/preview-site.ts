import { readFile,stat } from 'node:fs/promises';
import { join,resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { parse } from 'yaml';
import { staticServer } from './static-server.js';

const { values } = parseArgs({ options: { root: { type: 'string' }, baseurl: { type: 'string' }, port: { type: 'string' } } });
const config = values.baseurl === undefined ? parse(await readFile('.github/jekyll-obsidian.yml', 'utf8')) as { baseurl?: string } : {};
const base = (values.baseurl ?? config.baseurl ?? '').replace(/\/$/, '');
const root = resolve(values.root ?? '.jekyll-obsidian-cache/site');
await stat(join(root, 'index.html')).catch(() => { throw new Error('Run npm run dev:site:build before starting the preview.'); });
const server = staticServer(root, base);
const portText = values.port ?? '58002', port = Number(portText);
if (!/^\d+$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('--port must be an integer from 1 to 65535');
server.listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}${base}/`));
