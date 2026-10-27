import { parseArgs } from 'node:util';
import { loadConfig } from '../src/config.js';
import { fetchClippings } from '../src/fetch-clippings.js';
import { errorText } from '../src/util.js';

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    all: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, config: { type: 'string' },
    'max-mib': { type: 'string' }, help: { type: 'boolean', short: 'h' },
  } });
  if (values.help || !values.all && !positionals.length) {
    console.log('Usage: npm run fetch:clippings -- FILE_OR_DIRECTORY... | --all\nOptions: --config FILE --dry-run --max-mib 32\nExplicit paths must select Markdown outside clippings/assets/. --all skips attachments.\n--dry-run lists external image references without checking cached assets.\nManually host Markdown images in Clippings; never opens the database.');
  } else {
    if (values.all && positionals.length) throw new Error('Use --all or explicit paths, not both');
    const mib = values['max-mib'] === undefined ? 32 : Number(values['max-mib']);
    if (!Number.isFinite(mib) || mib <= 0 || !Number.isSafeInteger(mib * 1024 * 1024)) throw new Error('--max-mib must be a positive size in MiB');
    const cancellation = new AbortController();
    const abort = () => cancellation.abort(new Error('Image fetch interrupted; rerun to resume'));
    process.once('SIGINT', abort); process.once('SIGTERM', abort);
    try {
      const results = await fetchClippings(loadConfig(values.config), { paths: positionals, all: values.all, dryRun: values['dry-run'], maxBytes: mib * 1024 * 1024, signal: cancellation.signal });
      for (const result of results) {
        console.log(`${result.status}: ${result.path}`);
        if (values['dry-run']) for (const url of result.urls) console.log('  ' + url);
        if (result.error) console.error(result.error);
      }
      if (results.some(result => result.status === 'failed')) process.exitCode = 1;
    } finally { process.removeListener('SIGINT', abort); process.removeListener('SIGTERM', abort); }
  }
} catch (error) { console.error(errorText(error)); process.exitCode = 1; }
