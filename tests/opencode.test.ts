import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Store } from '../src/store.js';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { configSchema } from '../src/config.js';
import { resolveAgent, createAgentResolver, generateBatch, generateTask, type SummaryInput } from '../src/agent.js';
import { agentCommand } from '../src/process-command.js';
import { taskKey } from '../src/fixed-tasks.js';
import { prepareBackend } from '../src/agent-backends.js';
import { pathToFileURL } from 'node:url';

const peer = resolve('tests/fixtures/acp-peer.mjs');
const input: SummaryInput = { contractVersion: 2, topics: { version: 1, topics: [{ id: 'coding', name: { en: 'Coding', 'zh-CN': '编程' }, description: 'Tools', aliases: [], deprecated: false }] }, items: [{ source: 'one', id: 'fixed', title: 'Only a title', text: '' }] };
const config = (runtimeDirectory: string, overrides = {}) => configSchema.shape.agent.parse({ command: peer, runtimeDirectory, timeoutSeconds: 10, inheritEnvironment: ['FEEDGARDEN_PEER_LOG', 'FEEDGARDEN_PEER_CONFIG'], ...overrides });

test('OpenCode children receive only base settings and explicitly inherited provider variables', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-agent-env-'));
  const names = ['TWITTER_AUTH_TOKEN', 'TWITTER_CT0', 'GITHUB_TOKEN', 'FEEDGARDEN_AGENT_API_KEY', 'DEEPSEEK_API_KEY', 'CUSTOM_PROVIDER_AUTH', 'FEEDGARDEN_PEER_ENV'];
  const prior = Object.fromEntries(names.map(name => [name, process.env[name]]));
  try {
    for (const name of names) process.env[name] = 'fixture-secret-' + name;
    const isolated = await prepareBackend(config(root), root, undefined, true);
    for (const name of names) assert.equal(isolated.env[name], undefined, name);
    assert.equal(isolated.env.PATH, process.env.PATH);
    const wrapper = join(root, 'peer.mjs');
    await writeFile(wrapper, 'import ' + JSON.stringify(pathToFileURL(peer).href) + ';');
    process.env.FEEDGARDEN_PEER_ENV = join(root, 'environment.ndjson');
    const allowed = config(root, { command: wrapper, inheritEnvironment: ['CUSTOM_PROVIDER_AUTH', 'FEEDGARDEN_PEER_ENV'] });
    const selected = await resolveAgent(allowed);
    const prepared = await prepareBackend(selected, root, undefined, true);
    assert.equal(prepared.env.CUSTOM_PROVIDER_AUTH, process.env.CUSTOM_PROVIDER_AUTH);
    assert.ok(prepared.secrets.includes(process.env.CUSTOM_PROVIDER_AUTH!));
    const observations = (await readFile(process.env.FEEDGARDEN_PEER_ENV, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    assert.deepEqual(new Set(observations.map(row => row.stage)), new Set(['version', 'config', 'acp']));
    for (const row of observations) {
      assert.equal(row.values.CUSTOM_PROVIDER_AUTH, process.env.CUSTOM_PROVIDER_AUTH);
      for (const name of names.slice(0, 5)) assert.equal(row.values[name], undefined, name);
    }
    for (const invalid of ['A=B', 'A B', '']) assert.equal(configSchema.shape.agent.safeParse({ inheritEnvironment: [invalid] }).success, false);
  } finally {
    for (const [name, value] of Object.entries(prior)) if (value === undefined) delete process.env[name]; else process.env[name] = value;
    await rm(root, { recursive: true, force: true });
  }
});

test('agent configuration defaults to OpenCode and keeps source overrides narrow', () => {
  const agent = configSchema.shape.agent.parse({});
  assert.equal(agent.backend, 'opencode'); assert.equal(agent.command, undefined);
  assert.deepEqual(agent.args, ['acp']); assert.equal(agent.model, undefined); assert.equal(agent.effort, undefined);
  assert.equal(agent.runtimeDirectory, '.local/agents');
  assert.throws(() => configSchema.shape.agent.parse({ backend: 'dsh' }), /explicit model/);
  assert.ok(configSchema.shape.agent.parse({ backend: 'dsh', model: 'deepseek/deepseek-flash' }));
  for (const value of [{ backend: 'other' }, { model: '' }, { effort: ' ' }, { args: 'acp' }, { mode: 'build' }]) assert.equal(configSchema.shape.agent.safeParse(value).success, false);
  const source = { id: 'one', name: 'One', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }] };
  assert.equal(configSchema.safeParse({ version: 2, agent: {}, sources: [{ ...source, agent: { backend: 'dsh' } }] }).success, false);
});

