import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import lockfile from 'proper-lockfile';
import { loadConfig } from './config.js';
import { Store } from './store.js';
import { collect, type CollectionResult } from './collect.js';
import { generateReport } from './reports.js';
import { duePeriods, periodFor, reportKey } from './period.js';
import { writeSite } from './site.js';
import { backup } from './backup.js';
import { errorText, nowIso } from './util.js';

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  config: { type: 'string' }, source: { type: 'string' }, frequency: { type: 'string' }, date: { type: 'string' }, since: { type: 'string' },
  due: { type: 'boolean' }, rebuild: { type: 'boolean' }, live: { type: 'boolean' }, 'no-publish': { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
} });
const command = positionals[0];
if (values.help || !command) {
  console.log('Feedgarden: collect [--since YYYY-MM-DD] | report --source ID --frequency daily|weekly --date YYYY-MM-DD | run --due | doctor [--live] | render | backup | publish\nOptions: --config FILE --source ID --rebuild --no-publish');
} else {
  const config = loadConfig(values.config);
  await mkdir(config.storage.directory, { recursive: true, mode: 0o700 });
  const target = resolve(config.storage.directory, 'runner');
  await writeFile(target, '', { flag: 'a', mode: 0o600 });
  const release = await lockfile.lock(target, { stale: 120_000, update: 10_000, retries: 0 });
  const owner = randomUUID();
  let store: Store | undefined;
  let run: number | undefined;
  let heartbeat: NodeJS.Timeout | undefined;
  const failures: { kind: 'collection' | 'report'; key: string; error: string }[] = [];
  const recordCollection = (results: CollectionResult[]) => {
    console.log(JSON.stringify(results, null, 2));
    for (const result of results) if (result.status === 'unavailable') {
      failures.push({ kind: 'collection', key: `${result.source}/${result.stream}`, error: 'All enabled channels unavailable; see channel_state and gaps for details' });
    }
  };
  try {
    store = new Store(config.storage.database);
    store.acquireLease(owner);
    heartbeat = setInterval(() => store!.renewLease(owner), 30_000); heartbeat.unref();
    run = store.run(command);
    if (command === 'collect') recordCollection(await collect(config, store, values.source, values.due, undefined, values.since));
    else if (command === 'report') {
      const source = config.sources.find(source => source.id === values.source && source.enabled);
      if (!source || !values.date || !['daily', 'weekly'].includes(values.frequency ?? '')) throw new Error('report requires an enabled --source, --frequency daily|weekly and --date');
      const frequency = values.frequency as 'daily' | 'weekly';
      if (!source.frequencies.includes(frequency)) throw new Error('Frequency is not enabled for this source');
      console.log(await generateReport(config, source, periodFor(source, frequency, values.date, config.reports.sealHours), store, values.rebuild));
      await writeSite(config, store);
    } else if (command === 'render') await writeSite(config, store);
    else if (command === 'backup') console.log(JSON.stringify(await backup(store, config.storage.directory)));
    else if (command === 'doctor') {
      const executable = config.agent.command === 'dsh' ? resolve('node_modules/.bin/dsh') : config.agent.command;
      console.log(JSON.stringify({ node: process.version, database: store.db.pragma('quick_check'), agent: execFileSync(executable, ['--version'], { encoding: 'utf8' }).trim(), model: config.agent.model, channels: store.states(), reports: store.reports().length }, null, 2));
      if (values.live) recordCollection(await collect(config, store, values.source));
    } else if (command === 'run') {
      if (!values.due) throw new Error('Scheduled runs require --due');
      recordCollection(await collect(config, store, values.source, true));
      const at = nowIso();
      for (const source of config.sources.filter(source => source.enabled && (!values.source || source.id === values.source))) {
        const queued = store.reports().filter(report => report.state !== 'sealed' && report.snapshot.period.source === source.id && source.frequencies.includes(report.snapshot.period.frequency)).map(report => report.snapshot.period);
        const periods = new Map([...queued, ...duePeriods(source, at, config.reports.backfillDays, config.reports.sealHours)].map(period => [reportKey(period), period]));
        for (const period of [...periods.values()].filter(period => period.due <= at).sort((a, b) => a.due.localeCompare(b.due))) {
          try { console.log(JSON.stringify({ source: source.id, date: period.date, frequency: period.frequency, result: await generateReport(config, source, period, store) })); }
          catch (error) {
            if (errorText(error).includes('MANUAL_ACTION:')) throw error;
            failures.push({ kind: 'report', key: reportKey(period), error: errorText(error) });
            console.error(errorText(error));
          }
        }
      }
      await writeSite(config, store); await backup(store, config.storage.directory);
      if (config.publish.auto && !values['no-publish']) { const { publish } = await import('./publish.js'); await publish(config); }
    } else if (command === 'publish') { const { publish } = await import('./publish.js'); await publish(config); }
    else throw new Error('Unknown command: ' + command);
    store.finishRun(run, failures.length ? 'partial' : 'succeeded', { failures });
    if (failures.length) { console.error(`Run incomplete: ${failures.length} collection/report task(s) failed; successful work was retained.`); process.exitCode = 1; }
  } catch (error) {
    if (run) store?.finishRun(run, 'failed', { error: errorText(error) });
    console.error(errorText(error)); process.exitCode = 1;
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    store?.releaseLease(owner); store?.close(); await release();
  }
}
