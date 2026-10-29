import { DateTime } from 'luxon';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { closeSync, openSync } from 'node:fs';
import { appendFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import type { InstanceContext } from '../instance/index.js';
import { configuration } from '../instance/index.js';

import { FdgError, issue } from '../contracts/errors.js';
import { exitCodes } from '../contracts/outcomes.js';
import { resolveItemWindow } from '../contracts/window.js';
import { hash } from '../platform/hash.js';
import { runnerLock } from '../platform/lock.js';
import { nowIso } from '../platform/time.js';
import type { ReadStorage, Storage } from '../storage/index.js';
import { openInstance } from '../storage/index.js';
import { invocation, registerRuntimeUser, stableRuntime } from './runtime.js';
import { pruneRunLogs } from './retention.js';
export type RunOptions = Record<string, string | boolean | undefined>;
export interface RunScope {
  options: RunOptions;
  positionals: string[];
  at: string;
  window?: ReturnType<typeof resolveItemWindow>;
  requested?: { since: string; until: string };
  windowClipped?: boolean;
  sources: string[];
  generations: Record<string, number>;
  instanceId: string;
  policies: unknown;
  executions: Record<string, unknown>;
}
export interface RunOutcome {
  state: keyof typeof exitCodes;
  result: unknown;
  issues: ReturnType<typeof issue>[];
}
export interface RunContext {
  id: string;
  scope: RunScope;
  signal: AbortSignal;
  store: Storage;
  checkpoint: Record<string, unknown>;
  saveCheckpoint: (stage: string, result: unknown) => void;
}
export type Executor = (config: InstanceContext, context: RunContext) => Promise<RunOutcome>;
export function configHash(config: InstanceContext): string {
  return hash(configuration(config));
}
function alive(pid: number | null): boolean {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
export function runStatus(store: Pick<ReadStorage, 'runs'>, id: string) {
  const row = store.runs.find(id);
  if (!row) throw new FdgError('RUN_NOT_FOUND', 'Unknown run ID');
  const active = ['queued', 'running'].includes(row.state),
    startupGrace = row.state === 'queued' && !row.pid ? 120000 : 5000;
  const dead =
    active && !alive(row.pid) && Date.now() - Date.parse(row.heartbeat ?? row.created_at) > startupGrace;
  return {
    runId: row.id,
    command: row.command,
    state: dead ? 'interrupted' : row.state,
    runExitCode: dead ? 130 : row.exit_code,
    scope: JSON.parse(row.scope),
    checkpoint: JSON.parse(row.checkpoint),
    result: row.result ? JSON.parse(row.result!) : null,
    heartbeat: row.heartbeat,
    logPath: undefined,
  };
}
export async function status(
  config: InstanceContext,
  id?: string,
  options: { latest?: boolean; unfinished?: boolean; waitSeconds?: number } = {},
) {
  const until = Date.now() + Math.min(60, options.waitSeconds ?? 0) * 1000;
  do {
    const store = openInstance(config, true);
    try {
      const ids = id
        ? [{ id }]
        : store.runs.listIds(options);
      const runs = ids.map((row) => ({
        ...runStatus(store, row.id),
        logPath: join(config.paths.state, 'runs', row.id + '.log'),
      }));
      if (Date.now() >= until || runs.every((row) => !['queued', 'running'].includes(row.state)))
        return { runs };
    } finally {
      store.close();
    }
    await delay(200);
  } while (true);
}
function freeze(config: InstanceContext, store: Storage, options: RunOptions, positionals: string[]): RunScope {
  options = { ...options }; positionals = [...positionals];
  if (typeof options.output === 'string') options.output = resolve(config.paths.configDir, options.output);
  if (positionals[0] === 'topics' && positionals[1] === 'apply' && positionals[2]) positionals[2] = resolve(positionals[2]);
  if (positionals[0] === 'ui' && positionals[1] === 'clippings') positionals = [...positionals.slice(0, 3), ...positionals.slice(3).map(path => resolve(path))];
  const at = nowIso();
  if (options.publish || positionals[0] === 'publish') {
    if (!config.targets.length) throw new FdgError('BAD_INPUT', 'No publication targets configured');
    if (options.target && !config.targets.some(target => target.id === options.target))
      throw new FdgError('BAD_INPUT', 'Unknown publication target');
  }
  if (typeof options.subscription === 'string' && options.subscription.includes('/')) {
    const [source, id, ...extra] = options.subscription.split('/');
    if (!source || !id || extra.length || (options.source && options.source !== source))
      throw new FdgError('BAD_INPUT', 'Subscription and source selectors disagree');
    options = { ...options, source, subscription: id };
  }
  const selected = options.source as string | undefined;
  const sources = config.sources
    .filter((s) => s.enabled && (!selected || s.id === selected))
    .map((s) => s.id);
  if (
    selected &&
    !sources.length &&
    !store.sources.hasExplicitSource(selected, selected)
  )
    throw new FdgError('BAD_INPUT', 'Unknown or disabled source');
  if (selected && !sources.includes(selected)) sources.push(selected);
  if (
    options.subscription &&
    !config.sources.some(
      (source) =>
        (!selected || source.id === selected) &&
        source.streams.some((stream) => stream.enabled && stream.id === options.subscription),
    )
  )
    throw new FdgError('BAD_INPUT', 'Unknown or disabled subscription');
  if (!selected && ['sync', 'process'].includes(positionals[0]!))
    for (const row of store.sources.explicitSources())
      if (!sources.includes(row.source)) sources.push(row.source);
  const scope: RunScope = {
    options,
    positionals,
    at,
    sources: ['sync', 'process', 'rank', 'archives'].includes(positionals[0]!) ? sources : [],
    generations: {},
    instanceId: config.instanceId,
    policies: {
      agent: config.agent,
      sources: config.sources.map((s) => ({ id: s.id, agent: s.agent })),
      fallback: !!options.fallback,
      targets: config.targets,
    },
    executions: {},
  };
  if (['sync', 'process'].includes(positionals[0]!)) {
    if (options.day && (options.since || options.until || options['observed-days']))
      throw new FdgError('BAD_INPUT', '--day is exclusive with date-window options');
    const day =
      options.day && options.day !== 'yesterday'
        ? DateTime.fromISO(String(options.day), { zone: config.timezone })
        : DateTime.fromISO(at).setZone(config.timezone).minus({ days: 1 });
    if (
      options['observed-days'] &&
      (!Number.isSafeInteger(Number(options['observed-days'])) ||
        Number(options['observed-days']) < 1 ||
        Number(options['observed-days']) > 30)
    )
      throw new FdgError('BAD_INPUT', '--observed-days must be 1–30');
    const normalize = (value: string) => {
      const date = DateTime.fromISO(value, { zone: config.timezone });
      if (!date.isValid) throw new FdgError('BAD_INPUT', 'Invalid date');
      return date.toUTC().toISO()!;
    };
    const since = normalize(String(options.since ?? day.startOf('day').toISO())),
      until = normalize(String(options.until ?? day.plus({ days: 1 }).startOf('day').toISO()));
    scope.requested = { since, until };
    if (Date.parse(until) <= Date.parse(store.meta('cutoff')!))
      throw new FdgError('OUTSIDE_INSTANCE_HISTORY', 'Requested window ends before collectionStart');
    try {
      scope.window = resolveItemWindow(
        { since, until, observedDays: Number(options['observed-days'] ?? config.observedDays) },
        store.meta('cutoff')!,
        at,
      );
    } catch (e) {
      throw new FdgError('BAD_INPUT', String(e));
    }
    scope.windowClipped = Date.parse(since) < Date.parse(scope.window.since);
  }
  return scope;
}
export async function createRun(config: InstanceContext, options: RunOptions, positionals: string[]) {
  const store = openInstance(config),
    id = randomUUID(),
    token = randomUUID(),
    paths = config.paths;
  try {
    const scope = freeze(config, store, options, positionals);
    await pruneRunLogs(config, store);
    await mkdir(join(paths.state, 'runs'), { recursive: true, mode: 0o700 });
    await appendFile(join(paths.state, 'runs', id + '.log'), 'Queued ' + id + '\n', { mode: 0o600 });
    store.runs.create(id, positionals.join(' '), JSON.stringify(scope), configHash(config), scope.at, token);
    process.stderr.write('runId: ' + id + '\n');
    return { id, token };
  } finally {
    store.close();
  }
}
export async function detach(config: InstanceContext, id: string, token: string, resume = false) {
  if (resume) {
    const reader = openInstance(config, true);
    try {
      const row = reader.runs.find(id);
      if (row && ['queued', 'running'].includes(row.state) && alive(row.pid))
        throw new FdgError('BUSY', 'Run still has a live worker');
    } finally {
      reader.close();
    }
  }
  const runtime = await stableRuntime(config),
    log = join(config.paths.state, 'runs', id + '.log'),
    fd = openSync(log, 'a', 0o600);
  try {
    const child = spawn(
      runtime.executable,
      invocation(config, runtime.entry.replace(/cli\.js$/, 'worker.js'), [
        '_worker',
        id,
        token,
        ...(resume ? ['resume'] : []),
      ]),
      { detached: true, windowsHide: true, stdio: ['ignore', fd, fd], env: { ...process.env } },
    );
    await new Promise<void>((done, fail) => {
      child.once('spawn', done);
      child.once('error', fail);
    });
    child.unref();
    await registerRuntimeUser(runtime, child.pid!);
    const store = openInstance(config);
    try {
      store.maintenance.queuedPid(child.pid!, id);
    } finally {
      store.close();
    }
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      const reader = openInstance(config, true);
      try {
        const row = reader.runs.find(id);
        if (row?.heartbeat && row.pid === child.pid) return { runId: id, state: row.state, logPath: log };
      } finally {
        reader.close();
      }
      if (!alive(child.pid ?? null))
        throw new FdgError('WORKER_START_FAILED', 'Worker exited before its durable handshake');
      await delay(100);
    }
    throw new FdgError(
      'WORKER_START_FAILED',
      'Worker did not complete its durable handshake; inspect status before retrying',
    );
  } finally {
    closeSync(fd);
  }
}
export async function cancel(config: InstanceContext, id: string) {
  const store = openInstance(config);
  try {
    const current = runStatus(store, id);
    if (['queued', 'running'].includes(current.state))
      store.runs.cancel(id);
    return { runId: id, cancelRequested: true, state: current.state };
  } finally {
    store.close();
  }
}
export async function executeRun(
  config: InstanceContext,
  id: string,
  token: string | undefined,
  execute: Executor,
  resume = false,
): Promise<RunOutcome> {
  const cancellation = new AbortController(),
    paths = config.paths;
  let release: (() => Promise<void>) | undefined,
    store: Storage | undefined,
    heartbeat: NodeJS.Timeout | undefined,
    ownedLease: string | undefined;
  const interrupt = () => cancellation.abort(new FdgError('INTERRUPTED', 'Run cancelled'));
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    try {
      release = await runnerLock(paths.runner, cancellation);
    } catch {
      throw new FdgError('BUSY', 'Another instance worker holds the runner lock');
    }
    store = openInstance(config);
    const row = store.runs.find(id);
    if (!row) throw new FdgError('RUN_NOT_FOUND', 'Unknown run ID');
    if (token && token !== row.token) throw new FdgError('RUN_OWNER_MISMATCH', 'Invalid worker launch token');
    if (resume && row.state === 'completed') return JSON.parse(row.result!);
    if (resume && alive(row.pid) && row.pid !== process.pid && ['queued', 'running'].includes(row.state))
      throw new FdgError('BUSY', 'Run still has a live worker');
    if (row.config_hash !== configHash(config))
      throw new FdgError('CONFIG_CHANGED', 'Configuration changed; start a new sync to reuse accepted work');
    const scope = JSON.parse(row.scope) as RunScope;
    if (scope.instanceId !== config.instanceId)
      throw new FdgError('INSTANCE_MISMATCH', 'Run belongs to another instance');
    store.runs.claim(scope, row, id, process.pid, nowIso(), resume, token => store!.acquireLease(token));
    ownedLease = row.token;
    if (row.cancel && !resume) interrupt();
    heartbeat = setInterval(() => {
      try {
        store!.renewLease(row.token);
        store!.runs.heartbeat(nowIso(), id, row.token);
        if (store!.runs.cancellation(id)?.cancel) interrupt();
      } catch (e) {
        cancellation.abort(e);
      }
    }, 1000);
    const checkpoint = JSON.parse(row.checkpoint);
    const saveCheckpoint = (stage: string, result: unknown) => {
      cancellation.signal.throwIfAborted();
      store!.assertLease();
      checkpoint[stage] = result;
      store!.runs.checkpoint(JSON.stringify(checkpoint), id);
    };
    const outcome = await execute(config, {
      id,
      scope,
      signal: cancellation.signal,
      store,
      checkpoint,
      saveCheckpoint,
    });
    cancellation.signal.throwIfAborted();
    store.assertLease();
    store.runs.complete(outcome.state, JSON.stringify(outcome), exitCodes[outcome.state], nowIso(), id);
    return outcome;
  } catch (error) {
    const outcome: RunOutcome = {
      state: cancellation.signal.aborted
        ? 'interrupted'
        : error instanceof FdgError && error.code === 'BUSY'
          ? 'BUSY'
          : 'failed',
      result: null,
      issues: [issue(error)],
    };
    if (store && outcome.state !== 'BUSY')
      store.runs.fail(outcome.state, JSON.stringify(outcome), exitCodes[outcome.state], id);
    return outcome;
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    if (store) {
      if (ownedLease) store.releaseLease(ownedLease);
      store.close();
    }
    await release?.();
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', interrupt);
  }
}
