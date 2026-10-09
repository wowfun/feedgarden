import { writeFile, mkdir } from 'node:fs/promises';
import { loadConfig } from '../src/config.js';
import { collect } from '../src/collect.js';
import { Store } from '../src/store.js';
const config = loadConfig();
const root = '.local/notes/1009/collection-' + Date.now();
await mkdir(root, {recursive:true,mode:0o700});
config.storage.directory = root; config.storage.database = root + '/data.sqlite';
const store = new Store(config.storage.database);
const results: unknown[] = [];
try {
  for (const source of config.sources.filter(source => source.enabled && (process.argv.length > 2 ? process.argv.slice(2).includes(source.id) : source.id !== 'openai'))) {
    console.log('Collecting ' + source.id);
    const result = await collect(config, store, source.id);
    results.push(...result); console.log(JSON.stringify(result));
    await writeFile('.local/notes/1009/validation/live-collect.json', JSON.stringify(results, null, 2));
  }
} finally { store.close(); }
