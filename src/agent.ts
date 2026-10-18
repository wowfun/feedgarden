import { spawn } from 'node:child_process';
import { closeAgentProcess, stopAgentProcess } from './agent-process.js';
import { Readable, Writable } from 'node:stream';
import { chmod, lstat, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { client, ndJsonStream, type SessionConfigOption } from '@agentclientprotocol/sdk';
import type { Config } from './config.js';
import type { Item } from './types.js';
import type { Registry } from './topics.js';
import { errorText } from './util.js';
import { validateArtifact, ArtifactError } from './topics-contract.mjs';
import { reportSkill, reportTaskSkill, type ReportTask } from './report-skill.js';
import { validateTask } from './task-contract.mjs';
import { prepareBackend, modelIdentity, modelValue } from './agent-backends.js';

function optionValues(option: SessionConfigOption | undefined): { value: string; name: string }[] {
  if (!option || option.type !== 'select') return [];
  return option.options.flatMap(entry => 'options' in entry ? entry.options : [entry]);
}
export interface SummaryInput { contractVersion: 2; topics: Registry; items: (Pick<Item, 'source' | 'id' | 'title' | 'text' | 'author' | 'media' | 'articleQuote'> & { discussion?: Pick<NonNullable<Item['discussion']>, 'comments'> })[] }
export interface AgentIdentity { backend: Config['agent']['backend']; version: string; model: string; effort?: string; configurationHash?: string }
export type ResolvedAgent = Config['agent'] & { model: string; execution: AgentIdentity };
export type AgentResolver = (config: Config['agent'], signal?: AbortSignal) => Promise<ResolvedAgent>;
export interface TaskResult { output: unknown; usage: unknown[]; directory: string; events: unknown[]; execution?: AgentIdentity; omittedNotifications?: { usage: number; events: number } }
export interface AgentResult extends TaskResult { output: ReturnType<typeof validateArtifact>['output'] }
export type AuxiliaryTask = ReportTask;

export function agentIdentity(config: Config['agent']): AgentIdentity {
  if (!config.model) throw new Error('Cache identity requires a resolved model');
  const execution = 'execution' in config ? (config as ResolvedAgent).execution : undefined;
  // Explicit selections without execution metadata belong to injected generators.
  // Native runs always supply the version established by their ACP resolver.
  return { backend: config.backend, version: execution?.version ?? config.version ?? 'injected', model: config.model, effort: config.effort, ...(execution?.configurationHash ? { configurationHash: execution.configurationHash } : {}) };
}
/** Custom generators can use explicit fixture selections without starting a real executable. */
export const configuredAgent: AgentResolver = async config => {
  if ('execution' in config) return config as ResolvedAgent;
  if (!config.model) throw new Error('An injected generator needs an explicit model or an injected agent resolver');
  return { ...config, model: config.model, execution: { ...agentIdentity(config), model: config.model, version: config.version ?? 'injected' } };
};
export function createAgentResolver(resolver: AgentResolver = resolveAgent): AgentResolver {
  const pending = new Map<string, Promise<ResolvedAgent>>();
  return (config, signal) => {
    if ('execution' in config) return Promise.resolve(config as ResolvedAgent);
    const key = JSON.stringify(config);
    let result = pending.get(key);
    if (!result) {
      result = resolver(config, signal).catch(error => { pending.delete(key); throw error; });
      pending.set(key, result);
    }
    return result;
  };
}
export const resolveAgent: AgentResolver = async (config, signal) => {
  if ('execution' in config) return config as ResolvedAgent;
  return runSession(config, { kind: 'probe' }, signal);
};
export async function generateBatch(config: Config['agent'], input: SummaryInput, repair?: string, workspace?: string, signal?: AbortSignal): Promise<AgentResult> {
  return runSession(config, { kind: 'summary', input, repair, workspace }, signal);
}
export async function generateTask(config: Config['agent'], task: AuxiliaryTask, input: unknown, repair?: string, workspace?: string, signal?: AbortSignal): Promise<TaskResult> {
  return runSession(config, { kind: 'task', task, input, repair, workspace }, signal);
}
export function artifactRepairFeedback(error: string): string {
  if (!/\btool[- ](?:input|call|arguments?)\b/i.test(error) || !/\b(?:invalid|malformed) JSON\b|\bJSON\b.{0,40}\b(?:invalid|malformed)\b/i.test(error)) return error.slice(0, 1000);
  return 'The previous tool call contained invalid JSON. Submit the structured object directly, escape quotes and line breaks inside strings, and check every closing bracket. Do not use single-quoted strings or trailing commas. The items field is an array, not an object: never close it with }. Put the required newTopics array before items. Within each item, en, zh-CN and discussion are sibling fields. If discussion is the last field, after its final zh-CN string close the discussion object, the item object, the items array and the root object, in that order: "}}]}. Do not omit the ] or add an extra } before it.';
}

class NotificationLog {
  readonly values: unknown[] = [];
  omitted = 0;
  private bytes = 0;
  private sizes: number[] = [];
  add(value: unknown): void {
    const size = Buffer.byteLength(JSON.stringify(value));
    if (size > 65536) { this.omitted++; return; }
    this.values.push(value); this.sizes.push(size); this.bytes += size;
    while (this.bytes > 65536 || this.values.length > 128) {
      this.bytes -= this.sizes.shift()!; this.values.shift(); this.omitted++;
    }
  }
}

interface GenerationOptions { repair?: string; workspace?: string }
type SummaryRequest = GenerationOptions & { kind: 'summary'; input: SummaryInput };
type TaskRequest = GenerationOptions & { kind: 'task'; task: AuxiliaryTask; input: unknown };
type ProbeRequest = { kind: 'probe' };
async function runSession(config: Config['agent'], request: ProbeRequest, signal?: AbortSignal): Promise<ResolvedAgent>;
async function runSession(config: Config['agent'], request: SummaryRequest, signal?: AbortSignal): Promise<AgentResult>;
async function runSession(config: Config['agent'], request: TaskRequest, signal?: AbortSignal): Promise<TaskResult>;
async function runSession(config: Config['agent'], request: ProbeRequest | SummaryRequest | TaskRequest, signal?: AbortSignal): Promise<TaskResult | ResolvedAgent> {
  signal?.throwIfAborted();
  const probe = request.kind === 'probe';
  const input = 'input' in request ? request.input : undefined;
  if (!probe && (!input || typeof input !== 'object' || Array.isArray(input))) throw new Error('Generation requires a fixed input object');
  const repair = 'repair' in request ? request.repair : undefined;
  const workspace = 'workspace' in request ? request.workspace : undefined;
  const task = request.kind === 'task' ? request.task : undefined;
  const started = Date.now();
  const abort = AbortSignal.any([AbortSignal.timeout(config.timeoutSeconds * 1000), ...(signal ? [signal] : [])]);
  const runtime = resolve(config.runtimeDirectory);
  await mkdir(runtime, { recursive: true, mode: 0o700 });
  const directory = workspace ?? await mkdtemp(join(runtime, probe ? 'probe-' : 'task-'));
  let dispose: (() => Promise<void>) | undefined;
  try {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await chmod(directory, 0o700);
    // DSH initializes its fixed plugin during the handshake. OpenCode probes
    // configure no MCP server, so only those probes can omit the artifact files.
    if (!probe || config.backend === 'dsh') {
      const fixed = probe ? { contractVersion: 2, topics: { version: 1, topics: [] }, items: [] } : input;
      const skill = task ? await reportTaskSkill(task) : await reportSkill(probe ? [] : (input as SummaryInput).items.map(item => item.source));
      await writeFile(join(directory, 'SKILL.md'), skill, { mode: 0o600 });
      await writeFile(join(directory, 'input.json'), JSON.stringify(fixed), { mode: 0o600 });
    }
    const prepared = await prepareBackend(config, directory, task, probe, abort);
    abort.throwIfAborted();
    const child = spawn(prepared.command, prepared.args, { cwd: directory, env: prepared.env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, detached: process.platform !== 'win32' });
    const closed = new Promise<void>(done => child.once('close', () => done()));
    const stop = () => stopAgentProcess(child);
    const usage = new NotificationLog(), events = new NotificationLog();
    let stderr = '', sessionId: string | undefined, stage = 'initialize', deleteProbe = false;
    child.stderr.on('data', data => { stderr = (stderr + String(data)).slice(-8000); });
    const connection = client({ name: 'feedgarden' })
      .onRequest('session/request_permission', () => ({ outcome: { outcome: 'cancelled' } }))
      .onNotification('session/update', ({ params }) => {
        const update = params.update;
        if (update.sessionUpdate === 'usage_update') usage.add(update);
        if (['tool_call', 'tool_call_update', 'config_option_update'].includes(update.sessionUpdate)) events.add(update);
      }).connect(ndJsonStream(Writable.toWeb(child.stdin), Readable.toWeb(child.stdout) as ReadableStream<Uint8Array>));
    child.on('error', error => connection.close(error));
    const timeout = setTimeout(() => { connection.close(new Error('ACP task timed out')); stop(); }, Math.max(0, config.timeoutSeconds * 1000 - (Date.now() - started)));
    const cancel = () => { connection.close(signal!.reason); stop(); };
    signal?.addEventListener('abort', cancel, { once: true });
    dispose = async () => {
      clearTimeout(timeout); signal?.removeEventListener('abort', cancel);
      if (sessionId && !abort.aborted) await connection.agent.request(deleteProbe ? 'session/delete' : 'session/close', { sessionId }, { cancellationSignal: AbortSignal.timeout(3000) }).catch(() => {});
      connection.close();
      await closeAgentProcess(child, closed);
    };
    try {
      signal?.throwIfAborted();
      const initialized = await connection.agent.request('initialize', { protocolVersion: 1, clientCapabilities: {}, clientInfo: { name: 'feedgarden', version: '0.1.0' } }, { cancellationSignal: abort });
      const expected = config.backend === 'dsh' ? 'deepseek-harness-acp' : 'OpenCode';
      if (initialized.agentInfo?.name !== expected) throw new Error('Expected the ' + config.backend + ' ACP agent');
      deleteProbe = probe && config.backend === 'opencode' && !!initialized.agentCapabilities?.sessionCapabilities?.delete;
      stage = 'create-session';
      const session = await connection.agent.request('session/new', { cwd: directory, mcpServers: [] }, { cancellationSignal: abort });
      sessionId = session.sessionId;
      let options = session.configOptions ?? [];
      const requested = new Map<string, string>();
      const select = async (category: string, value: string) => {
        const option = options.find(entry => entry.category === category);
        if (!option || !optionValues(option).some(entry => entry.value === value)) throw new Error('Configured ' + category + ' is unsupported by ' + config.backend + ': ' + value);
        const changed = await connection.agent.request('session/set_config_option', { sessionId: sessionId!, configId: option.id, value }, { cancellationSignal: abort });
        requested.set(option.id, value);
        options = changed.configOptions;
        if (config.backend !== 'opencode' && options.find(entry => entry.id === option.id)?.currentValue !== value) throw new Error('Agent did not select the configured ' + category);
      };
      if (config.backend === 'opencode') { stage = 'select-feedgarden-agent'; await select('mode', 'feedgarden'); }
      const inheritedModel = prepared.defaults?.model;
      const inheritedEffort = config.model === undefined || config.model === inheritedModel ? prepared.defaults?.effort : undefined;
      const value = modelValue({ ...config, model: config.model ?? inheritedModel });
      if (value !== undefined) { stage = 'select-model'; await select('model', value); }
      const requestedEffort = config.effort ?? inheritedEffort;
      if (requestedEffort !== undefined) { stage = 'select-effort'; await select('thought_level', requestedEffort); }
      const mismatch = () => [...requested].find(([id, value]) => options.find(option => option.id === id)?.currentValue !== value);
      if (config.backend === 'opencode' && initialized.agentCapabilities?.loadSession) {
        // Verify the persisted selection before prompting: config acknowledgements
        // can race session.model.selected events from an earlier request.
        stage = 'verify-selection';
        const loaded = await connection.agent.request('session/load', { sessionId, cwd: directory, mcpServers: [] }, { cancellationSignal: abort });
        options = loaded.configOptions ?? [];
      }
      const invalid = mismatch();
      if (invalid) throw new Error('Agent did not select the configured ' + invalid[0] + ': requested ' + invalid[1] + '; reported ' + String(options.find(option => option.id === invalid[0])?.currentValue));
      const model = options.find(entry => entry.category === 'model');
      if (!model || model.type !== 'select' || !optionValues(model).some(entry => entry.value === model.currentValue)) throw new Error('Agent did not advertise its selected model');
      const effort = options.find(entry => entry.category === 'thought_level');
      if (effort && (effort.type !== 'select' || !optionValues(effort).some(entry => entry.value === effort.currentValue))) throw new Error('Agent did not advertise its selected effort');
      const configurationHash = prepared.defaults?.configurationHash ?? ('execution' in config ? (config as ResolvedAgent).execution.configurationHash : undefined);
      const execution: AgentIdentity = { backend: config.backend, version: prepared.version, model: modelIdentity(config.backend, model.currentValue), ...(effort?.type === 'select' ? { effort: effort.currentValue } : {}), ...(configurationHash ? { configurationHash } : {}) };
      if ('execution' in config && JSON.stringify(execution) !== JSON.stringify((config as ResolvedAgent).execution)) throw new Error('Resolved agent selection changed before generation');
      if (probe) return { ...config, model: execution.model, effort: execution.effort, execution };
      stage = 'wait-tools';
      await prepared.waitReady?.(abort);
      stage = 'generate';
      const prompt = 'Call feedgarden_input to load the trusted skill and fixed input. Follow the skill, using feedgarden_result to write result.json. Supply the structured fields directly as tool arguments. Do not wrap the artifact in a JSON string or answer with it in chat.' + (repair ? ' Previous attempt failed: ' + (task ? repair.slice(0, 1500) : artifactRepairFeedback(repair)) : '');
      const response = await connection.agent.request('session/prompt', { sessionId, prompt: [{ type: 'text', text: prompt }] }, { cancellationSignal: abort });
      if (response.stopReason !== 'end_turn') throw new Error('Agent stopped with ' + response.stopReason);
      stage = 'validate-artifact';
      const path = join(directory, 'result.json'), stat = await lstat(path);
      if (!stat.isFile() || stat.size > 256_000) throw new Error('Invalid artifact file');
      const artifact = JSON.parse(await readFile(path, 'utf8'));
      const output = task ? validateTask(task, artifact, input) : validateArtifact(artifact, input as SummaryInput).output;
      signal?.throwIfAborted();
      return { output, execution, usage: usage.values, directory, events: events.values, omittedNotifications: { usage: usage.omitted, events: events.omitted } };
    } catch (error) {
      signal?.throwIfAborted();
      let message = 'ACP ' + stage + ': ' + errorText(error) + (stderr ? '; stderr: ' + stderr : '');
      for (const secret of prepared.secrets) message = message.split(secret).join('[redacted]');
      throw stage === 'validate-artifact' ? new ArtifactError(message) : new Error(message);
    }
  } finally {
    try { await dispose?.(); }
    finally { if (probe) await rm(directory, { recursive: true, force: true }); }
  }
}
