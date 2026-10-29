import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { budgetReport } from '../agent/index.js';
import { loadTopics } from '../content/index.js';
import { sourceSchema, targetSchema } from '../contracts/configuration.js';
import { FdgError, issue } from '../contracts/errors.js';
import { exitCodes } from '../contracts/outcomes.js';
import type { InstanceContext } from '../instance/index.js';
import { instancePaths, loadEnvironment, loadInstance, readConfig } from '../instance/index.js';
import { packageVersion } from '../platform/resources.js';
import { holdArtifact } from '../platform/retention.js';
import { cancel, createRun, detach, executeRun, invocation, preparedRuntime, prepareSchedule, status } from '../runs/index.js';
import { listItems, openInstance } from '../storage/index.js';
import { globalOptions, help } from './commands.js';
import { editConfig, setup, upgrade } from './instance-lifecycle.js';
import { serializeResult } from './output.js';
import { commandHint, parseCommand, validateCommand, type StringOption } from './request.js';
import { installSkill, skillStatus } from './skill.js';
import { Diagnostics } from './diagnostics.js';

const originalStdout = process.stdout.write.bind(process.stdout);
// Operation services and subprocess adapters use stderr for all incidental logs.
const originalLog = console.log;
console.log = (...args: unknown[]) => console.error(...args);
let logFile: string | undefined;
const stderr = process.stderr.write.bind(process.stderr);
const diagnostics = new Diagnostics(stderr, () => logFile);
process.stderr.write = diagnostics.write.bind(diagnostics) as typeof process.stderr.write;
let command = commandHint(process.argv.slice(2)),
  config: InstanceContext | undefined,
  runId: string | null = null,
  state = 'completed',
  result: unknown = null,
  issues: ReturnType<typeof issue>[] = [],
  nextActions: unknown[] = [];
let textOutput = false,
  exitCode = 0;
const entry = resolve(process.argv[1]!);
const execute: import('../runs/index.js').Executor = async (...args) =>
  (await import('./operations.js')).execute(...args);
