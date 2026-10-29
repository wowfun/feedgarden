import { cp, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { budgetReport, createAgentResolver, resolveAgent } from '../agent/index.js';
import { applyTopics, collect, maintainArchive, previewRank, rankItems, recoverContent, relate, writeSite } from '../content/index.js';
import { type AgentResolver } from '../contracts/agent.js';
import { FdgError, issue } from '../contracts/errors.js';
import type { InstanceContext } from '../instance/index.js';
import { withExecutionPolicy } from '../instance/index.js';
import { atomicWrite } from '../platform/files.js';
import { hash } from '../platform/hash.js';
import { adoptTarget, exportTarget, publish, reconcileTargetTopics, targetFor } from '../publishing/index.js';
import type { Executor } from '../runs/index.js';
import { backup, indexItems } from '../storage/index.js';
import { checkpointStep } from './checkpoint.js';
import { processContent } from './process-content.js';
import type { OperationResult } from './result.js';

export const execute: Executor = async (config, ctx) => {
  const { scope, store, signal, checkpoint, saveCheckpoint } = ctx,
    options = scope.options,
    command = scope.positionals[0]!;
  const text = (key: string) => (typeof options[key] === 'string' ? (options[key] as string) : undefined);
  let selected = config;
  const subscription = text('subscription')?.split('/').at(-1);
  if (subscription)
    selected = {
      ...config,
      sources: config.sources
        .map((source) => ({
          ...source,
          streams: source.streams.filter((stream) => stream.enabled && stream.id === subscription),
        }))
        .filter((source) => source.streams.length),
    };
  if (options.model || options.effort) {
    const override = {
      ...(options.model ? { model: text('model') } : {}),
      ...(options.effort ? { effort: text('effort') } : {}),
    };
    selected = {
      ...selected,
      agent: { ...selected.agent, ...override },
      sources: selected.sources.map((source) => ({ ...source, agent: { ...source.agent, ...override } })),
    } as InstanceContext;
  }
  selected = withExecutionPolicy(selected, { fallbackEnabled: !!options.fallback });
  const result: OperationResult = {},
    issues: ReturnType<typeof issue>[] = [],
    skipped: unknown[] = [];
  const resolver: AgentResolver = createAgentResolver(async (requested, signal) => {
    const resolved = await resolveAgent(requested, signal),
      key = hash(requested),
      previous = scope.executions[key];
    if (previous && hash(previous) !== hash(resolved.execution))
      throw new FdgError('CONFIG_CHANGED', 'Resolved model execution changed; start a new run');
    if (!previous) {
      scope.executions[key] = resolved.execution;
      store.assertLease();
      store.runs.updateScope(JSON.stringify(scope), ctx.id);
    }
    return resolved;
  });
  let progress = 0,
    deferred = false;
  const step = checkpointStep(ctx);
  await recoverContent(selected, store);
  if (['collect', 'sync'].includes(command)) {
    result.collections = await step('collect', () =>
      collect(
        selected,
        store,
        text('source'),
        !!options.due,
        undefined,
        scope.window?.since ?? text('since'),
        signal,
      ),
    );
    progress += result.collections.reduce((n, row) => n + ('newItems' in row ? row.newItems ?? 0 : 0), 0);
    for (const row of result.collections) {
      if (row.status === 'unavailable')
        issues.push({
          code: 'SOURCE_UNAVAILABLE',
          message: 'Source returned no usable route',
          evidence: { trust: 'untrusted', text: JSON.stringify(row) },
        });
      if (row.status === 'deferred') deferred = true;
    }
    indexItems(store);
  }
  if (['process', 'sync'].includes(command)) {
    const processed = await processContent(config, selected, ctx, resolver, step);
    selected = processed.selected; Object.assign(result, processed.result); issues.push(...processed.issues); skipped.push(...processed.skipped); progress += processed.progress; deferred ||= processed.deferred;
  } else if (command === 'rank')
    result.rank = await step('rank', () =>
      options['dry-run']
        ? previewRank(selected, { source: text('source'), history: !!options.history })
        : rankItems(selected, store, { source: text('source'), history: !!options.history, signal }),
    );
  else if (command === 'relate')
    result.relations = await step('relate', () =>
      relate(selected, store, { resolveAgent: resolver, signal, retryFailed: !!options['retry-failed'] }),
    );
  else if (command === 'export')
    result.export = await step('export', () =>
      exportTarget(selected, store, options.target ? targetFor(selected, text('target')) : undefined, {
        output: text('output'),
        format: text('format') as 'json' | 'markdown' | 'jekyll' | undefined,
        rebuild: !!options.rebuild,
        signal,
      }),
    );
  else if (command === 'topics') {
    const file = scope.positionals[2];
    if (!file) throw new FdgError('BAD_INPUT', 'topics apply requires a registry file');
    const registry = JSON.parse(await readFile(file, 'utf8'));
    if (options['remote-base'])
      await reconcileTargetTopics(
        selected,
        targetFor(selected, text('target')),
        text('remote-base')!,
        registry,
        signal,
      );
    else await applyTopics(selected.feed.topics, registry, undefined, signal);
    result.topics = { applied: true };
    progress++;
  } else if (command === 'archives') {
    const path = scope.positionals[2];
    if (!path) throw new FdgError('BAD_INPUT', 'archives update/remove requires a content path');
    result.archiveBackup = await maintainArchive(
      selected,
      store,
      scope.positionals[1] as 'update' | 'remove',
      path,
      signal,
    );
    if (scope.positionals[1] === 'remove')
      for (const target of selected.targets.filter((t) => !options.target || t.id === options.target))
        for (const name of [path, '_translations/zh-CN/' + path])
          store.maintenance.deletePath(target.id, name);
    progress++;
  } else if (command === 'backup') {
    const paths = selected.paths,
      destination = join(paths.backups, 'instance-' + ctx.id);
    await mkdir(destination, { recursive: true });
    result.database = await backup(store, paths.backups);
    await cp(paths.configFile, join(destination, 'feedgarden.jsonc'));
    for (const name of ['workspaces', 'recovery', 'targets']) {
      const from = join(paths.dataDir, name);
      await cp(from, join(destination, name), { recursive: true }).catch((e) => {
        if (e.code !== 'ENOENT') throw e;
      });
    }
    result.pendingArtifacts = destination;
    progress++;
  } else if (command === 'targets' && scope.positionals[1] === 'adopt') {
    result.adoption = await adoptTarget(
      selected,
      store,
      targetFor(selected, scope.positionals[2]),
      text('expected-head') ?? '',
      !!options.takeover,
      signal,
    );
    progress++;
  } else if (command === 'backend') {
    const { run } = await import('../platform/process/execute.js'),
      directory = join(selected.paths.dataDir, 'tools', 'dsh');
    await mkdir(directory, { recursive: true });
    await run(
      'npm',
      ['install', '--prefix', directory, '--save-exact', '@deepseek-ai/dsh@0.1.7-rc.2'],
      directory,
      process.env,
      signal,
    );
    const manifest = await readFile(join(directory, 'node_modules/@deepseek-ai/dsh/package.json'), 'utf8');
    const receipt = join(directory, 'receipt.json');
    await atomicWrite(
      receipt,
      JSON.stringify({
        package: '@deepseek-ai/dsh',
        version: '0.1.7-rc.2',
        manifestHash: hash(manifest),
        installedAt: new Date().toISOString(),
      }),
    );
    result.backend = { installed: true, directory, version: '0.1.7-rc.2', receipt };
    progress++;
  } else if (command === 'channel') {
    const { setupTwitter } = await import('../sources/index.js');
    result.channel = await setupTwitter(selected, signal);
    progress++;
  } else if (command === 'ui') {
    const target = targetFor(selected, text('target')),
      content = target.output ?? join(selected.paths.dataDir, 'exports', target.id);
    if (scope.positionals[1] === 'clippings') {
      const { fetchClippings } = await import('../ui/index.js');
      result.clippings = await fetchClippings(
        { ...selected, feed: { ...selected.feed, directory: content } },
        {
          paths: scope.positionals.slice(3),
          all: !!options.all,
          maxBytes: Number(text('max-mib') ?? 32) * 1024 * 1024,
          runnerOwned: true,
          signal,
        },
      );
      for (const row of result.clippings) {
        if (row.status === 'failed')
          issues.push({
            code: 'MEDIA_FETCH_FAILED',
            message: 'Clipping media fetch failed',
            evidence: { trust: 'untrusted', text: JSON.stringify(row) },
          });
        else progress++;
      }
    } else {
      const { buildTarget } = await import('../ui/index.js');
      result.site = await buildTarget(selected, target, content, signal);
      progress++;
    }
  }
  if (['rank', 'relate', 'topics', 'archives'].includes(command)) await writeSite(selected, store, signal);
  if (command === 'publish' || options.publish) {
    const targets = options.target ? [targetFor(selected, text('target'))] : selected.targets;
    if (!targets.length) throw new FdgError('BAD_INPUT', 'No publication targets configured');
    result.targets = [];
    for (const target of targets) {
      try {
        const projection = await exportTarget(selected, store, target, { signal });
        const revision = hash([
          projection.entries,
          store.maintenance.orderedDeletions(target.id),
        ]);
        const receipt = await step(
          'publish:' + target.id,
          () => publish(selected, store, target, { dryRun: !!options['dry-run'], signal }),
          revision,
        );
        result.targets.push(receipt);
        if ('confirmed' in receipt && receipt.confirmed) progress++;
      } catch (error) {
        signal.throwIfAborted();
        store.assertLease();
        issues.push(issue(error));
        result.targets.push({ targetId: target.id, state: 'failed' });
      }
    }
  }
  result.skipped = skipped;
  result.window = scope.window ?? null;
  result.requested = scope.requested ?? null;
  result.windowClipped = scope.windowClipped ?? false;
  result.budgets = budgetReport(selected, store);
  if (result.rank?.some((row) => row.status === 'deferred')) deferred = true;
  if (result.relations) {
    progress += command === 'relate' ? result.relations.judged : 0;
    deferred ||= result.relations.pending > 0 || result.relations.deferred;
    if (result.relations.configurationError && !issues.some((i) => i.code === 'RELATIONS_FAILED'))
      issues.push({
        code: 'RELATIONS_FAILED',
        message: 'Relation configuration failed',
        evidence: { trust: 'untrusted', text: result.relations.configurationError },
      });
  }
  const retries = [
    ...store.maintenance.retries(new Date().toISOString(), new Date().toISOString()),
    ...(result.collections ?? []).flatMap(row => 'retryAt' in row && row.retryAt ? [{ retryAt: row.retryAt }] : []),
  ];
  if (deferred)
    result.retryAt =
      retries
        .map((row) => row.retryAt)
        .filter(Boolean)
        .sort()[0] ?? new Date(Date.now() + 86400000).toISOString().slice(0, 10) + 'T00:00:00.000Z';
  const state = issues.length
    ? progress
      ? 'partial'
      : 'failed'
    : deferred
      ? progress
        ? 'partial'
        : 'deferred'
      : 'completed';
  return { state, result, issues };
};
