import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from 'jsonc-parser';
import lockfile from 'proper-lockfile';
import { loadConfig } from './config.js';
import { Store } from './store.js';
import { collect, type CollectionResult } from './collect.js';
import { summarize } from './items.js';
import { writeSite, recoverContent } from './site.js';
import { applyTopics } from './topics.js';
import { migrate, rollback, convertConfig } from './migrate.js';
import { backup } from './backup.js';
import { atomicWrite, errorText } from './util.js';

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  config: { type: 'string' }, source: { type: 'string' }, since: { type: 'string' },
  due: { type: 'boolean' }, rebuild: { type: 'boolean' }, 'remote-base': { type: 'string' }, 'retry-failed': { type: 'boolean' }, live: { type: 'boolean' }, 'no-publish': { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
} });
const command = positionals[0];
if (values.help || !command) console.log('Feedgarden: migrate | rollback ARCHIVE | collect [--since ISO] | summarize [--source ID] [--rebuild] [--retry-failed] | topics apply FILE | run --due | doctor [--live] | render | backup | publish\nOptions: --config FILE --no-publish');
else {
  const configFile = values.config ?? 'feedgarden.jsonc';
  const config = command === 'migrate' || command === 'rollback' ? convertConfig(parse(await readFile(configFile, 'utf8'))) : loadConfig(values.config);
  await mkdir(config.storage.directory, { recursive: true, mode: 0o700 });
  const target = resolve(config.storage.directory, 'runner');
  await writeFile(target, '', { flag: 'a', mode: 0o600 });
  const release = await lockfile.lock(target, { stale: 120_000, update: 10_000, retries: 0 });
  const owner = randomUUID();
  let store: Store | undefined, run: number | undefined, heartbeat: NodeJS.Timeout | undefined;
  const failures: { kind: string; key: string; error: string }[] = [];
  const recordCollection = (results: CollectionResult[]) => {
    console.log(JSON.stringify(results, null, 2));
    for (const result of results) if (result.status === 'unavailable') failures.push({ kind: 'collection', key: `${result.source}/${result.stream}`, error: 'All enabled channels unavailable; see channel_state and gaps' });
  };
  try {
    if (command === 'migrate') console.log('Migration archive: ' + await migrate(configFile));
    else if (command === 'rollback') { if (!positionals[1]) throw new Error('rollback requires an archive path'); await rollback(positionals[1]); }
    else {
      store = new Store(config.storage.database); store.acquireLease(owner);
      heartbeat = setInterval(() => store!.renewLease(owner), 30_000); heartbeat.unref();
      run = store.run(command); await recoverContent(config);
      async function summaries() {
        const result = await summarize(config, store!, { source: values.source, rebuild: values.rebuild, retryFailed: values['retry-failed'] });
        console.log(JSON.stringify(result));
        const errors = store!.db.prepare("SELECT source,id,error FROM feed_jobs WHERE error IS NOT NULL AND state!='ready'").all() as { source: string; id: string; error: string }[];
        const selected = new Set(config.sources.filter(source => source.enabled && (!values.source || source.id === values.source)).map(source => source.id));
        for (const error of errors.filter(error => selected.has(error.source))) failures.push({ kind: 'summary', key: error.source + '/' + error.id, error: error.error });
      }
      if (command === 'collect') recordCollection(await collect(config, store, values.source, values.due, undefined, values.since));
      else if (command === 'summarize') { await summaries(); await writeSite(config, store); }
      else if (command === 'render') await writeSite(config, store);
      else if (command === 'topics') { if (positionals[1] !== 'apply' || !positionals[2]) throw new Error('topics apply requires a JSON registry file');
        if (values['remote-base'] && execFileSync('git', ['rev-parse', 'FETCH_HEAD'], {encoding:'utf8'}).trim() !== values['remote-base']) throw new Error('Remote base must equal the fetched remote commit');
        await applyTopics(config.feed.topics, JSON.parse(await readFile(positionals[2], 'utf8'))); if (values['remote-base']) {
        if (!/^[a-f0-9]{40}$/.test(values['remote-base'])) throw new Error('Remote base requires a full commit SHA');
        const { remoteTopics } = await import('./publish.js');
        await atomicWrite(resolve(config.storage.directory, 'topic-remote-base.json'), JSON.stringify({ commit: values['remote-base'], registry: remoteTopics(values['remote-base']) }));
      } await writeSite(config, store); }
      else if (command === 'backup') console.log(JSON.stringify(await backup(store, config.storage.directory)));
      else if (command === 'doctor') {
        const executable = config.agent.command === 'dsh' ? resolve('node_modules/.bin/dsh') : config.agent.command;
        console.log(JSON.stringify({ node: process.version, database: store.db.pragma('quick_check'), agent: execFileSync(executable, ['--version'], { encoding: 'utf8' }).trim(), model: config.agent.model, channels: store.states(), items: store.db.prepare('SELECT count(*) n FROM feed_summaries').get(), queue: store.db.prepare('SELECT state,count(*) n FROM feed_jobs GROUP BY state').all() }, null, 2));
        if (values.live) recordCollection(await collect(config, store, values.source));
      } else if (command === 'run') {
        if (!values.due) throw new Error('Scheduled runs require --due');
        recordCollection(await collect(config, store, values.source, true)); await summaries();
        await writeSite(config, store); await backup(store, config.storage.directory);
        if (config.publish.auto && !values['no-publish']) { const { publish } = await import('./publish.js'); await publish(config, store); }
      } else if (command === 'publish') { const { publish } = await import('./publish.js'); await publish(config, store); }
      else throw new Error('Unknown command: ' + command);
      store.finishRun(run, failures.length ? 'partial' : 'succeeded', { failures });
      if (failures.length) { console.error(`Run incomplete: ${failures.length} task(s) failed; successful work retained.`); process.exitCode = 1; }
    }
  } catch (error) {
    if (run) store?.finishRun(run, 'failed', { error: errorText(error) });
    console.error(errorText(error)); process.exitCode = 1;
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    store?.releaseLease(owner); store?.close(); await release();
  }
}
