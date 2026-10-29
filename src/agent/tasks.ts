import { lstat, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AgentRuntimeConfig } from '../contracts/agent.js';
import { type AgentResolver, type AuxiliaryTask } from '../contracts/agent.js';
import type { InstanceContext } from '../instance/index.js';
import { paidTask, recoverableAttempt } from './attempts.js';
import { configuredAgent, generateTask, resolveAgent } from './client.js';

import { validateTask } from '../contracts/tasks.mjs';
import { ArtifactError } from '../contracts/topics.mjs';
import { errorText } from '../platform/errors.js';
import { hash } from '../platform/hash.js';
import { nowIso } from '../platform/time.js';
import type { Storage } from '../storage/index.js';
import { reportTaskSkill } from './instructions.js';

export type TaskGenerator = typeof generateTask;
interface TaskRow { key: string; input: string; output: string | null; workspace: string; state: string; attempts: number; next_at: string; error: string | null }
const retried = new WeakMap<Storage, Set<string>>();
export async function taskKey(agent: InstanceContext['agent'], kind: AuxiliaryTask, input: unknown): Promise<string> {
  return hash({
    kind, input, revision: 1,
    skill: await reportTaskSkill(kind)
  });
}

/** One durable task visit. Recovery precedes quota spending; deferred work is resumable. */
export async function fixedTask(store: Storage, agent: AgentRuntimeConfig, kind: AuxiliaryTask, input: unknown, options: { signal?: AbortSignal; retryFailed?: boolean; generator?: TaskGenerator; resolveAgent?: AgentResolver } = {}): Promise<{ output?: unknown; key: string; state: string; performed: boolean }> {
  options.signal?.throwIfAborted(); store.assertLease();
  const json = JSON.stringify(input);
  if (json.length > agent.maxInputChars) throw new Error('Fixed task exceeds agent.maxInputChars; split the input');
  const key = await taskKey(agent, kind, input), now = nowIso();
  let row = store.tasks.find(key) as TaskRow | undefined;
  if (!row) {
    options.signal?.throwIfAborted(); store.assertLease();
    store.tasks.create(key, kind, json, '', now);
    row = store.tasks.find(key) as TaskRow;
  }
  const accept = (value: unknown) => {
    const output = validateTask(kind, value, input);
    store.assertLease();
    const json = JSON.stringify(output);
    if (row.state !== 'accepted' || row.output !== json || row.error) store.tasks.accept(json, key);
    return { key, output, state: 'accepted', performed: false };
  };
  let rejected: string | undefined;
  if (row.output !== null) {
    try { return accept(JSON.parse(row.output)); }
    catch (error) {
      if (!(error instanceof ArtifactError) && !(error instanceof SyntaxError)) throw error;
      rejected = errorText(error);
    }
  }
  if (row.workspace && await recoverableAttempt(store, row.workspace, key, input)) {
    const resultPath = join(row.workspace, 'result.json');
    const stat = await lstat(resultPath).catch(e => { if (e.code !== 'ENOENT') throw e; return undefined; });
    if (stat?.isFile() && !stat.isSymbolicLink() && stat.size <= 256_000) {
      try { return accept(JSON.parse(await readFile(resultPath, 'utf8'))); }
      catch (e) { if (!(e instanceof ArtifactError) && !(e instanceof SyntaxError)) throw e; }
    }
  }
  if (rejected || row.state === 'accepted') {
    // Prefer a valid saved artifact above. If both copies are unusable, invalidate
    // the cache without resetting paid attempts or bypassing the daily allowance.
    options.signal?.throwIfAborted(); store.assertLease();
    row.output = null; row.state = row.attempts >= 5 ? 'failed' : 'pending'; row.next_at = '';
    row.error = 'Cached task artifact rejected: ' + (rejected ?? 'Missing accepted output');
    store.tasks.invalidate(row.state, row.next_at, row.error, key);
  }
  const retries = retried.get(store) ?? new Set<string>(); retried.set(store, retries);
  if (options.retryFailed && row.state === 'failed' && !retries.has(key)) {
    retries.add(key);
    store.tasks.retry(key);
    row.attempts = 0; row.next_at = ''; row.state = 'pending';
  }
  if (row.attempts >= 5 || row.next_at > now) return { key, state: row.attempts >= 5 ? 'failed' : 'pending', performed: false };
  agent = 'execution' in agent ? agent : await (options.resolveAgent ?? (options.generator ? configuredAgent : resolveAgent))(agent, options.signal);
  options.signal?.throwIfAborted(); store.assertLease();
  const paid = await paidTask(store, agent, key, input, {
    signal: options.signal, resolver: options.resolveAgent ?? (options.generator ? configuredAgent : resolveAgent), repair: row.error ?? undefined,
    remaining: () => 5 - row.attempts,
    begin: workspace => { row.attempts++; row.workspace = workspace; store.tasks.start(row.attempts, workspace, nowIso(), key); },
    generate: (candidate, repair, workspace) => (options.generator ?? generateTask)(candidate, kind, input, repair, workspace, options.signal),
    validate: output => validateTask(kind, output, input),
  });
  if (paid.result) return { ...accept(paid.result.output), performed: true };
  if (paid.deferred) { store.tasks.defer(key); return { key, state: 'deferred', performed: false }; }
  const next = new Date(Date.now() + Math.min(6 * 3600000, 900000 * 2 ** (row.attempts - 1))).toISOString();
  store.tasks.fail(row.attempts >= 5 ? 'failed' : 'pending', next, errorText(paid.error), key);
  return { key, state: row.attempts >= 5 ? 'failed' : 'pending', performed: true };
}
