import { mkdir,writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { collect } from '../src/content/index.js';
import { configuration,createInstanceContext,instancePaths } from '../src/instance/index.js';
import { errorText } from '../src/platform/errors.js';
import { adapters } from '../src/sources/index.js';
import { openDatabase } from '../src/storage/index.js';
import { developmentConfig } from './development-config.js';
import { validationDirectory as resolveValidationDirectory } from './validation-paths.js';
async function main(): Promise<void> {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { config: { type: 'string' }, help: { type: 'boolean', short: 'h' } } });
  if (values.help) { console.log('Usage: npm run verify:collect -- [--config FILE] [SOURCE ...]\nWithout sources, checks enabled sources except OpenAI in an isolated database.'); return; }
  const config = developmentConfig(values.config);
  const validationDirectory = resolveValidationDirectory(config);
  // Reuse the selected installation; only collected evidence belongs to the fixture.
  const twitterEnvironment = config.paths.twitterEnvironment;
  const channels = { ...adapters, 'x-cli': (context: Parameters<typeof adapters['x-cli']>[0]) => adapters['x-cli']({ ...context, twitterEnvironment }) };
  const sources = config.sources.filter(source => source.enabled);
  for (const id of positionals) if (!sources.some(source => source.id === id)) throw new Error('Unknown or disabled source: ' + id);
  const root = join(validationDirectory, 'collection-' + Date.now());
  await mkdir(root, {recursive:true,mode:0o700});
  const isolated = createInstanceContext({...configuration(config),storage:{dataDir:root}},instancePaths({workspace:root,dataDir:root}));
  const store = openDatabase(isolated.paths.database);
  const results: unknown[] = [];
  try {
    for (const source of sources.filter(source => positionals.length ? positionals.includes(source.id) : source.id !== 'openai')) {
      console.log('Collecting ' + source.id);
      const result = await collect(isolated, store, source.id, false, channels);
      results.push(...result); console.log(JSON.stringify(result));
      await writeFile(join(validationDirectory, 'live-collect.json'), JSON.stringify(results, null, 2));
    }
  } finally { store.close(); }
}
await main().catch(error => { console.error(errorText(error)); process.exitCode = 1; });
