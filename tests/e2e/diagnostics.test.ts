import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { Diagnostics } from '../../src/app/diagnostics.js';

test('diagnostics redact secrets and URL credentials split across writes and flush logs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-log-')), file = join(root, 'run.log'), output: string[] = [];
  const key = 'FDG_TEST_SPLIT_API_KEY', prior = process.env[key];
  process.env[key] = 'fixture-secret-123';
  try {
    const sink = new Diagnostics(text => output.push(text), () => file);
    const bytes = Buffer.from('中文 fixture-secret-123 https://user:pass@example.test/path\ntrailing fixture-secret-123');
    for (let i = 0; i < bytes.length; i += 2) sink.write(bytes.subarray(i, i + 2));
    await sink.flush();
    const result = output.join('');
    assert.equal(result, '中文 [REDACTED] https://[REDACTED]@example.test/path\ntrailing [REDACTED]\n');
    assert.equal(await readFile(file, 'utf8'), result);
  } finally { if (prior === undefined) delete process.env[key]; else process.env[key] = prior; await rm(root, { recursive: true, force: true }); }
});
