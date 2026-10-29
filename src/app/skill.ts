import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { InstanceContext } from '../instance/index.js';

import { FdgError } from '../contracts/errors.js';
import { atomicWrite } from '../platform/files.js';
import { fileDigest, hash } from '../platform/hash.js';
import { packageVersion, resource } from '../platform/resources.js';
import { invocation, pinRuntime, stableRuntime } from '../runs/index.js';
export async function installSkill(config: InstanceContext, directory: string) {
  if (!directory) throw new FdgError('BAD_INPUT', 'An explicit Skill directory is required');
  const destination = resolve(directory),
    body = await readFile(resource('operator', 'SKILL.md'), 'utf8'),
    runtime = await stableRuntime(config);
  if (existsSync(join(destination, 'SKILL.md')) && !existsSync(join(destination, 'invocation.json')))
    throw new FdgError('PATH_CONFLICT', 'Destination contains an unmanaged Skill');
  if (existsSync(join(destination, 'invocation.json'))) {
    const previous = JSON.parse(await readFile(join(destination, 'invocation.json'), 'utf8'));
    if (
      previous.package !== 'feedgarden' ||
      previous.skillHash !== hash(await readFile(join(destination, 'SKILL.md'), 'utf8'))
    )
      throw new FdgError('PATH_CONFLICT', 'Installed Skill was edited or is not owned by Feedgarden');
  }
  await mkdir(destination, { recursive: true });
  await pinRuntime(runtime);
  await atomicWrite(join(destination, 'SKILL.md'), body);
  const runtimeRoot = resolve(dirname(runtime.entry), '../..'),
    runtimeManifest = JSON.parse(await readFile(join(runtimeRoot, 'receipt.json'), 'utf8'));
  const receipt = {
    package: 'feedgarden',
    packageVersion,
    skillHash: hash(body),
    entryHash: hash(await readFile(runtime.entry, 'utf8')),
    nodeHash: await fileDigest(runtime.executable),
    runtimeFingerprint: runtimeManifest.fingerprint,
    instanceId: config.instanceId,
    executable: runtime.executable,
    argv: invocation(config, runtime.entry, []),
  };
  await atomicWrite(join(destination, 'invocation.json'), JSON.stringify(receipt, null, 2));
  return { directory: destination, receipt };
}
export async function skillStatus(directory: string) {
  if (!directory) throw new FdgError('BAD_INPUT', 'An explicit Skill directory is required');
  const receipt = JSON.parse(await readFile(join(resolve(directory), 'invocation.json'), 'utf8'));
  let verified = false;
  try {
    const root = resolve(dirname(receipt.argv[0]), '../..'),
      manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')),
      runtime = JSON.parse(await readFile(join(root, 'receipt.json'), 'utf8'));
    verified =
      receipt.package === 'feedgarden' &&
      manifest.name === receipt.package &&
      manifest.version === receipt.packageVersion &&
      runtime.package === receipt.package &&
      runtime.packageVersion === receipt.packageVersion &&
      runtime.fingerprint === receipt.runtimeFingerprint &&
      receipt.skillHash === hash(await readFile(join(resolve(directory), 'SKILL.md'), 'utf8')) &&
      receipt.entryHash === hash(await readFile(receipt.argv[0], 'utf8')) &&
      receipt.nodeHash === (await fileDigest(receipt.executable));
  } catch {
    verified = false;
  }
  return { directory: resolve(directory), verified, receipt };
}
