import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import lockfile from 'proper-lockfile';
import { loadConfig, readConfig, resolveConfigFile, type Config } from './config.js';
import { Store } from './store.js';
import { collect, type CollectionResult } from './collect.js';
import { summarize } from './items.js';
import { writeSite, recoverContent } from './site.js';
import { applyTopics } from './topics.js';
import { migrate, rollback, convertConfig } from './migrate.js';
import { backup } from './backup.js';
import { atomicWrite, errorText } from './util.js';
import { reportSkill } from './report-skill.js';
import { agentCommand } from './process-command.js';
import { rankItems, previewRank } from './rank.js';
import { maintainArchive } from './archives.js';

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  config: { type: 'string' }, source: { type: 'string' }, since: { type: 'string' },
  due: { type: 'boolean' }, rebuild: { type: 'boolean' }, refresh: { type: 'boolean' }, history: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, 'remote-base': { type: 'string' }, 'retry-failed': { type: 'boolean' }, live: { type: 'boolean' }, 'no-publish': { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
} });
const command = positionals[0];
if (values.help || !command) console.log('Feedgarden: migrate | rollback ARCHIVE | collect [--since ISO] | rank [--history] [--source ID] [--dry-run] | archives update|remove PATH | summarize [--source ID] [--refresh] [--rebuild] [--retry-failed] | topics apply FILE | run --due | doctor [--live] | render | backup | publish\nOptions: --config FILE --no-publish');
else {
  const configFile = resolveConfigFile(values.config);
  const config = command === 'migrate' || command === 'rollback' ? convertConfig(readConfig(configFile)) : loadConfig(configFile);
  try {
    if (values['dry-run'] && command !== 'rank') throw new Error('--dry-run is supported only by rank');
    if (command === 'rank' && values['dry-run']) {
      const reports = await previewRank(config, { source: values.source, history: values.history });
      console.log(JSON.stringify(reports, null, 2));
      if (reports.some(report => report.status === 'deferred')) process.exitCode = 1;
    } else await runWithRunner(command, config, configFile);
  } catch (error) { console.error(errorText(error)); process.exitCode = 1; }
}

