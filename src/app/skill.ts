import { existsSync } from 'node:fs';
import { copyFile, lstat, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { InstanceContext } from '../instance/index.js';

import { FdgError } from '../contracts/errors.js';
import { atomicWrite } from '../platform/files.js';
import { fileDigest, hash } from '../platform/hash.js';
import { packageRoot, packageVersion } from '../platform/resources.js';
import { invocation, pinRuntime, stableRuntime } from '../runs/index.js';

async function skillFiles(directory: string): Promise<Record<string, string>> {
  const files: Record<string, string> = Object.create(null);
  async function walk(root: string, prefix = ''): Promise<void> {
    const stat = await lstat(root);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new FdgError('UNSAFE_PATH', 'Skill directory must not be a symlink');
    for (const name of (await readdir(root)).sort()) {
      if (!prefix && name === 'invocation.json') continue;
      const path = join(root, name), key = prefix + name, entry = await lstat(path);
      if (entry.isSymbolicLink()) throw new FdgError('UNSAFE_PATH', 'Skill resources must not be symlinks');
      if (entry.isDirectory()) await walk(path, key + '/');
      else if (entry.isFile()) files[key] = await fileDigest(path);
      else throw new FdgError('UNSAFE_PATH', 'Skill resources must be ordinary files');
    }
  }
  await walk(directory);
  return files;
}

export async function installSkill(config: InstanceContext, directory: string) {
  if (!directory) throw new FdgError('BAD_INPUT', 'An explicit Skill directory is required');
  const destination = resolve(directory),
    source = join(packageRoot, 'skills/feedgarden'),
    files = await skillFiles(source);
  const existing = existsSync(destination) ? await skillFiles(destination) : {};
  if (Object.keys(existing).length && !existsSync(join(destination, 'invocation.json')))
    throw new FdgError('PATH_CONFLICT', 'Destination contains unmanaged Skill resources');
  if (existsSync(join(destination, 'invocation.json'))) {
    const previous = JSON.parse(await readFile(join(destination, 'invocation.json'), 'utf8'));
    if (previous.package === 'feedgarden' && !previous.files)
      throw new FdgError('PATH_CONFLICT', 'Installed Skill receipt has no resource manifest; reinstall into an empty directory');
    if (
      previous.package !== 'feedgarden' ||
      !previous.files || typeof previous.files !== 'object' || Array.isArray(previous.files) ||
      hash(previous.files) !== hash(existing)
    )
      throw new FdgError('PATH_CONFLICT', 'Installed Skill was edited or is not owned by Feedgarden');
  }
  const runtime = await stableRuntime(config);
  await mkdir(destination, { recursive: true });
  await pinRuntime(runtime);
  for (const name of Object.keys(files)) {
    await mkdir(dirname(join(destination, name)), { recursive: true });
    await copyFile(join(source, name), join(destination, name));
  }
  // Only previously verified managed resources can be removed on upgrade.
  for (const name of Object.keys(existing)) if (!(name in files)) await rm(join(destination, name));
  const runtimeRoot = resolve(dirname(runtime.entry), '../..'),
    runtimeManifest = JSON.parse(await readFile(join(runtimeRoot, 'receipt.json'), 'utf8'));
  const receipt = {
    package: 'feedgarden',
    packageVersion,
    files,
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
      runtime = JSON.parse(await readFile(join(root, 'receipt.json'), 'utf8')),
      expected = await skillFiles(join(root, 'skills/feedgarden'));
    verified =
      receipt.package === 'feedgarden' &&
      manifest.name === receipt.package &&
      manifest.version === receipt.packageVersion &&
      runtime.package === receipt.package &&
      runtime.packageVersion === receipt.packageVersion &&
      runtime.fingerprint === receipt.runtimeFingerprint &&
      hash(receipt.files) === hash(expected) &&
      hash(receipt.files) === hash(await skillFiles(resolve(directory))) &&
      receipt.entryHash === hash(await readFile(receipt.argv[0], 'utf8')) &&
      receipt.nodeHash === (await fileDigest(receipt.executable));
  } catch {
    verified = false;
  }
  return { directory: resolve(directory), verified, receipt };
}