for (const kind of ['summary', 'transcript', 'relations'] as const) test(kind + ' generation rejects missing fixed input before starting a probe', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-missing-input-'));
  const runtime = join(root, 'runtime'), agent = config(runtime);
  try {
    for (const value of [undefined, null, [], 'text']) {
      const generate = () => kind === 'summary' ? generateBatch(agent, value as unknown as SummaryInput) : generateTask(agent, kind, value);
      await assert.rejects(generate(), /fixed input.*object/i);
    }
    await assert.rejects(readdir(runtime), { code: 'ENOENT' });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('OpenCode config transport rejects malformed documents and preserves declared precedence', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-opencode-contract-'));
  const prior = process.env.FEEDGARDEN_PEER_CONFIG;
  process.env.FEEDGARDEN_PEER_CONFIG = join(root, 'settings.json');
  try {
    for (const documents of [{}, [null], [{ type: 'document' }], [{ type: 'unknown', info: {} }], [{ type: 'document', info: { model: 7 } }], [{ type: 'document', info: { model: { providerID: 'fixture' } } }], [{ type: 'document', info: { providers: [] } }]]) {
      await writeFile(process.env.FEEDGARDEN_PEER_CONFIG, JSON.stringify({ documents }));
      await assert.rejects(resolveAgent(config(root)), /OpenCode configuration response/i);
    }
    await writeFile(process.env.FEEDGARDEN_PEER_CONFIG, JSON.stringify({ responseText: 'not JSON' }));
    await assert.rejects(resolveAgent(config(root)), /OpenCode configuration response/i);
    await writeFile(process.env.FEEDGARDEN_PEER_CONFIG, JSON.stringify({ documents: [
      { type: 'document', info: { model: 'deepseek/deepseek-flash#high' } },
      { type: 'directory', path: root },
      { type: 'document', info: { model: { providerID: 'fixture', model: 'other', variant: 'low' } } },
    ] }));
    const selected = await resolveAgent(config(root));
    assert.equal(selected.model, 'fixture/other'); assert.equal(selected.effort, 'low');
    for (const announcement of ['not JSON', '{}', '{"url":12}', '{"url":"https://example.test/"}', '{"url":"http://user:password@127.0.0.1:1/"}', '{"url":"http://127.0.0.1:1/api"}', 'x'.repeat(8193)]) {
      await writeFile(process.env.FEEDGARDEN_PEER_CONFIG, JSON.stringify({ announcement }));
      await assert.rejects(resolveAgent(config(root)), /OpenCode configuration server announcement/i);
    }
  } finally {
    if (prior === undefined) delete process.env.FEEDGARDEN_PEER_CONFIG; else process.env.FEEDGARDEN_PEER_CONFIG = prior;
    await rm(root, { recursive: true, force: true });
  }
});

test('OpenCode resolves inherited selections without prompts and pins actual model and effort', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-opencode-resolve-'));
  const prior = { log: process.env.FEEDGARDEN_PEER_LOG, config: process.env.FEEDGARDEN_PEER_CONFIG };
  process.env.FEEDGARDEN_PEER_LOG = join(root, 'requests.ndjson'); process.env.FEEDGARDEN_PEER_CONFIG = join(root, 'settings.json');
  try {
    await writeFile(process.env.FEEDGARDEN_PEER_CONFIG, JSON.stringify({ model: 'deepseek/deepseek-flash', effort: 'high', native: { model: { providerID: 'fixture', model: 'other', variant: 'low' } } }));
    const resolver = createAgentResolver();
    const [first, second] = await Promise.all([resolver(config(root)), resolver(config(root))]);
    assert.equal(first, second); assert.equal(first.model, 'fixture/other'); assert.equal(first.effort, 'low');
    assert.equal(first.execution.version, '2.0.31');
    let requests = (await readFile(process.env.FEEDGARDEN_PEER_LOG, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    assert.equal(requests.filter(row => row.method === 'session/new').length, 1);
    assert.equal(requests.some(row => row.method === 'session/prompt'), false);
    assert.equal(requests.filter(row => row.method === 'session/delete').length, 1);
    assert.equal((await readdir(root)).some(name => name.startsWith('probe-')), false);
    await writeFile(process.env.FEEDGARDEN_PEER_CONFIG, JSON.stringify({ model: 'deepseek/deepseek-flash', effort: 'high', native: { model: 'deepseek/deepseek-flash#high' } }));
    const changed = await createAgentResolver()(config(root));
    assert.notEqual(await taskKey(first, 'transcript', {}), await taskKey(changed, 'transcript', {}));
    await writeFile(process.env.FEEDGARDEN_PEER_CONFIG, JSON.stringify({ native: { model: 'deepseek/deepseek-flash#high', providers: { fixture: { settings: { baseURL: 'http://127.0.0.1/changed' } } } } }));
    const providerChanged = await resolveAgent(config(root));
    assert.equal(providerChanged.model, changed.model); assert.equal(providerChanged.effort, changed.effort);
    assert.notEqual(await taskKey(providerChanged, 'transcript', {}), await taskKey(changed, 'transcript', {}));
    const generated = await generateBatch(first, input);
    assert.deepEqual(generated.execution, first.execution); assert.equal(generated.output.items[0]?.id, 'fixed');
    assert.ok(generated.usage.length);
    assert.notEqual(await taskKey(first, 'transcript', {}), await taskKey({ ...first, backend: 'dsh' }, 'transcript', {}));
  } finally {
    if (prior.log === undefined) delete process.env.FEEDGARDEN_PEER_LOG; else process.env.FEEDGARDEN_PEER_LOG = prior.log;
    if (prior.config === undefined) delete process.env.FEEDGARDEN_PEER_CONFIG; else process.env.FEEDGARDEN_PEER_CONFIG = prior.config;
    await rm(root, { recursive: true, force: true });
  }
});

test('probe cleanup uses advertised deletion support and retains generation sessions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-opencode-probe-cleanup-'));
  const prior = process.env.FEEDGARDEN_PEER_LOG;
  process.env.FEEDGARDEN_PEER_LOG = join(root, 'requests.ndjson');
  try {
    const selected = await resolveAgent(config(root));
    await generateBatch(selected, input);
    await resolveAgent(config(root, { args: ['acp', '--no-delete'] }));
    const requests = (await readFile(process.env.FEEDGARDEN_PEER_LOG, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    assert.equal(requests.filter(row => row.method === 'session/delete').length, 1, 'only the owned supported probe is deleted');
    assert.equal(requests.filter(row => row.method === 'session/close').length, 2, 'generation sessions and older peers are only closed');
  } finally {
    if (prior === undefined) delete process.env.FEEDGARDEN_PEER_LOG; else process.env.FEEDGARDEN_PEER_LOG = prior;
    await rm(root, { recursive: true, force: true });
  }
});

test('OpenCode selects overrides, rejects unsupported or ignored options and requires version constraints', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-opencode-options-'));
  try {
    const selected = await resolveAgent(config(root, { model: 'fixture/other', effort: 'off' }));
    assert.equal(selected.model, 'fixture/other'); assert.equal(selected.effort, 'off');
    await assert.rejects(resolveAgent(config(root, { model: 'missing/model' })), /unsupported/);
    await assert.rejects(resolveAgent(config(root, { effort: 'missing' })), /unsupported/);
    await assert.rejects(resolveAgent(config(root, { model: 'fixture/no-effort', effort: 'high' })), /unsupported/);
    assert.equal((await resolveAgent(config(root, { model: 'fixture/no-effort' }))).effort, undefined);
    await assert.rejects(resolveAgent(config(root, { args: ['acp', '--ignore-selection'] })), /did not select/);
    await assert.rejects(resolveAgent(config(root, { version: 'wrong' })), /Expected OPENCODE wrong/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('OpenCode uses fixed MCP tools for summaries and auxiliary tasks with repair, refusal and timeout handling', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-opencode-tasks-'));
  try {
    const agent = config(root, { args: ['acp', '--repair'] });
    assert.equal((await generateBatch(agent, input)).output.items.length, 1);
    const transcript = await generateTask(agent, 'transcript', { taskId: 'task', parts: [{ id: 'part', text: 'Fixed facts.' }], maxChars: 100 });
    assert.deepEqual(transcript.output, { taskId: 'task', inputIds: ['part'], facts: 'Fixed facts.' });
    const relation = await generateTask(agent, 'relations', { pairs: [{ id: 'pair', texts: ['one', 'two'] }] });
    assert.deepEqual(relation.output, { pairs: [{ id: 'pair', verdict: 'unrelated', reason: '', evidence: ['', ''] }] });
    const policy = JSON.parse(await readFile(join(transcript.directory, '.opencode/opencode.json'), 'utf8'));
    assert.equal(policy.mcp.servers.feedgarden.codemode, false);
    assert.deepEqual(policy.agents.feedgarden.permissions.map((rule: any) => [rule.action, rule.effect]), [['*', 'deny'], ['feedgarden_input', 'allow'], ['feedgarden_result', 'allow']]);
    await assert.rejects(generateBatch(config(root, { args: ['acp', '--refusal'] }), input), /refusal/);
    await assert.rejects(generateBatch(config(root, { args: ['acp', '--timeout'], timeoutSeconds: 0.6 }), input), /timed out|aborted/i);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('OpenCode verifies persisted selections when config acknowledgements contain stale values', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-opencode-readback-'));
  try {
    const agent = await resolveAgent(config(root, { args: ['acp', '--stale-selection'], model: 'fixture/other', effort: 'low' }));
    assert.equal(agent.model, 'fixture/other'); assert.equal(agent.effort, 'low');
    assert.deepEqual((await generateBatch(agent, input)).execution, agent.execution);
    await assert.rejects(resolveAgent(config(root, { args: ['acp', '--ignore-selection'], model: 'fixture/other', effort: 'low' })), /did not select/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('OpenCode waits for direct MCP tool registration and times out before prompting if tools never become ready', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-opencode-ready-'));
  const prior = process.env.FEEDGARDEN_PEER_LOG;
  try {
    assert.equal((await generateBatch(config(root, { args: ['acp', '--slow-tools'] }), input)).output.items.length, 1);
    process.env.FEEDGARDEN_PEER_LOG = join(root, 'never-ready.ndjson');
    const selected = await resolveAgent(config(root, { args: ['acp', '--never-ready'] }));
    await assert.rejects(generateBatch({ ...selected, timeoutSeconds: 3 }, input), /wait-tools.*aborted|wait-tools.*timed out/i);
    const requests = (await readFile(process.env.FEEDGARDEN_PEER_LOG, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    assert.equal(requests.some(row => row.method === 'session/prompt'), false);
  } finally {
    if (prior === undefined) delete process.env.FEEDGARDEN_PEER_LOG; else process.env.FEEDGARDEN_PEER_LOG = prior;
    await rm(root, { recursive: true, force: true });
  }
});

test('Windows resolves the npm OpenCode launcher to its executable without a shell', { skip: process.platform !== 'win32' }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-opencode-shim-'));
  try {
    await mkdir(join(root, 'node_modules/@opencode/cli/bin'), { recursive: true });
    const executable = join(root, 'node_modules/@opencode/cli/bin/opencode.exe');
    await writeFile(executable, 'fixture'); await writeFile(join(root, 'opencode.cmd'), '"%dp0%\\node_modules\\@opencode\\cli\\bin\\opencode.exe" %*');
    assert.deepEqual(agentCommand('opencode', ['acp', 'a b', '&'], { PATH: root }), [executable, ['acp', 'a b', '&']]);
    assert.deepEqual(agentCommand(join(root, 'opencode.cmd'), ['acp']), [executable, ['acp']]);
    assert.deepEqual(agentCommand(peer, ['acp']), [process.execPath, [peer, 'acp']]);
    assert.throws(() => agentCommand(join(root, 'missing.exe'), []), /does not exist/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('Windows resolves literal npm, pnpm and PowerShell shim targets without interpreting shell commands', { skip: process.platform !== 'win32' }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-shim-paths-'));
  try {
    const native = join(root, 'store with spaces', 'opencode.exe'), script = join(root, 'store with spaces', 'cli.cjs');
    await mkdir(join(root, 'store with spaces')); await writeFile(native, 'fixture'); await writeFile(script, 'fixture');
    const cmd = join(root, 'opencode.cmd'), ps = join(root, 'opencode.ps1');
    await writeFile(cmd, '@echo off\n"%~dp0store with spaces\\opencode.exe" %*\n');
    assert.deepEqual(agentCommand('opencode', ['a b', '&'], { PATH: root }), [native, ['a b', '&']]);
    await writeFile(ps, '& "$basedir/store with spaces/opencode.exe" $args\n');
    assert.deepEqual(agentCommand(ps, ['acp']), [native, ['acp']]);
    await writeFile(cmd, '"%~dp0node.exe" "%~dp0store with spaces\\cli.cjs" %*\n');
    assert.deepEqual(agentCommand(cmd, ['acp']), [process.execPath, [script, 'acp']]);
    await writeFile(cmd, '"%UNKNOWN%\\opencode.exe" %*\n');
    assert.throws(() => agentCommand(cmd, []), /MANUAL_ACTION.*shim/);
    await writeFile(cmd, '"%~dp0missing.exe" %*\n');
    assert.throws(() => agentCommand(cmd, []), /MANUAL_ACTION.*shim/);
    await writeFile(cmd, '"%~dp0store with spaces\\opencode.exe" --extra %*\n');
    assert.throws(() => agentCommand(cmd, []), /MANUAL_ACTION.*shim/);
    await writeFile(cmd, 'node --require "%~dp0loader.cjs" "%~dp0store with spaces\\cli.cjs" %*\n');
    assert.throws(() => agentCommand(cmd, []), /MANUAL_ACTION.*shim/);
    await writeFile(cmd, 'SET NODE_OPTIONS=--require loader.cjs\nnode "%~dp0store with spaces\\cli.cjs" %*\n');
    assert.throws(() => agentCommand(cmd, []), /MANUAL_ACTION.*shim/);
  } finally { await rm(root, { recursive: true, force: true }); }
});


test('doctor reports the resolved backend without generation prompts or model-call accounting', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-doctor-agent-'));
  const file = join(root, 'config.json');
  try {
    const configuration = { version: 2, storage: { directory: root, database: join(root, 'data.sqlite') }, feed: { directory: join(root, 'content'), topics: resolve('config/topics.json') },
      agent: config(root), sources: [{ id: 'one', name: 'One', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }] }] };
    await writeFile(file, JSON.stringify(configuration));
    const { stdout } = await promisify(execFile)(process.execPath, ['--import', 'tsx', resolve('src/cli.ts'), 'doctor', '--config', file], { timeout: 30000 });
    const output = JSON.parse(stdout);
    assert.deepEqual(output.agent, { backend: 'opencode', version: '2.0.31', model: 'deepseek/deepseek-flash', effort: 'high' });
    const store = new Store(configuration.storage.database);
    try { assert.equal((store.db.prepare('SELECT count(*) n FROM agent_calls').get() as { n: number }).n, 0); }
    finally { store.close(); }
  } finally { await rm(root, { recursive: true, force: true }); }
});
