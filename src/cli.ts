import { agentRuntime, storagePaths } from './storage-paths.js';
import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { runnerLock } from './runner-lock.js';
import { loadConfig, resolveConfigFile, type Config } from './config.js';
import { Store } from './store.js';
import { collect, type CollectionResult } from './collect.js';
import { summarize } from './items.js';
import { writeSite, recoverContent } from './site.js';
import { applyTopics } from './topics.js';
import { backup } from './backup.js';
import { atomicWrite, errorText } from './util.js';
import { reportSkill } from './report-skill.js';
import { createAgentResolver } from './agent.js';
import { rankItems, previewRank } from './rank.js';
import { importArchives, maintainArchive } from './archives.js';
import { relate } from './relations.js';
import { resolveItemWindow } from './item-window.js';

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  config: { type: 'string' }, source: { type: 'string' }, since: { type: 'string' }, until: { type: 'string' }, 'observed-days': { type: 'string' },
  due: { type: 'boolean' }, rebuild: { type: 'boolean' }, refresh: { type: 'boolean' }, history: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, 'remote-base': { type: 'string' }, 'retry-failed': { type: 'boolean' }, live: { type: 'boolean' }, 'no-publish': { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
} });
const command = positionals[0];
const windowOptions = { since: values.since, until: values.until, observedDays: values['observed-days'] === undefined ? undefined : Number(values['observed-days']) };
if (values.help || !command) console.log('Feedgarden: collect [--since ISO] | rank [--history] [--source ID] [--dry-run] | archives update|remove PATH | summarize [--source ID] [--refresh] [--rebuild] [--retry-failed] | relate [--retry-failed] | topics apply FILE | run --due | doctor [--live] | render | backup | publish\nOptions: --config FILE --no-publish\nrun/summarize: --since ISO [--until ISO] [--observed-days N] (exclusive until; observed days use first observation)');
else if (!['collect', 'rank', 'archives', 'summarize', 'relate', 'topics', 'run', 'doctor', 'render', 'backup', 'publish'].includes(command)) {
  console.error('Unknown command: ' + command); process.exitCode = 1;
}
else {
  const configFile = resolveConfigFile(values.config);
  const config = loadConfig(configFile);
  try {
    if ((values.until !== undefined || values['observed-days'] !== undefined) && !['run', 'summarize'].includes(command)) throw new Error('--until and --observed-days are supported only by run and summarize');
    if (['run', 'summarize'].includes(command)) {
      // Preflight without opening storage; summarize later applies its durable cutoff.
      resolveItemWindow(windowOptions, '1970-01-01T00:00:00.000Z', new Date().toISOString());
      if (values.source && !config.sources.some(source => source.enabled && source.id === values.source)) throw new Error('Unknown or disabled source: ' + values.source);
    }
    if (values['dry-run'] && command !== 'rank') throw new Error('--dry-run is supported only by rank');
    if (command === 'rank' && values['dry-run']) {
      const reports = await previewRank(config, { source: values.source, history: values.history });
      console.log(JSON.stringify(reports, null, 2));
      if (reports.some(report => report.status === 'deferred')) process.exitCode = 1;
    } else await runWithRunner(command, config);
  } catch (error) { console.error(errorText(error)); process.exitCode = 1; }
}

