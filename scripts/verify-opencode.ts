import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, writeFile, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { configSchema } from '../src/config.js';
import { generateBatch, generateTask, resolveAgent, type SummaryInput } from '../src/agent.js';
import { validationEnvironment } from '../src/build-site.js';
import { validationDirectory } from './validation-paths.js';
import { parseArgs } from 'node:util';
import Database from 'better-sqlite3';
const { values } = parseArgs({ options: { command: { type: 'string' }, 'mcp-delay-ms': { type: 'string', default: '7000' } } });
const mcpDelayMs = Number(values['mcp-delay-ms']);
if (!Number.isSafeInteger(mcpDelayMs) || mcpDelayMs < 0 || mcpDelayMs > 30000) throw new Error('--mcp-delay-ms must be an integer from 0 to 30000');

const root = await mkdtemp(join(tmpdir(), 'feedgarden-opencode-native-'));
const inherited = { ...process.env };
const requests: { model: string; tools: string[]; rejected: boolean }[] = [];
let artifact: unknown;
let succeeded = false;
const forbidden = join(root, 'forbidden.txt');
const delayLog = join(root, 'mcp-starts.ndjson');
const server = createServer(async (request, response) => {
  try {
    let raw = ''; for await (const part of request) raw += part;
    const body = JSON.parse(raw);
    const starts = (await readFile(delayLog, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    assert.equal(starts.at(-1).stage, 'ready', 'MCP startup must settle before model submission');
    const names: string[] = (body.tools ?? []).map((tool: any) => tool.function.name);
    assert.deepEqual([...names].sort(), ['feedgarden_input', 'feedgarden_result']);
    const messages: any[] = body.messages;
    const previous = messages.flatMap(message => message.tool_calls ?? []);
    const has = (name: string) => previous.some(call => call.function.name === name);
    const rejected = messages.some(message => message.role === 'tool' && /not found|denied|not available|unknown tool|not a valid tool|invalid tool|No tool named/i.test(JSON.stringify(message.content)));
    requests.push({ model: body.model, tools: names, rejected });
    const name = !has('shell') ? 'shell' : !has('feedgarden_input') ? 'feedgarden_input' : !has('feedgarden_result') ? 'feedgarden_result' : undefined;
    const args = name === 'shell' ? { command: 'echo forbidden > "' + forbidden + '"', description: 'Forbidden fixture action' } : name === 'feedgarden_result' ? artifact : {};
    const delta = name ? { tool_calls: [{ index: 0, id: 'call-' + requests.length, type: 'function', function: { name, arguments: JSON.stringify(args) } }] } : { content: 'Completed.' };
    const finish = name ? 'tool_calls' : 'stop';
    if (body.stream) {
      response.writeHead(200, { 'content-type': 'text/event-stream' });
      response.write('data: ' + JSON.stringify({ id: 'fixture', object: 'chat.completion.chunk', created: 1, model: body.model, choices: [{ index: 0, delta, finish_reason: null }] }) + '\n\n');
      response.write('data: ' + JSON.stringify({ id: 'fixture', object: 'chat.completion.chunk', created: 1, model: body.model, choices: [{ index: 0, delta: {}, finish_reason: finish }], usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 } }) + '\n\n');
      response.end('data: [DONE]\n\n');
    } else {
      const message = name ? { role: 'assistant', content: null, tool_calls: [{ id: 'call-' + requests.length, type: 'function', function: { name, arguments: JSON.stringify(args) } }] } : { role: 'assistant', content: 'Completed.' };
      response.setHeader('content-type', 'application/json'); response.end(JSON.stringify({ id: 'fixture', object: 'chat.completion', created: 1, model: body.model, choices: [{ index: 0, message, finish_reason: finish }], usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 } }));
    }
  } catch (error) { response.writeHead(500); response.end(String(error)); }
});
await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
const address = server.address(); assert.ok(address && typeof address !== 'string');
const profile = join(root, 'profile'); await mkdir(profile);
// Delay the actual stdio server, rather than the model, to exercise OpenCode's
// asynchronous MCP registration before the first generation request.
const delayed = join(root, 'delayed-mcp'); await mkdir(delayed);
await writeFile(join(delayed, 'package.json'), JSON.stringify({ name: 'feedgarden-delayed-mcp', type: 'module', exports: { './server': './index.mjs' } }));
await writeFile(join(delayed, 'wrapper.mjs'), `import { appendFileSync } from 'node:fs'; import { setTimeout } from 'node:timers/promises'; import { pathToFileURL } from 'node:url'; const log = stage => appendFileSync(${JSON.stringify(delayLog)}, JSON.stringify({stage, at: Date.now(), directory: process.cwd()}) + '\\n'); log('starting'); await setTimeout(${mcpDelayMs}); log('ready'); const entry = process.argv.splice(2, 1)[0]; await import(pathToFileURL(entry).href);`);
await writeFile(join(delayed, 'index.mjs'), `export default { id: 'feedgarden-delayed-mcp', async setup({ mcp }) { await mcp.transform(editor => editor.update('feedgarden', config => { config.command.splice(1, 0, ${JSON.stringify(join(delayed, 'wrapper.mjs'))}); })); } };`);
const selections = { version: 2, agent: { command: values.command, runtimeDirectory: join(root, 'tasks'), timeoutSeconds: 60 }, sources: [{ id: 'one', name: 'One', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }] }] };
try {
  for (const name of Object.keys(process.env)) delete process.env[name];
  Object.assign(process.env, validationEnvironment(inherited), { PATH: inherited.PATH ?? inherited.Path, HOME: root, USERPROFILE: root, OPENCODE_CONFIG_DIR: profile,
    XDG_DATA_HOME: join(root, 'data'), XDG_STATE_HOME: join(root, 'state'), XDG_CACHE_HOME: join(root, 'cache'), OPENCODE_DISABLE_AUTOUPDATE: 'true' });
  await writeFile(join(profile, 'opencode.json'), JSON.stringify({
    model: 'fixture/mock#low', update: 'disable', plugins: [delayed],
    providers: { fixture: { package: '@opencode-ai/ai/providers/openai-compatible', settings: { baseURL: 'http://127.0.0.1:' + address.port + '/v1', apiKey: 'fixture-only' },
      models: { mock: { name: 'Local fixture', limit: { context: 128000, output: 8000 }, variants: [{ id: 'low' }, { id: 'high' }] } } } },
  }));
  const agent = configSchema.parse(selections).agent;
  const resolved = await resolveAgent(agent);
  assert.equal(requests.length, 0, 'configuration probes must not call the model');
  assert.equal(resolved.model, 'fixture/mock'); assert.equal(resolved.effort, 'low');
  // The OpenCode 2 CLI can omit empty sessions from its listing. Inspect only
  // this isolated profile's database to verify actual probe-state cleanup.
  const state = new Database(join(root, 'data', 'opencode', 'opencode.db'), { readonly: true });
  try { assert.equal((state.prepare('SELECT count(*) n FROM session_v2').get() as { n: number }).n, 0, 'configuration probes must delete their owned native sessions'); }
  finally { state.close(); }
  const input: SummaryInput = { contractVersion: 2, topics: { version: 1, topics: [{ id: 'coding', name: { en: 'Coding', 'zh-CN': '编程' }, description: 'Tools', aliases: [], deprecated: false }] }, items: [{ source: 'one', id: 'a', title: 'Local fixture', text: '' }] };
  artifact = { contractVersion: 2, newTopics: [], items: [{ source: 'one', id: 'a', topics: ['coding'], en: { title: 'Local fixture', summary: '' }, 'zh-CN': { title: '本地测试', summary: '' } }] };
  const batch = await generateBatch(resolved, input);
  assert.deepEqual(batch.output, artifact);
  artifact = { taskId: 'transcript', inputIds: ['part'], facts: 'Fixed facts.' };
  assert.deepEqual((await generateTask(resolved, 'transcript', { taskId: 'transcript', parts: [{ id: 'part', text: 'Fixed facts.' }], maxChars: 100 })).output, artifact);
  artifact = { pairs: [{ id: 'pair', verdict: 'unrelated', reason: '', evidence: ['', ''] }] };
  assert.deepEqual((await generateTask(resolved, 'relations', { pairs: [{ id: 'pair', texts: ['One', 'Two'] }] })).output, artifact);
  assert.equal(await stat(forbidden).catch(() => undefined), undefined);
  assert.ok(requests.some(request => request.rejected), 'a hallucinated forbidden tool must be rejected');
  const evidence = { status: 'passed', execution: resolved.execution, tasks: ['summary', 'transcript', 'relations'], requests, mcpDelayMs, forbiddenToolRejected: true, probeSessionsRetained: 0, paidCalls: 0 };
  await mkdir(validationDirectory, { recursive: true });
  await writeFile(join(validationDirectory, 'opencode-acp.json'), JSON.stringify(evidence, null, 2));
  succeeded = true; console.log(JSON.stringify(evidence));
} catch (error) {
  await mkdir(validationDirectory, { recursive: true });
  await writeFile(join(validationDirectory, 'opencode-acp-failure.json'), JSON.stringify({ root, requests, error: String(error) }, null, 2));
  console.error('Isolated evidence: ' + root); throw error;
} finally {
  for (const name of Object.keys(process.env)) delete process.env[name]; Object.assign(process.env, inherited);
  await new Promise<void>(done => server.close(() => done()));
  if (succeeded) await rm(root, { recursive: true, force: true });
}
