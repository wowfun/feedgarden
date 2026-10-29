import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, realpath, rename, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import type { InstanceContext } from '../instance/index.js';
import { packageRoot, packageVersion } from '../platform/resources.js';

import { FdgError } from '../contracts/errors.js';
import { atomicWrite } from '../platform/files.js';
import { fileDigest, hash } from '../platform/hash.js';
import { completeArtifact, holdArtifact, markArtifact, pinArtifact, pruneArtifacts } from '../platform/retention.js';
async function treeHashes(root: string, prefix = ''): Promise<[string, string][]> {
  const result: [string, string][] = [];
  for (const item of (await readdir(join(root, prefix), { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const path = join(prefix, item.name);
    if (item.isDirectory()) result.push(...(await treeHashes(root, path)));
    else if (item.isFile()) result.push([path, await fileDigest(join(root, path))]);
    else throw new FdgError('RUNTIME_INVALID', 'Runtime resources contain a special file');
  }
  return result;
}
/** Resolve production dependencies from the installed layout, including npm hoisting. */
async function dependencies() {
  const packages: { source: string; path: string; manifest: string }[] = [],
    hoisted = new Map<string, string>();
  const rootManifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8')),
    rootRequire = createRequire(join(packageRoot, 'package.json'));
  for (const name of Object.keys(rootManifest.dependencies ?? {})) {
    const found = rootRequire.resolve
      .paths(name + '/package.json')
      ?.map((base) => join(base, name))
      .find((base) => existsSync(join(base, 'package.json')));
    if (!found) throw new FdgError('RUNTIME_INVALID', 'Missing dependency ' + name);
    hoisted.set(name, await realpath(found));
  }
  const copied = new Set<string>();
  const visit = async (source: string, path: string, ancestors: Map<string, string>): Promise<void> => {
    const manifest = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
    const names = new Set([
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.optionalDependencies ?? {}),
      ...Object.keys(manifest.peerDependencies ?? {}),
    ]);
    const require = createRequire(join(source, 'package.json'));
    for (const name of names) {
      const found = require.resolve
        .paths(name + '/package.json')
        ?.map((base) => join(base, name))
        .find((base) => existsSync(join(base, 'package.json')));
      if (!found) {
        if (manifest.dependencies?.[name] && !manifest.optionalDependencies?.[name])
          throw new FdgError('RUNTIME_INVALID', 'Missing dependency ' + name);
        continue;
      }
      const resolved = await realpath(found);
      if (ancestors.get(name) === resolved) continue;
      const previous = hoisted.get(name);
      const destination =
        previous && previous !== resolved ? join(path, 'node_modules', name) : join('node_modules', name);
      if (copied.has(destination)) continue;
      copied.add(destination);
      if (!previous) hoisted.set(name, resolved);
      packages.push({
        source: resolved,
        path: destination,
        manifest: await readFile(join(resolved, 'package.json'), 'utf8'),
      });
      await visit(resolved, destination, new Map([...ancestors, [name, resolved]]));
    }
  };
  await visit(packageRoot, '', new Map());
  return packages;
}
type Runtime = { executable: string; entry: string };
const runtimes = new Map<string, Promise<Runtime>>();
export function preparedRuntime(config: InstanceContext): Promise<Runtime> | undefined {
  return runtimes.get(resolve(config.paths.runtime));
}
export async function stableRuntime(config: InstanceContext): Promise<Runtime> {
  const key = resolve(config.paths.runtime);
  let pending = runtimes.get(key);
  if (!pending) {
    pending = prepareRuntime(config).catch(error => { runtimes.delete(key); throw error; });
    runtimes.set(key, pending);
  }
  const runtime = await pending;
  await registerRuntimeUser(runtime);
  return runtime;
}
export async function registerRuntimeUser(runtime: Runtime, pid = process.pid) {
  await holdArtifact(resolve(dirname(runtime.entry), '../..'), pid);
}
export async function pinRuntime(runtime: Runtime) {
  await pinArtifact(resolve(dirname(runtime.entry), '../..'));
}
async function prepareRuntime(config: InstanceContext): Promise<Runtime> {
  if (!existsSync(join(packageRoot, 'dist/src/cli.js')))
    throw new FdgError(
      'BUILD_REQUIRED',
      'Build the package before creating workers, schedules or installing a Skill',
    );
  // A scheduled command or worker already runs from this immutable owned copy.
  // Reuse its receipt instead of hashing and copying the same graph on every tick.
  if (resolve(dirname(packageRoot)) === resolve(config.paths.runtime)) {
    const receipt = JSON.parse(await readFile(join(packageRoot, 'receipt.json'), 'utf8'));
    if (receipt.package === 'feedgarden' && receipt.packageVersion === packageVersion)
      return { executable: process.execPath, entry: join(packageRoot, 'dist/src/cli.js') };
  }
  const packages = await dependencies();
  const fingerprint = hash([
    await readFile(join(packageRoot, 'package.json'), 'utf8'),
    await treeHashes(join(packageRoot, 'dist/src')),
    await treeHashes(join(packageRoot, 'resources')),
    packages.map((p) => [p.path, p.manifest]),
  ]);
  const directory = join(
    config.paths.runtime,
    packageVersion + '-' + fingerprint.slice(0, 16),
  ),
    entry = join(directory, 'dist/src/cli.js');
  if (!existsSync(join(directory, 'receipt.json'))) {
    const temporary = directory + '.' + randomUUID();
    await mkdir(temporary, { recursive: true, mode: 0o700 });
    await markArtifact(temporary, 'runtime', config.instanceId);
    try {
      for (const name of ['package.json', 'dist/src', 'resources'])
        await cp(join(packageRoot, name), join(temporary, name), { recursive: true, dereference: true });
      // A parent copy must finish before copying packages into its node_modules.
      // Otherwise fs.cp can race mkdir against a nested dependency copy on Windows.
      const depths = [
        ...new Set(
          packages.map(
            (dependency) => dependency.path.split(/[\\/]/).filter((part) => part === 'node_modules').length,
          ),
        ),
      ].sort((a, b) => a - b);
      for (const depth of depths) {
        const level = packages.filter(
          (dependency) =>
            dependency.path.split(/[\\/]/).filter((part) => part === 'node_modules').length === depth,
        );
        for (let offset = 0; offset < level.length; offset += 8)
          await Promise.all(
            level
              .slice(offset, offset + 8)
              .map((dependency) =>
                cp(dependency.source, join(temporary, dependency.path), {
                  recursive: true,
                  dereference: true,
                  filter: (path) =>
                    !path.slice(dependency.source.length).split(/[\\/]/).includes('node_modules'),
                }),
              ),
          );
      }
      await atomicWrite(
        join(temporary, 'receipt.json'),
        JSON.stringify({
          package: 'feedgarden',
          packageVersion,
          fingerprint,
          node: process.execPath,
          dependencies: packages.map((p) => p.path),
        }),
      );
      try {
        await rename(temporary, directory);
      } catch (error) {
        if (!existsSync(join(directory, 'receipt.json'))) throw error;
      }
    } finally {
      if (dirname(resolve(temporary)) !== resolve(config.paths.runtime)) throw new FdgError('UNSAFE_PATH', 'Runtime temporary path escaped its root');
      await rm(temporary, { recursive: true, force: true });
    }
    await completeArtifact(directory);
  }
  await holdArtifact(directory);
  await pruneArtifacts(config.paths.runtime, 'runtime', config.instanceId, 2, 30);
  return { executable: process.execPath, entry };
}
export function invocation(config: InstanceContext, entry: string, args: string[]): string[] {
  const paths = config.paths;
  return [entry, '--config', paths.configFile, '--data-dir', paths.dataDir, ...args];
}
