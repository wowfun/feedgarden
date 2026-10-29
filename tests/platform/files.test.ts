import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { atomicWrite } from '../../src/platform/files.js';

test('failed atomic replacement removes its temporary file and preserves the destination', async () => {
  const root=await mkdtemp(join(tmpdir(),'fdg-atomic-'));
  try {
    await mkdir(join(root,'destination'));
    await assert.rejects(atomicWrite(join(root,'destination'),'must not replace a directory'));
    assert.deepEqual(await readdir(root),['destination']);
  } finally { await rm(root,{recursive:true,force:true}); }
});
