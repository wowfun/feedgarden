import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { configSchema } from '../src/config.js';
import { generateBatch } from '../src/agent.js';

test('cancellation terminates the OpenCode peer and its live MCP subprocess', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-mcp-cancel-'));
  const agent = configSchema.shape.agent.parse({ command: resolve('tests/fixtures/acp-peer.mjs'), args: ['acp', '--hold-mcp'], runtimeDirectory: root, timeoutSeconds: 10 });
  const cancellation = new AbortController(), reason = new Error('Lost lease with a live MCP tool server');
  let pid: number | undefined;
  const pending = generateBatch(agent, { contractVersion: 2, topics: { version: 1, topics: [] }, items: [] }, undefined, root, cancellation.signal).catch(error => error);
  try {
    const deadline = Date.now() + 10000;
    while (!await stat(join(root, 'mcp-pid')).catch(() => undefined)) { assert.ok(Date.now() < deadline); await new Promise(done => setTimeout(done, 20)); }
    pid = Number(await readFile(join(root, 'mcp-pid'), 'utf8'));
    cancellation.abort(reason); assert.equal(await pending, reason);
    let live = true;
    while (live && Date.now() < deadline) { try { process.kill(pid, 0); await new Promise(done => setTimeout(done, 20)); } catch { live = false; } }
    assert.equal(live, false, 'MCP subprocess must exit with its cancelled parent');
  } finally {
    cancellation.abort(reason); await pending;
    if (pid) try { process.kill(pid, 'SIGKILL'); } catch { /* Already stopped. */ }
    await rm(root, { recursive: true, force: true });
  }
});