async function runWithRunner(command: string, config: Config, configFile: string): Promise<void> {
  await mkdir(config.storage.directory, { recursive: true, mode: 0o700 });
  const target = resolve(config.storage.directory, 'runner');
  await writeFile(target, '', { flag: 'a', mode: 0o600 });
  const cancellation = new AbortController(), signal = cancellation.signal;
  let lockCompromised = false;
  const release = await lockfile.lock(target, { stale: 120_000, update: 10_000, retries: 0, onCompromised: error => { lockCompromised = true; cancellation.abort(error); } });
  const owner = randomUUID();
  let store: Store | undefined, run: number | undefined, heartbeat: NodeJS.Timeout | undefined;
  const failures: { kind: string; key: string; error: string }[] = [];
  const recordCollection = (results: CollectionResult[]) => {
    console.log(JSON.stringify(results, null, 2));
    for (const result of results) if (result.status === 'unavailable') failures.push({ kind: 'collection', key: `${result.source}/${result.stream}`, error: 'All enabled channels unavailable; see channel_state and gaps' });
  };
  try {
    if (command === 'migrate') console.log('Migration archive: ' + await migrate(configFile, undefined, signal));
    else if (command === 'rollback') { if (!positionals[1]) throw new Error('rollback requires an archive path'); await rollback(positionals[1], signal); }
    else {
      store = new Store(config.storage.database); store.acquireLease(owner);
      heartbeat = store.watchLease(owner, cancellation);
      run = store.run(command); await recoverContent(config);
      async function summaries() {
        const result = await summarize(config, store!, { source: values.source, since: values.since, rebuild: values.rebuild, refresh: values.refresh, retryFailed: values['retry-failed'], signal });
        console.log(JSON.stringify(result));
        const errors = store!.db.prepare("SELECT source,id,error FROM feed_jobs WHERE error IS NOT NULL AND state!='ready'").all() as { source: string; id: string; error: string }[];
        const selected = new Set(config.sources.filter(source => source.enabled && (!values.source || source.id === values.source)).map(source => source.id));
        for (const error of errors.filter(error => selected.has(error.source) && store!.isSelected(error.source, error.id))) failures.push({ kind: 'summary', key: error.source + '/' + error.id, error: error.error });
      }
      if (command === 'collect') recordCollection(await collect(config, store, values.source, values.due, undefined, values.since, signal));
      else if (command === 'rank') {
        const reports = await rankItems(config, store, { source: values.source, history: values.history, signal });
        console.log(JSON.stringify(reports, null, 2));
        for (const report of reports.filter(report => report.status === 'deferred')) failures.push({ kind: 'ranking', key: report.source + '/' + report.day, error: report.notes.join('; ') });
        await writeSite(config, store, signal);
      }
      else if (command === 'summarize') { await summaries(); await writeSite(config, store, signal); }
      else if (command === 'archives') {
        const action = positionals[1], path = positionals[2];
        if ((action !== 'update' && action !== 'remove') || !path) throw new Error('archives requires update|remove PATH relative to the content directory');
        console.log('Archive maintenance backup: ' + await maintainArchive(config, store, action, path, signal));
        await writeSite(config, store, signal, true);
      }
      else if (command === 'render') await writeSite(config, store, signal, true);
      else if (command === 'topics') { if (positionals[1] !== 'apply' || !positionals[2]) throw new Error('topics apply requires a JSON registry file');
        if (values['remote-base']) {
          if (!/^[a-f0-9]{40}$/.test(values['remote-base'])) throw new Error('Remote base requires a full commit SHA');
          if (execFileSync('git', ['rev-parse', 'FETCH_HEAD'], {encoding:'utf8'}).trim() !== values['remote-base']) throw new Error('Remote base must equal the fetched remote commit');
        }
        await applyTopics(config.feed.topics, JSON.parse(await readFile(positionals[2], 'utf8')), undefined, signal);
        if (values['remote-base']) {
          const { remoteTopics } = await import('./publish.js');
          await atomicWrite(resolve(config.storage.directory, 'topic-remote-base.json'), JSON.stringify({ commit: values['remote-base'], registry: remoteTopics(values['remote-base']) }));
        }
        await writeSite(config, store, signal);
      }
      else if (command === 'backup') console.log(JSON.stringify(await backup(store, config.storage.directory)));
      else if (command === 'doctor') {
        await reportSkill(config.sources.filter(source => source.enabled).map(source => source.id));
        const [executable, args] = agentCommand(config.agent.command, ['--version']);
        console.log(JSON.stringify({ node: process.version, database: store.db.pragma('quick_check'), agent: execFileSync(executable, args, { encoding: 'utf8' }).trim(), model: config.agent.model, channels: store.states(), tasks: store.db.prepare("SELECT kind,state,count(*) n FROM feed_tasks GROUP BY kind,state").all(), items: store.db.prepare('SELECT count(*) n FROM feed_summaries').get(), queue: store.db.prepare('SELECT state,count(*) n FROM feed_jobs GROUP BY state').all() }, null, 2));
        if (values.live) recordCollection(await collect(config, store, values.source, false, undefined, undefined, signal));
      } else if (command === 'run') {
        if (!values.due) throw new Error('Scheduled runs require --due');
        recordCollection(await collect(config, store, values.source, true, undefined, values.since, signal));
        if (config.sources.some(source => source.enabled && source.selection && (!values.source || source.id === values.source))) {
          const reports = await rankItems(config, store, { source: values.source, signal });
          console.log(JSON.stringify(reports, null, 2));
          for (const report of reports.filter(report => report.status === 'deferred')) failures.push({ kind: 'ranking', key: report.source + '/' + report.day, error: report.notes.join('; ') });
        }
        await summaries();
        await writeSite(config, store, signal); await backup(store, config.storage.directory);
        signal.throwIfAborted();
        if (config.publish.auto && !values['no-publish']) { const { publish } = await import('./publish.js'); await publish(config, store, undefined, signal); }
      } else if (command === 'publish') { const { publish } = await import('./publish.js'); await publish(config, store, undefined, signal); }
      else throw new Error('Unknown command: ' + command);
      signal.throwIfAborted();
      store.finishRun(run, failures.length ? 'partial' : 'succeeded', { failures });
      if (failures.length) { console.error(`Run incomplete: ${failures.length} task(s) failed; successful work retained.`); process.exitCode = 1; }
    }
  } catch (error) {
    if (run) store?.finishRun(run, 'failed', { error: errorText(error) });
    throw error;
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    store?.releaseLease(owner); store?.close();
    try { await release(); }
    catch (error) { if (!lockCompromised || (error as NodeJS.ErrnoException).code !== 'ERELEASED') throw error; }
  }
}