async function runWithRunner(command: string, config: Config): Promise<void> {
  const cancellation = new AbortController(), signal = cancellation.signal;
  const agentResolver = createAgentResolver();
  const release = await runnerLock(storagePaths(config.storage).runner, cancellation);
  const owner = randomUUID();
  let store: Store | undefined, run: number | undefined, heartbeat: NodeJS.Timeout | undefined;
  const failures: { kind: string; key: string; error: string }[] = [];
  const collections: CollectionResult[] = [];
  let summary: Awaited<ReturnType<typeof summarize>> | undefined;
  let publishedBefore = 0;
  const report = () => ({ failures, ...(collections.length ? { collections } : {}), ...(summary && store ? { summary: { ...summary, newPublications: (store.statement('SELECT COUNT(*) n FROM feed_publications').get() as { n: number }).n - publishedBefore } } : {}) });
  const recordCollection = (results: CollectionResult[]) => {
    collections.push(...results);
    console.log(JSON.stringify(results, null, 2));
    for (const result of results) if (result.status === 'unavailable') failures.push({ kind: 'collection', key: `${result.source}/${result.stream}`, error: 'All enabled channels unavailable; see channel_state and gaps' });
  };
  try {
    store = new Store(storagePaths(config.storage).database); store.acquireLease(owner);
    heartbeat = store.watchLease(owner, cancellation);
    if (command === 'summarize' || command === 'run') resolveItemWindow(windowOptions, store.meta('cutoff')!, new Date().toISOString());
    run = store.run(command); await recoverContent(config, store);
    // Adoption/import describes previously installed output, not new publications.
    if (command === 'summarize' || (command === 'run' && values.due)) await importArchives(config, store, signal);
    publishedBefore = (store.statement('SELECT COUNT(*) n FROM feed_publications').get() as { n: number }).n;
    async function summaries() {
      const result = await summarize(config, store!, { source: values.source, ...windowOptions, rebuild: values.rebuild, refresh: values.refresh, retryFailed: values['retry-failed'], signal, resolveAgent: agentResolver });
      summary = result;
      for (const error of result.sourceErrors) failures.push({ kind: 'summary-config', key: error.source, error: error.error });
      for (const error of result.jobErrors) failures.push({ kind: 'summary', key: error.source + '/' + error.id, error: error.error });
    }
    async function relations() {
      const result = await relate(config, store!, { signal, retryFailed: values['retry-failed'], resolveAgent: agentResolver });
      console.log(JSON.stringify({ relations: result }));
      if (result.configurationError) failures.push({ kind: 'relations', key: 'config', error: result.configurationError });
      else if (result.pending && !result.deferred) failures.push({ kind: 'relations', key: 'recent', error: `${result.pending} pairs remain pending; inspect feed_tasks for retry details` });
    }
    if (command === 'collect') recordCollection(await collect(config, store, values.source, values.due, undefined, values.since, signal));
    else if (command === 'rank') {
      const reports = await rankItems(config, store, { source: values.source, history: values.history, signal });
      console.log(JSON.stringify(reports, null, 2));
      for (const report of reports.filter(report => report.status === 'deferred')) failures.push({ kind: 'ranking', key: report.source + '/' + report.day, error: report.notes.join('; ') });
      await writeSite(config, store, signal);
    }
    else if (command === 'summarize') { await summaries(); await writeSite(config, store, signal); }
    else if (command === 'relate') {
      await writeSite(config, store, signal);
      await relations();
      await writeSite(config, store, signal);
    }
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
        await atomicWrite(storagePaths(config.storage).topicRemoteBase, JSON.stringify({ commit: values['remote-base'], registry: remoteTopics(values['remote-base']) }));
      }
      await writeSite(config, store, signal);
    }
    else if (command === 'backup') console.log(JSON.stringify(await backup(store, storagePaths(config.storage).backups)));
    else if (command === 'doctor') {
      await reportSkill(config.sources.filter(source => source.enabled).map(source => source.id));
      const resolved = await agentResolver(agentRuntime(config), signal);
      console.log(JSON.stringify({ node: process.version, database: store.db.pragma('quick_check'), agent: resolved.execution, channels: store.states(), tasks: store.db.prepare("SELECT kind,state,count(*) n FROM feed_tasks GROUP BY kind,state").all(), items: store.db.prepare('SELECT count(*) n FROM feed_summaries').get(), queue: store.db.prepare('SELECT state,count(*) n FROM feed_jobs GROUP BY state').all() }, null, 2));
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
      await writeSite(config, store, signal);
      await relations();
      await writeSite(config, store, signal); await backup(store, storagePaths(config.storage).backups);
      signal.throwIfAborted();
      if (config.publish.auto && !values['no-publish']) { const { publish } = await import('./publish.js'); await publish(config, store, undefined, signal); }
    } else if (command === 'publish') { const { publish } = await import('./publish.js'); await publish(config, store, undefined, signal); }
    signal.throwIfAborted();
    const details = report();
    if (details.summary) console.log(JSON.stringify(details.summary));
    store.finishRun(run, failures.length ? 'partial' : 'succeeded', details);
    if (failures.length) { console.error(`Run incomplete: ${failures.length} task(s) failed; successful work retained.`); process.exitCode = 1; }
  } catch (error) {
    if (summary) console.log(JSON.stringify(report().summary));
    if (run) store?.finishRun(run, 'failed', { error: errorText(error), ...report() });
    throw error;
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    store?.releaseLease(owner); store?.close();
    await release();
  }
}
