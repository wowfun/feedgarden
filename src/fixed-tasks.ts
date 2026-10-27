import type { AgentRuntimeConfig } from './storage-paths.js';
import { lstat, mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { generateTask, agentIdentity, resolveAgent, configuredAgent, type AgentResolver, type AuxiliaryTask, type TaskResult } from './agent.js';
import type { Config } from './config.js';
import { Store, QuotaDeferred } from './store.js';
import { ArtifactError } from './topics-contract.mjs';
import { validateTask } from './task-contract.mjs';
import { atomicWrite, hash, errorText, nowIso } from './util.js';
import { reportTaskSkill } from './report-skill.js';

export type TaskGenerator = typeof generateTask;
interface TaskRow { key: string; input: string; output: string | null; workspace: string; state: string; attempts: number; next_at: string; error: string | null }
const runtimeFailures = new WeakMap<Store, number>();
const retried = new WeakMap<Store, Set<string>>();
export async function taskKey(agent: Config['agent'], kind: AuxiliaryTask, input: unknown): Promise<string> {
  return hash({ kind, input, ...agentIdentity(agent), revision: 1,
    skill: await reportTaskSkill(kind) });
}

async function createTaskWorkspace(agent: AgentRuntimeConfig, key: string): Promise<string> {
  const workspace = resolve(agent.runtimeDirectory, 'task-' + randomUUID());
  await mkdir(workspace, { recursive: true, mode: 0o700 });
  await atomicWrite(join(workspace, '.feedgarden-workspace.json'), JSON.stringify({ version: 1, task: key }));
  return workspace;
}

/** One durable task visit. Recovery precedes quota spending; deferred work is resumable. */
export async function fixedTask(store: Store, agent: AgentRuntimeConfig, kind: AuxiliaryTask, input: unknown, options: { signal?: AbortSignal; retryFailed?: boolean; generator?: TaskGenerator; resolveAgent?: AgentResolver } = {}): Promise<{ output?: unknown; key: string; state: string; performed: boolean }> {
  options.signal?.throwIfAborted(); store.assertLease();
  const json = JSON.stringify(input);
  if (json.length > agent.maxInputChars) throw new Error('Fixed task exceeds agent.maxInputChars; split the input');
  const resolved = 'execution' in agent ? agent : await (options.resolveAgent ?? (options.generator ? configuredAgent : resolveAgent))(agent, options.signal);
  options.signal?.throwIfAborted(); store.assertLease();
  agent = resolved;
  const key = await taskKey(agent, kind, input), now = nowIso();
  let row = store.statement('SELECT * FROM feed_tasks WHERE key=?').get(key) as TaskRow | undefined;
  if (!row) {
    const workspace = await createTaskWorkspace(agent, key);
    options.signal?.throwIfAborted(); store.assertLease();
    store.statement("INSERT INTO feed_tasks(key,kind,input,workspace,state,created_at) VALUES (?,?,?,?,'pending',?)").run(key, kind, json, workspace, now);
    row = store.statement('SELECT * FROM feed_tasks WHERE key=?').get(key) as TaskRow;
  }
  const accept = (value: unknown) => {
    const output = validateTask(kind, value, input);
    store.assertLease();
    const json = JSON.stringify(output);
    if (row.state !== 'accepted' || row.output !== json || row.error) store.statement("UPDATE feed_tasks SET output=?,state='accepted',error=NULL WHERE key=?").run(json, key);
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
  if (row.workspace) {
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
    store.statement('UPDATE feed_tasks SET output=NULL,state=?,next_at=?,error=? WHERE key=?').run(row.state, row.next_at, row.error, key);
  }
  const retries = retried.get(store) ?? new Set<string>(); retried.set(store, retries);
  if (options.retryFailed && row.state === 'failed' && !retries.has(key)) {
    retries.add(key);
    store.statement("UPDATE feed_tasks SET attempts=0,next_at='',state='pending',error=NULL WHERE key=?").run(key);
    row.attempts = 0; row.next_at = ''; row.state = 'pending';
  }
  if (row.attempts >= 5 || row.next_at > now) return { key, state: row.attempts >= 5 ? 'failed' : 'pending', performed: false };
  if (!row.workspace) {
    const workspace = await createTaskWorkspace(agent, key);
    options.signal?.throwIfAborted(); store.assertLease();
    store.statement('UPDATE feed_tasks SET workspace=?,created_at=? WHERE key=?').run(workspace, now, key);
    row.workspace = workspace;
  }
  let repair = row.error ?? undefined;
  for (let attempt = 0; attempt < 2 && row.attempts < 5; attempt++) {
    options.signal?.throwIfAborted(); store.assertLease();
    let call: number;
    try { call = store.startCall(key, agent.model!, agent.maxDailyCalls); }
    catch (e) { if (e instanceof QuotaDeferred) return { key, state: 'deferred', performed: false }; throw e; }
    row.attempts++;
    store.statement("UPDATE feed_tasks SET attempts=?,state='running' WHERE key=?").run(row.attempts, key);
    let persisting = false;
    try {
      const result: TaskResult = await (options.generator ?? generateTask)(agent, kind, input, repair, row.workspace, options.signal);
      const output = validateTask(kind, result.output, input);
      options.signal?.throwIfAborted(); store.assertLease(); persisting = true;
      await atomicWrite(join(row.workspace, 'result.json'), JSON.stringify(output));
      await atomicWrite(join(row.workspace, 'audit.json'), JSON.stringify({ key, ...result }));
      const accepted = accept(output); store.finishCall(call, 'succeeded', { execution: result.execution ?? ('execution' in agent ? agent.execution : undefined), updates: result.usage }); runtimeFailures.set(store, 0);
      return { ...accepted, performed: true };
    } catch (e) {
      repair = errorText(e); store.finishCall(call, 'failed', { execution: 'execution' in agent ? agent.execution : undefined, error: repair });
      // The call was attempted and stays in the audit/quota ledger. Cancellation
      // or ownership loss must not install a task failure/backoff for its successor.
      options.signal?.throwIfAborted(); store.assertLease();
      if (persisting) throw e;
      const next = new Date(Date.now() + Math.min(6 * 3600_000, 900_000 * 2 ** (row.attempts - 1))).toISOString();
      store.statement('UPDATE feed_tasks SET state=?,next_at=?,error=? WHERE key=?').run(row.attempts >= 5 ? 'failed' : 'pending', next, repair, key);
      if (/MANUAL_ACTION:|unauthorized|invalid.api.key|authentication failed/i.test(repair)) throw e;
      const failures = e instanceof ArtifactError ? 0 : (runtimeFailures.get(store) ?? 0) + 1;
      runtimeFailures.set(store, failures);
      if (failures >= 3) throw new Error('Three consecutive ACP runtime/transport failures; stopping this run');
      if (!(e instanceof ArtifactError)) break;
    }
  }
  return { key, state: row.attempts >= 5 ? 'failed' : 'pending', performed: true };
}
