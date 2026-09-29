import { mkdir, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { configSchema } from '../src/config.js';
await mkdir('schemas', { recursive: true });
await writeFile('schemas/feedgarden.schema.json', JSON.stringify(z.toJSONSchema(configSchema, { io: 'input' }), null, 2) + '\n');
