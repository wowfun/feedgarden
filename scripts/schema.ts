import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { configSchema } from '../src/contracts/configuration.js';
const path = new URL('../resources/schemas/feedgarden.v3.json', import.meta.url);
const generated = JSON.stringify(z.toJSONSchema(configSchema, { io: 'input' }), null, 2) + '\n';
if (process.argv.includes('--check')) {
  if ((await readFile(path, 'utf8')).replaceAll('\r\n', '\n') !== generated) throw new Error('Packaged schema is stale; run npm run schema');
} else {
  await mkdir(new URL('../resources/schemas/', import.meta.url), { recursive: true });
  await writeFile(path, generated);
}
