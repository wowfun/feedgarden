#!/usr/bin/env node
import { parse } from 'jsonc-parser';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { acknowledgeWorker } from './storage/worker.js';
// Handshake before loading parsers and model adapters: first-use OS scanning can
// delay a large dependency graph. This bootstrap has no network or paid work.
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { config: { type: 'string' }, 'data-dir': { type: 'string' } },
});
const [, id, token] = positionals;
if (!id || !token || !values.config || !values['data-dir']) throw new Error('Invalid worker launch');
const config = parse(readFileSync(values.config, 'utf8'));
acknowledgeWorker(join(values['data-dir'], 'feedgarden.sqlite'), { id, token, instanceId: config.instanceId, pid: process.pid }, pid => { try { process.kill(pid, 0); return true; } catch { return false; } });
await import('./cli.js');
