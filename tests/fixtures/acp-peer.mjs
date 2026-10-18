#!/usr/bin/env node
import { createServer } from 'node:http';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { readFileSync, appendFileSync, writeFileSync, existsSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
if (process.env.FEEDGARDEN_PEER_ENV) appendFileSync(process.env.FEEDGARDEN_PEER_ENV, JSON.stringify({ stage: process.argv.includes('--version') ? 'version' : process.argv.includes('serve') ? 'config' : 'acp', values: Object.fromEntries(['TWITTER_AUTH_TOKEN', 'TWITTER_CT0', 'GITHUB_TOKEN', 'FEEDGARDEN_AGENT_API_KEY', 'DEEPSEEK_API_KEY', 'CUSTOM_PROVIDER_AUTH'].map(name => [name, process.env[name]])) }) + '\n');
if (process.argv.includes('--version')) { console.log('opencode v2.0.31'); process.exit(0); }
const settings = process.env.FEEDGARDEN_PEER_CONFIG ? JSON.parse(readFileSync(process.env.FEEDGARDEN_PEER_CONFIG, 'utf8')) : {};
if (process.argv.includes('serve')) {
  const server = createServer((_request, response) => { response.setHeader('content-type', 'application/json'); response.end(settings.responseText ?? JSON.stringify(settings.documents ?? [{ type: 'document', info: settings.native ?? {} }])); });
  server.listen(0, '127.0.0.1', () => console.log(settings.announcement ?? JSON.stringify({ url: 'http://127.0.0.1:' + server.address().port })));
  process.stdin.resume(); process.stdin.on('end', () => server.close());
} else {
const options = [
  { id: 'model', category: 'model', type: 'select', name: 'Model', currentValue: settings.model ?? 'deepseek/deepseek-flash', options: ['deepseek/deepseek-flash', 'fixture/other', 'fixture/no-effort'].map(value => ({ value, name: value })) },
  { id: 'effort', category: 'thought_level', type: 'select', name: 'Effort', currentValue: settings.effort ?? 'high', options: ['default', 'off', 'low', 'high'].map(value => ({ value, name: value })) },
  { id: 'mode', category: 'mode', type: 'select', name: 'Agent', currentValue: 'build', options: [{ value: 'build', name: 'Build' }, { value: 'feedgarden', name: 'Feedgarden' }] },
];
const advertised = () => options.filter(option => option.id !== 'effort' || options[0].currentValue !== 'fixture/no-effort');
const send = value => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...value }) + '\n');
let permission;
let mcp;
let cleanupReady, readyAt = Infinity;
const reader = createInterface({ input: process.stdin });
reader.on('line', async line => {
  const message = JSON.parse(line), { id, method } = message;
  if (process.env.FEEDGARDEN_PEER_LOG && method) appendFileSync(process.env.FEEDGARDEN_PEER_LOG, JSON.stringify({ method, params: message.params }) + '\n');
  if (id === 'permission') { permission?.(message.result.outcome.outcome); return; }
  try {
    if (method === 'initialize') send({ id, result: { protocolVersion: 1, agentCapabilities: { loadSession: true, ...(!process.argv.includes('--no-delete') ? { sessionCapabilities: { delete: {} } } : {}) }, agentInfo: { name: 'OpenCode', version: '2.0.31' } } });
    else if (method === 'session/new') {
      const native = JSON.parse(readFileSync('.opencode/opencode.json', 'utf8'));
      if (!native.mcp && (existsSync('SKILL.md') || existsSync('input.json'))) throw new Error('Probe wrote unused artifact inputs');
      const readiness = native.plugins?.find(entry => entry.options?.marker);
      if (readiness) {
        readyAt = process.argv.includes('--never-ready') ? Infinity : Date.now() + (process.argv.includes('--slow-tools') ? 300 : 0);
        const { default: plugin } = await import(pathToFileURL(join(readiness.package, 'index.mjs')).href);
        cleanupReady = plugin.setup({ options: readiness.options, tool: { list: async () => Date.now() < readyAt ? [] : ['feedgarden_input', 'feedgarden_result'].map(id => ({ id, options: { codemode: false } })) } });
      }
      send({ id, result: { sessionId: 'fixture', configOptions: advertised() } });
    }
    else if (method === 'session/set_config_option') {
      const previous = structuredClone(advertised());
      const option = options.find(option => option.id === message.params.configId);
      if (!process.argv.includes('--ignore-selection')) option.currentValue = message.params.value;
      send({ id, result: { configOptions: process.argv.includes('--stale-selection') ? previous : advertised() } });
    } else if (method === 'session/load') {
      send({ id, result: { configOptions: advertised() } });
    } else if (method === 'session/prompt') {
      if (Date.now() < readyAt) throw new Error('Prompt submitted before direct MCP tools were registered');
      if (process.argv.includes('--timeout')) return;
      const denied = new Promise(done => { permission = done; });
      send({ id: 'permission', method: 'session/request_permission', params: { sessionId: 'fixture', toolCall: { toolCallId: 'shell', title: 'Forbidden shell', kind: 'execute', status: 'pending' }, options: [{ optionId: 'allow', name: 'Allow', kind: 'allow_once' }] } });
      if (await denied !== 'cancelled') throw new Error('Unexpected permission approval');
      const config = JSON.parse(readFileSync('.opencode/opencode.json', 'utf8'));
      const server = config.mcp.servers.feedgarden;
      if (server.codemode !== false) throw new Error('Code Mode was enabled');
      mcp = new Client({ name: 'fixture', version: '1' });
      const transport = new StdioClientTransport({ command: server.command[0], args: server.command.slice(1), stderr: 'pipe' });
      await mcp.connect(transport);
      if (process.argv.includes('--hold-mcp')) { writeFileSync('mcp-pid', String(transport.pid)); return; }
      const listed = await mcp.listTools();
      if (listed.tools.map(tool => tool.name).sort().join(',') !== 'input,result') throw new Error('Unexpected tools');
      const fixed = await mcp.callTool({ name: 'input', arguments: {} });
      const { input } = JSON.parse(fixed.content[0].text);
      const task = server.command[3];
      const artifact = task === 'transcript' ? { taskId: input.taskId, inputIds: input.parts.map(part => part.id), facts: 'Fixed facts.' }
        : task === 'relations' ? { pairs: input.pairs.map(pair => ({ id: pair.id, verdict: 'unrelated', reason: '', evidence: ['', ''] })) }
        : { contractVersion: 2, newTopics: [], items: input.items.map(item => ({ source: item.source, id: item.id, topics: ['coding'], en: { title: item.title, summary: item.text }, 'zh-CN': { title: '中文标题', summary: item.text ? '提供的事实。' : '' } })) };
      if (process.argv.includes('--repair')) {
        const invalid = await mcp.callTool({ name: 'result', arguments: { ...artifact, path: '../outside' } });
        if (!invalid.isError) throw new Error('Invalid draft was accepted');
      }
      const result = await mcp.callTool({ name: 'result', arguments: artifact });
      if (result.isError) throw new Error(JSON.stringify(result));
      await mcp.close(); mcp = undefined;
      send({ method: 'session/update', params: { sessionId: 'fixture', update: { sessionUpdate: 'usage_update', used: 10, size: 100 } } });
      send({ id, result: { stopReason: process.argv.includes('--refusal') ? 'refusal' : 'end_turn' } });
    } else if (method === 'session/close' || method === 'session/delete') { await mcp?.close(); send({ id, result: {} }); }
  } catch (error) { send({ id, error: { code: -32603, message: String(error) } }); }
});
reader.on('close', async () => { await cleanupReady?.(); await mcp?.close(); });

}
