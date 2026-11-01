import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { setup } from '../../src/app/index.js';
import { installSkill, skillStatus } from '../../src/app/skill.js';
import { loadInstance } from '../../src/instance/index.js';
import { fileDigest } from '../../src/platform/hash.js';

test('operator Skill installs its references and verifies the complete owned bundle', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-operator-skill-'));
  try {
    await setup({ workspace: join(root, 'instance') });
    const { config } = loadInstance({ workspace: join(root, 'instance') });
    const destination = join(root, 'installed');
    const installed = await installSkill(config, destination);
    for (const name of ['SKILL.md', 'references/first-use.md', 'references/problem-solutions.md']) {
      assert.ok(installed.receipt.files[name]);
      assert.deepEqual(await readFile(join(destination, name)), await readFile(join('skills/feedgarden', name)));
    }
    assert.equal((await skillStatus(destination)).verified, true);
    const unmanaged = join(destination, '__proto__');
    await writeFile(unmanaged, 'Unmanaged local file');
    assert.equal((await skillStatus(destination)).verified, false);
    await assert.rejects(installSkill(config, destination), /edited|not owned/);
    assert.equal(await readFile(unmanaged, 'utf8'), 'Unmanaged local file');
    await rm(unmanaged);
    const reference = join(destination, 'references/first-use.md'), original = await readFile(reference);
    await writeFile(reference, 'Changed locally');
    assert.equal((await skillStatus(destination)).verified, false);
    await assert.rejects(installSkill(config, destination), /edited|not owned/);
    assert.equal(await readFile(reference, 'utf8'), 'Changed locally');
    await writeFile(reference, original);
    await installSkill(config, destination);
    assert.equal((await skillStatus(destination)).verified, true);
    await rm(reference);
    assert.equal((await skillStatus(destination)).verified, false);
    await writeFile(reference, original);
    const receiptPath = join(destination, 'invocation.json');
    const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
    const obsolete = join(destination, 'references/obsolete.md');
    await writeFile(obsolete, 'Previously installed resource');
    receipt.files['references/obsolete.md'] = await fileDigest(obsolete);
    receipt.files = Object.fromEntries(Object.keys(receipt.files).sort().map(name => [name, receipt.files[name]]));
    await writeFile(receiptPath, JSON.stringify(receipt));
    await installSkill(config, destination);
    await assert.rejects(readFile(obsolete), { code: 'ENOENT' });
    assert.deepEqual(await readFile(reference), original);
    assert.equal((await skillStatus(destination)).verified, true);
    delete receipt.files;
    await writeFile(receiptPath, JSON.stringify(receipt));
    assert.equal((await skillStatus(destination)).verified, false);
    await assert.rejects(installSkill(config, destination), /no resource manifest.*empty directory/);
    const unowned = join(root, 'unowned');
    await mkdir(unowned);
    await writeFile(join(unowned, 'notes.md'), 'Keep my notes');
    await assert.rejects(installSkill(config, unowned), /unmanaged/);
    assert.equal(await readFile(join(unowned, 'notes.md'), 'utf8'), 'Keep my notes');
    const linkedRoot = join(root, 'linked-root');
    await symlink(unowned, linkedRoot, 'junction');
    await assert.rejects(installSkill(config, linkedRoot), { code: 'UNSAFE_PATH' });
    const linkedResource = join(root, 'linked-resource');
    await mkdir(linkedResource);
    await symlink(unowned, join(linkedResource, 'references'), 'junction');
    await assert.rejects(installSkill(config, linkedResource), { code: 'UNSAFE_PATH' });
    assert.equal(await readFile(join(unowned, 'notes.md'), 'utf8'), 'Keep my notes');
  } finally { await rm(root, { recursive: true, force: true }); }
});