try {
  const request = parseCommand(process.argv.slice(2)), { options, positionals } = request;
  textOutput = !!options.text;
  command = positionals[0] ?? 'help';
  const select = request.selection;
  const str = (key: StringOption) => (typeof options[key] === 'string' ? (options[key] as string) : undefined);
  const number = (key: StringOption) => (options[key] === undefined ? undefined : Number(options[key]));
  const action = positionals[1],
    arg = positionals[2];
  if (command === 'help' || options.help) {
    const path = command === 'help' ? positionals.slice(1).join(' ') : positionals.slice(0, 2).join(' ');
    const document = help(path);
    if (!document.commands.length) throw new FdgError('BAD_INPUT', 'Unknown help path');
    originalStdout(
      options.json
        ? JSON.stringify(document) + '\n'
        : document.commands
          .map(
            (c) =>
              c.usage.trimEnd() +
              '\n  ' +
              c.summary +
              '\n  Options: ' +
              [...globalOptions, ...c.options].map((o) => '--' + o).join(' '),
          )
          .join('\n\n') + '\n',
    );
    process.exit(0);
  }
  const known = validateCommand(request);
  if (command === 'version')
    result = { package: 'feedgarden', packageVersion, schemaVersion: 1, node: process.version };
  else if (command === 'setup')
    result = await setup(select, { timezone: str('timezone'), model: str('model') });
  else if (command === 'instance' && action === 'paths') {
    const paths = instancePaths(select);
    const raw = existsSync(paths.configFile)
      ? (readConfig(paths.configFile) as { instanceId?: string; storage?: { dataDir?: string } })
      : undefined;
    result = { ...(raw?.storage ? instancePaths(select, raw.storage) : paths), instanceId: raw?.instanceId ?? null };
  } else if (command === 'instance' && action === 'upgrade')
    result = await upgrade(select, { dryRun: !!options['dry-run'], legacyBase: str('legacy-base') });
  else if (command === 'channels') {
    const { channelDescriptions } = await import('../sources/index.js');
    const descriptions = await channelDescriptions();
    result = positionals[1]
      ? (descriptions.find((c) => c.id === positionals[1]) ??
        (() => {
          throw new FdgError('BAD_INPUT', 'Unknown channel');
        })())
      : descriptions;
  } else if (command === 'skill' && action === 'status') result = await skillStatus(arg!);
  else {
    const loaded = loadInstance(select);
    config = loaded.config;
    const paths = config.paths,
      instance = { instanceId: config.instanceId, ...loaded.paths };
    if (
      [
        'collect',
        'process',
        'sync',
        'relate',
        'channel',
        'check',
        'read',
        '_worker',
        '_scheduled',
        'resume',
      ].includes(command)
    )
      await loadEnvironment(paths.runnerEnvironment);
    if (
      !select.workspace &&
      !select.config &&
      (existsSync(resolve('feedgarden.jsonc')) || existsSync(resolve('feedgarden.json')))
    )
      issues.push({
        code: 'INSTANCE_NOT_SELECTED',
        message:
          'Current directory has a configuration; using the standard user instance explicitly shown in this result',
      });
    if (command === '_scheduled') {
      const { scheduledScope } = await import('../runs/index.js');
      const schedule = scheduledScope(config, action!, arg!);
      if (schedule.skip) result = { skipped: schedule };
      else {
        const created = await createRun(
          config,
          { source: action, scheduledKey: schedule.key, ...(config.targets.length ? { publish: true } : {}) },
          ['process'],
        );
        runId = created.id;
        const outcome = await executeRun(config, created.id, created.token, execute);
        ({ state, result } = outcome);
        issues.push(...outcome.issues);
        exitCode = exitCodes[outcome.state];
      }
    } else if (command === 'doctor') {
      const store = openInstance(config, true);
      try {
        result = {
          instance,
          node: process.version,
          database: store.quickCheck(),
          collectionStart: store.meta('cutoff'),
          channels: store.states(),
          budgets: budgetReport(config, store),
        };
      } finally {
        store.close();
      }
    } else if (command === 'rank' && options['dry-run']) {
      const { previewRank } = await import('../content/index.js');
      result = await previewRank(config, { source: str('source'), history: !!options.history });
    } else if (command === 'status') {
      const seconds = number('wait-seconds');
      if (seconds !== undefined && (!Number.isFinite(seconds) || seconds < 0 || seconds > 60))
        throw new FdgError('BAD_INPUT', '--wait-seconds must be 0–60');
      result = await status(config, action, {
        latest: !!options.latest,
        unfinished: !!options.unfinished,
        waitSeconds: seconds,
      });
    } else if (command === 'cancel') {
      if (!action) throw new FdgError('BAD_INPUT', 'cancel requires RUN_ID');
      result = await cancel(config, action);
    } else if (command === 'items') {
      const store = openInstance(config, true);
      try {
        if (action === 'read') {
          if (!arg || !positionals[3]) throw new FdgError('BAD_INPUT', 'items read SOURCE ID');
          const row = store.sources.findItem(arg, positionals[3]);
          if (!row) throw new FdgError('ITEM_NOT_FOUND', 'Unknown item');
          result = { evidence: { trust: 'untrusted', ...JSON.parse(row.data) } };
        } else
          result = listItems(store, {
            query: action === 'search' ? arg : undefined,
            source: str('source'),
            limit: number('limit'),
            cursor: str('cursor'),
          });
      } finally {
        store.close();
      }
    } else if (command === 'read' || (command === 'channel' && arg !== 'setup') || command === 'check') {
      const { queryChannel, readUrl } = await import('../sources/index.js');
      const { saveItems } = await import('../content/index.js');
      if (command === 'check') {
        const ids = action ? [action] : config.sources.filter((s) => s.enabled).map((s) => s.id),
          checks = [];
        for (const id of ids)
          try {
            const r = await queryChannel(config, id, 'list', { limit: 1 });
            checks.push({ channel: id, available: true, coverage: r.coverage });
          } catch (error) {
            checks.push({ channel: id, available: false, issue: issue(error) });
          }
        result = { checks };
        if (checks.some((c) => !c.available)) {
          state = 'failed';
          exitCode = 1;
        }
      } else {
        const response =
          command === 'read'
            ? await readUrl(config, action!)
            : await queryChannel(config, action!, arg!, {
              query: str('query'),
              url: str('url'),
              subscription: str('subscription'),
              limit: number('limit'),
            });
        result = {
          coverage: response.coverage,
          items: response.items.map((item) => ({
            source: item.source,
            id: item.id,
            evidence: { trust: 'untrusted', ...item },
          })),
          ...(options.save ? { saved: await saveItems(config, response.items) } : {}),
        };
      }
    } else if (command === 'subscriptions') {
      const { channels, templates } = await import('../sources/index.js');
      if (action === 'list')
        result = {
          subscriptions: config.sources.flatMap((s) =>
            s.streams.map((stream) => ({
              channel: s.id,
              id: s.id + '/' + stream.id,
              enabled: s.enabled && stream.enabled,
              routes: stream.routes,
            })),
          ),
        };
      else {
        const raw = readConfig(paths.configFile) as any,
          sources: InstanceContext['sources'] = raw.sources;
        if (action === 'add') {
          const id = str('channel') ?? arg,
            template = (await templates()).find((s) => s.id === id);
          if (!id) throw new FdgError('BAD_INPUT', 'subscriptions add requires CHANNEL or --channel');
          const subscription = positionals[3] ?? (str('url') ? (str('name') ?? 'feed') : undefined);
          if (!channels.some((channel) => channel.id === id))
            throw new FdgError('BAD_INPUT', 'Unknown channel');
          if (id === 'rss' && !str('url')) throw new FdgError('BAD_INPUT', 'RSS subscriptions require --url');
          const source =
            template ??
            sourceSchema.parse({
              id,
              name: id,
              intervalHours: 6,
              streams: [
                { id: subscription ?? 'feed', routes: [{ id: 'rss', kind: 'feed', url: str('url') }] },
              ],
            });
          if (id === 'reddit' && subscription)
            for (const stream of source.streams)
              for (const route of stream.routes)
                if (route.url)
                  route.url = route.url.replace(
                    /\/r\/[^/]+\//,
                    '/r/' + encodeURIComponent(subscription) + '/',
                  );
          const existing = sources.find((s) => s.id === id);
          if (existing) {
            if (!subscription || existing.streams.some((s) => s.id === subscription))
              throw new FdgError('BAD_INPUT', 'Choose a new subscription ID after the channel ID');
            existing.streams.push({
              id: subscription,
              enabled: true,
              routes: str('url')
                ? [{ ...source.streams[0]!.routes[0]!, kind: 'feed', url: str('url') }]
                : source.streams[0]!.routes,
            });
          } else {
            if (subscription)
              source.streams = [
                {
                  ...source.streams[0]!,
                  id: subscription,
                  ...(str('url')
                    ? { routes: [{ ...source.streams[0]!.routes[0]!, kind: 'feed', url: str('url') }] }
                    : {}),
                },
              ];
            sources.push(sourceSchema.parse(source));
          }
        } else {
          const [channelId, subscription] = arg?.split('/') ?? [],
            index = sources.findIndex((s) => s.id === channelId);
          if (index < 0) throw new FdgError('BAD_INPUT', 'Unknown subscription/channel');
          const source = sources[index]!,
            stream = subscription ? source.streams.find((s) => s.id === subscription) : undefined;
          if (subscription && !stream) throw new FdgError('BAD_INPUT', 'Unknown subscription');
          if (action === 'remove') {
            if (stream && source.streams.length > 1)
              source.streams = source.streams.filter((s) => s !== stream);
            else sources.splice(index, 1);
          } else if (action === 'enable' || action === 'disable') {
            if (stream) stream.enabled = action === 'enable';
            else source.enabled = action === 'enable';
          } else throw new FdgError('BAD_INPUT', 'Unknown subscriptions action');
        }
        await editConfig(paths.configFile, ['sources'], sources);
        result = { updated: true, historyRetained: true };
      }
    } else if (command === 'targets' && action !== 'adopt') {
      const { inspectTarget } = await import('../publishing/index.js');
      const { targetFor } = await import('../publishing/index.js');
      if (action === 'list') result = config.targets;
      else if (action === 'inspect') result = await inspectTarget(config, targetFor(config, arg));
      else if (action === 'add') {
        const target = targetSchema.parse({
          id: arg,
          repository: str('repository'),
          branch: str('branch'),
          format: str('format'),
          managedPrefix: str('prefix') ?? (str('format') === 'jekyll' ? 'content' : 'feed'),
          auxiliaryFiles: str('format') === 'jekyll' ? ['config/topics.json'] : [],
        });
        await editConfig(paths.configFile, ['targets'], [...config.targets, target]);
        result = target;
      } else throw new FdgError('BAD_INPUT', 'Unknown targets action');
    } else if (command === 'topics' && action === 'list') result = await loadTopics(config.feed.topics);
    else if (command === 'skill' && action === 'install') result = await installSkill(config, arg!);
    else if (command === 'schedule' && action === 'prepare')
      result = await prepareSchedule(
        config,
        str('platform') ??
        { win32: 'windows', darwin: 'launchd' }[process.platform as 'win32' | 'darwin'] ??
        'systemd',
        str('output'),
      );
    else if (command === 'ui' && action === 'clippings' && options['dry-run']) {
      const { targetFor } = await import('../publishing/index.js');
      const target = targetFor(config, str('target'));
      const { fetchClippings } = await import('../ui/index.js');
      result = await fetchClippings(
        {
          ...config,
          feed: { ...config.feed, directory: target.output ?? join(paths.dataDir, 'exports', target.id) },
        },
        {
          paths: positionals.slice(3),
          all: !!options.all,
          dryRun: true,
          maxBytes: (number('max-mib') ?? 32) * 1024 * 1024,
        },
      );
    } else {
      if (command === 'resume') {
        if (!action) throw new FdgError('BAD_INPUT', 'resume requires RUN_ID');
        runId = action;
        if (options.detach) {
          const store = openInstance(config, true);
          try {
            const row = store.runs.token(runId);
            if (!row) throw new FdgError('RUN_NOT_FOUND', 'Unknown run ID');
            result = await detach(config, runId, row.token, true);
            state = 'queued';
          } finally {
            store.close();
          }
        } else {
          const outcome = await executeRun(config, runId, undefined, execute, true);
          ({ state, result } = outcome);
          issues.push(...outcome.issues);
          exitCode = exitCodes[outcome.state];
        }
      } else if (command === '_worker') {
        if (!action || !arg) throw new FdgError('BAD_INPUT', 'Invalid worker launch');
        runId = action;
        const outcome = await executeRun(config, action, arg, execute, positionals[3] === 'resume');
        ({ state, result } = outcome);
        issues.push(...outcome.issues);
        exitCode = exitCodes[outcome.state];
      } else {
        if (!known || !('detach' in known)) throw new FdgError('BAD_INPUT', 'Unknown operation');
        const created = await createRun(config, options, positionals);
        runId = created.id;
        logFile = join(paths.state, 'runs', runId + '.log');
        if (options.detach) {
          result = await detach(config, created.id, created.token);
          state = 'queued';
        } else {
          const outcome = await executeRun(config, created.id, created.token, execute);
          ({ state, result } = outcome);
          issues.push(...outcome.issues);
          exitCode = exitCodes[outcome.state];
        }
      }
      if (runId) {
        // Reuse an already prepared worker runtime, otherwise this invocation.
        // Hints never materialize a runtime or affect the operation's outcome.
        const runtime = await preparedRuntime(config)?.catch(() => undefined);
        const nextArgv = (args: string[]) => runtime ? invocation(config!, runtime.entry, args) : [...process.execArgv, ...invocation(config!, entry, args)];
        nextActions = [
          {
            executable: process.execPath,
            argv: nextArgv(['status', runId]),
            requiresUser: false,
          },
        ];
        if (['partial', 'deferred', 'failed', 'interrupted'].includes(state))
          nextActions.push({
            executable: process.execPath,
            argv: nextArgv(
              issues.some((i) => ['CONFIG_CHANGED', 'RUN_SUPERSEDED'].includes(i.code))
                ? ['sync', '--detach']
                : ['resume', runId, '--detach'],
            ),
            retryAt:
              (result as { retryAt?: string } | null)?.retryAt ?? issues.find((i) => i.retryAt)?.retryAt,
            requiresUser: issues.some((i) =>
              [
                'CONFIG_CHANGED',
                'RUN_SUPERSEDED',
                'AUTH_REQUIRED',
                'CONFIG_INVALID',
                'TARGET_ADOPTION_REQUIRED',
                'UNTRUSTED_UI_DEPENDENCIES',
                'UNSAFE_PATH',
                'PATH_CONFLICT',
              ].includes(i.code),
            ),
          });
      }
      if (command === 'ui' && action === 'serve' && state === 'completed') {
        const site = (result as { site: string }).site,
          port = number('port') ?? 4000;
        if (!Number.isSafeInteger(port) || port < 0 || port > 65535)
          throw new FdgError('BAD_INPUT', '--port must be 0–65535');
        const { staticServer } = await import('../ui/index.js');
        await holdArtifact(resolve(site, '../..'));
        const server = staticServer(site);
        await new Promise<void>((done, fail) => {
          server.once('error', fail);
          server.listen(port, '127.0.0.1', done);
        });
        result = { site, url: 'http://127.0.0.1:' + (server.address() as { port: number }).port };
        for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => server.close());
      }
    }
  }
} catch (error) {
  const problem = issue(error);
  issues.push(problem);
  state = 'failed';
  exitCode = exitCodes[problem.code as keyof typeof exitCodes] ?? exitCodes.failed;
}
await diagnostics.flush();
process.stderr.write = stderr;
console.log = originalLog;
originalStdout(serializeResult({ command, config, runId, state, result, issues, nextActions }, textOutput));
process.exitCode = exitCode;
