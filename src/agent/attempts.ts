import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { AgentRuntimeConfig } from '../contracts/agent.js';
import { type AgentResolver, type ResolvedAgent, type TaskResult } from '../contracts/agent.js';
import { ModelError } from '../contracts/model-errors.js';
import { ArtifactError } from '../contracts/topics.mjs';
import { errorText } from '../platform/errors.js';
import { atomicWrite } from '../platform/files.js';
import { hash } from '../platform/hash.js';
import { nowIso } from '../platform/time.js';
import type { Storage } from '../storage/index.js';
import { QuotaDeferred } from '../storage/index.js';
import { resolveAgent } from './client.js';
const fallbackCodes = new Set([
  'MODEL_UNAVAILABLE',
  'MODEL_CALL_TIMEOUT',
  'PROVIDER_RATE_LIMITED',
  'MODEL_BUDGET_EXHAUSTED',
]);
export async function paidTask<T extends TaskResult>(
  store: Storage,
  primary: AgentRuntimeConfig,
  key: string,
  input: unknown,
  options: {
    signal?: AbortSignal;
    remaining: () => number;
    beforeAttempt?: () => void;
    begin: (workspace: string) => void;
    generate: (agent: ResolvedAgent, repair: string | undefined, workspace: string) => Promise<T>;
    validate: (output: unknown) => unknown;
    resolver?: AgentResolver;
    repair?: string;
    owner?: 'batch' | 'task';
  },
): Promise<{ result?: T; agent?: ResolvedAgent; deferred: boolean; error?: unknown; workspace?: string }> {
  const routes = [
    primary,
    ...(primary.fallbackEnabled ? primary.candidates.map((candidate) => ({ ...primary, ...candidate })) : []),
  ];
  const unique = routes.filter(
    (route, i) =>
      routes.findIndex(
        (r) => r.model === route.model && r.account === route.account && r.effort === route.effort,
      ) === i,
  );
  let last: unknown,
    repair = options.repair,
    repairs = 0;
  for (const route of unique) {
    const model = route.model;
    if (!model) throw new ModelError('CONFIG_INVALID', 'Model must be resolved before a paid attempt');
    const accountKey = model.split('/')[0] + '/' + route.account;
    const cooldown = store.models.cooldown(route.backend, accountKey, model, nowIso());
    if (cooldown) {
      last = new ModelError('PROVIDER_RATE_LIMITED', 'Candidate account is cooling down', cooldown.retry_at);
      continue;
    }
    let agent: ResolvedAgent;
    try {
      const candidate = { ...route };
      delete (candidate as any).execution;
      agent =
        model === primary.model && route.account === primary.account && route.effort === primary.effort && 'execution' in primary
          ? (primary as ResolvedAgent)
          : await (options.resolver ?? resolveAgent)(candidate, options.signal);
    } catch (error) {
      last = error;
      if (error instanceof ModelError && fallbackCodes.has(error.code)) continue;
      throw error;
    }
    while (options.remaining() > 0) {
      options.signal?.throwIfAborted();
      store.assertLease();
      const id = randomUUID(),
        workspace = join(agent.runtimeDirectory, 'task-' + id),
        inputHash = hash(input);
      await mkdir(workspace, { recursive: true, mode: 0o700 });
      await atomicWrite(
        join(workspace, '.feedgarden-workspace.json'),
        JSON.stringify({ version: 1, [options.owner ?? 'task']: key }),
      );
      await atomicWrite(
        join(workspace, 'attempt.json'),
        JSON.stringify({ attemptId: id, task: key, inputHash, execution: agent.execution }),
      );
      let call: number;
      try {
        options.signal?.throwIfAborted();
        store.assertLease();
        options.beforeAttempt?.();
        call = store.startCall(key, agent.model, agent.maxDailyCalls, agent.backend, agent.account);
      } catch (error) {
        // No paid attempt owns this directory yet, including quota and selection rejections.
        await rm(workspace, { recursive: true, force: true });
        if (error instanceof QuotaDeferred) {
          last = new ModelError(
            'MODEL_BUDGET_EXHAUSTED',
            'Model daily budget exhausted',
            new Date(Date.now() + 86400000).toISOString().slice(0, 10) + 'T00:00:00.000Z',
          );
          break;
        }
        throw error;
      }
      store.models.recordAttempt(id, key, JSON.stringify(agent.execution), workspace, inputHash, 'running', nowIso());
      options.begin(workspace);
      let result: T;
      try {
        result = await options.generate(agent, repair, workspace);
        if (result.execution && JSON.stringify(result.execution) !== JSON.stringify(agent.execution))
          throw new ModelError('ARTIFACT_INVALID', 'Attempt returned a different execution identity');
        options.validate(result.output);
      } catch (error) {
        options.signal?.throwIfAborted();
        store.assertLease();
        store.finishCall(call, 'failed', {
          attemptId: id,
          execution: agent.execution,
          error: errorText(error),
        });
        store.models.failAttempt(id);
        options.signal?.throwIfAborted();
        store.assertLease();
        last = error;
        if (error instanceof ModelError && ['AUTH_REQUIRED', 'CONFIG_INVALID'].includes(error.code)) throw error;
        if (error instanceof ArtifactError && repairs++ < 1) {
          repair = errorText(error);
          continue;
        }
        if (error instanceof ModelError && fallbackCodes.has(error.code)) {
          if (error.code === 'PROVIDER_RATE_LIMITED') {
            const retry = error.retryAt ?? new Date(Date.now() + 1800000).toISOString();
            store.models.setCooldown(agent.backend, accountKey, error.scope === 'model' ? agent.model : '*', retry);
          }
          break;
        }
        return { deferred: false, error };
      }
      // Durable output is recoverable even if cancellation arrives before acceptance.
      // Storage errors escape this adapter and can never select another model.
      await atomicWrite(join(workspace, 'result.json'), JSON.stringify(result.output));
      await atomicWrite(
        join(workspace, 'audit.json'),
        JSON.stringify({ attemptId: id, inputHash, execution: agent.execution, ...result }),
      );
      options.signal?.throwIfAborted();
      store.assertLease();
      store.finishCall(call, 'succeeded', {
        attemptId: id,
        execution: agent.execution,
        updates: result.usage,
      });
      store.models.completeAttempt(id);
      return { result, agent, deferred: false, workspace };
    }
    if (options.remaining() <= 0)
      return {
        deferred: false,
        error: last ?? new ModelError('ATTEMPTS_EXHAUSTED', 'Content version exhausted its five attempts'),
      };
  }
  return { deferred: last instanceof ModelError && fallbackCodes.has(last.code), error: last };
}
export async function recoverableAttempt(
  store: Storage,
  workspace: string,
  key: string,
  input: unknown,
): Promise<boolean> {
  let marker;
  try {
    marker = JSON.parse(await readFile(join(workspace, 'attempt.json'), 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    // Only legacy tasks proven by both their DB reference and ownership marker
    // may omit the new attempt manifest. Removing one cannot downgrade a task.
    if (store.models.hasAttemptWorkspace(workspace)) return false;
    const owner = JSON.parse(await readFile(join(workspace, '.feedgarden-workspace.json'), 'utf8'));
    return (
      owner.version === 1 &&
      ((owner.task === key &&
        !!store.models.ownsTaskWorkspace(key, workspace)) ||
        (owner.batch === key &&
          !!store.models.ownsBatchWorkspace(key, workspace)))
    );
  }
  const row = store.models.findAttempt(marker.attemptId);
  return (
    !!row &&
    row.task === key &&
    row.workspace === workspace &&
    row.input_hash === hash(input) &&
    marker.inputHash === row.input_hash &&
    JSON.stringify(marker.execution) === row.model &&
    ['running', 'succeeded', 'failed'].includes(row.state)
  );
}
