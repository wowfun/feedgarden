import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { agentCommand } from '../src/process-command.js';

const peer = resolve('tests/fixtures/acp-peer.mjs');

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
