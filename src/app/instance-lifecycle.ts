import { parse } from 'jsonc-parser';
import { DateTime } from 'luxon';
import { randomUUID } from 'node:crypto';
import { existsSync, renameSync } from 'node:fs';
import { copyFile, lstat, mkdir, readFile, readdir } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { configSchema } from '../contracts/configuration.js';
import { FdgError } from '../contracts/errors.js';
import { createInstanceContext, editJsonc, instancePaths, readConfig, renameJsoncProperty, type Selection } from '../instance/index.js';
import { atomicWrite } from '../platform/files.js';
import { hash } from '../platform/hash.js';
import { runnerLock } from '../platform/lock.js';
import { resource } from '../platform/resources.js';
import { initializeInstance, migrateInstance, openDatabase } from '../storage/index.js';

export async function setup(selection: Selection, options: { timezone?: string; model?: string } = {}) {
  const paths = instancePaths(selection);
  if (existsSync(paths.configFile) || existsSync(join(paths.dataDir, 'feedgarden.sqlite')))
    throw new FdgError('ALREADY_INITIALIZED', 'Setup creates new instances only');
  const templates = JSON.parse(await readFile(resource('subscriptions.json'), 'utf8'));
  const config = configSchema.parse({
    version: 3,
    instanceId: randomUUID(),
    timezone: options.timezone,
    agent: { model: options.model },
    storage: selection.dataDir ? { dataDir: paths.dataDir } : {},
    sources: templates.filter((s: { id: string }) =>
      ['hackernews', 'openai', 'anthropic', 'github'].includes(s.id),
    ),
  });
  config.feed = {
    directory: join(paths.dataDir, 'exports', 'core'),
    topics: join(paths.dataDir, 'topics.json'),
  };
  await mkdir(paths.configDir, { recursive: true, mode: 0o700 });
  for (const path of [paths.dataDir, paths.stateDir, paths.cacheDir]) {
    await mkdir(path, { recursive: true, mode: 0o700 });
    await atomicWrite(join(path, '.gitignore'), '*\n');
  }
  const store = openDatabase(join(paths.dataDir, 'feedgarden.sqlite'));
  try {
    initializeInstance(store, config);
    store.setMeta(
      'cutoff',
      DateTime.now().setZone(config.timezone).startOf('day').minus({ days: 7 }).toUTC().toISO()!,
    );
  } finally {
    store.close();
  }
  await copyFile(resource('topics.json'), join(paths.dataDir, 'topics.json'));
  await atomicWrite(
    join(paths.configDir, 'feedgarden.schema.v3.json'),
    await readFile(resource('schemas/feedgarden.v3.json'), 'utf8'),
  );
  await atomicWrite(
    paths.configFile,
    JSON.stringify({ ...config, $schema: './feedgarden.schema.v3.json' }, null, 2) + '\n',
  );
  return { instanceId: config.instanceId, ...paths };
}
export async function editConfig(file: string, path: (string | number)[], value: unknown): Promise<void> {
  const release = await runnerLock(file + '.edit', new AbortController());
  try {
    const input = await readFile(file, 'utf8'),
      output = editJsonc(input, path, value);
    configSchema.parse(parse(output));
    await atomicWrite(file, output);
  } finally {
    await release();
  }
}
async function copyVerified(from: string, to: string): Promise<void> {
  const stat = await lstat(from);
  if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile()))
    throw new FdgError('UNSAFE_PATH', 'Upgrade refuses special files: ' + from);
  if (stat.isDirectory()) {
    await mkdir(to, { recursive: true, mode: 0o700 });
    for (const name of await readdir(from)) await copyVerified(join(from, name), join(to, name));
  } else {
    await mkdir(dirname(to), { recursive: true, mode: 0o700 });
    await copyFile(from, to);
    if (hash(await readFile(from)) !== hash(await readFile(to)))
      throw new FdgError('COPY_VERIFICATION_FAILED', from);
  }
}
export async function upgrade(selection: Selection, options: { dryRun?: boolean; legacyBase?: string } = {}) {
  const { migrateRecipes } = await import('./upgrade/recipes.js'),
    { importArchives } = await import('../content/index.js');
  if (!selection.workspace && !selection.config)
    throw new FdgError('BAD_INPUT', 'Upgrade requires an explicit workspace or config');
  const paths = instancePaths(selection),
    old = readConfig(paths.configFile) as any;
  if (old.version !== 2) throw new FdgError('BAD_INPUT', 'Upgrade expects configuration version 2');
  const base = resolve(options.legacyBase ?? paths.configDir),
    oldRoot = resolve(base, old.storage?.root ?? '.local/feedgarden');
  const mapping = [
    [join(oldRoot, 'data', 'feedgarden.sqlite'), join(paths.dataDir, 'feedgarden.sqlite')],
    [join(oldRoot, 'workspaces'), join(paths.dataDir, 'workspaces')],
    [join(oldRoot, 'backups'), join(paths.dataDir, 'backups')],
    [join(oldRoot, 'tools'), join(paths.dataDir, 'tools')],
    [join(oldRoot, 'state'), join(paths.dataDir, 'recovery')],
    [join(oldRoot, 'scheduler', 'runner.env'), join(paths.dataDir, 'secrets', 'runner.env')],
  ] as [string, string][];
  for (const [from, to] of mapping) {
    const rel = relative(from, to);
    if (rel && !rel.startsWith('..') && !isAbsolute(rel))
      throw new FdgError('UNSAFE_PATH', 'Upgrade destination must not be inside its source: ' + to);
  }
  if (options.dryRun) return { paths, oldRoot, mapping };
  const cancellation = new AbortController(),
    release = await runnerLock(join(oldRoot, 'state', 'runner'), cancellation);
  const maintenance = await runnerLock(join(paths.dataDir, 'maintenance'), cancellation).catch(async (e) => {
    await release();
    throw e;
  });
  try {
    const journalPath = join(paths.dataDir, 'recovery', 'upgrade.json');
    const journal = existsSync(journalPath)
      ? JSON.parse(await readFile(journalPath, 'utf8'))
      : { instanceId: randomUUID(), configHash: hash(old), oldRoot, complete: false };
    if (journal.configHash !== hash(old) || journal.oldRoot !== oldRoot)
      throw new FdgError('UPGRADE_CONFLICT', 'Upgrade journal belongs to another configuration');
    await atomicWrite(journalPath, JSON.stringify(journal));
    const originalBackup = join(paths.dataDir, 'backups', 'upgrade', 'original.sqlite');
    const legacy = openDatabase(existsSync(originalBackup) ? originalBackup : mapping[0]![0], {
      readonly: true,
    });
    try {
      const lease = legacy.maintenance.activeLease(new Date().toISOString());
      if (lease) throw new FdgError('BUSY', 'Legacy worker is still active');
      const backupDir = join(paths.dataDir, 'backups', 'upgrade');
      await mkdir(backupDir, { recursive: true });
      if (!existsSync(join(backupDir, 'original.sqlite')))
        await legacy.backup(join(backupDir, 'original.sqlite'));
      if (!existsSync(join(backupDir, 'feedgarden.jsonc')))
        await copyFile(paths.configFile, join(backupDir, 'feedgarden.jsonc'));
      for (const [from, to] of mapping.slice(1))
        if (existsSync(from) && resolve(from) !== resolve(to)) await copyVerified(from, to);
      await legacy.backup(join(paths.dataDir, 'recovery', 'upgrade-database.sqlite'));
      const content = resolve(base, old.feed?.directory ?? 'content');
      if (existsSync(content)) await copyVerified(content, join(backupDir, 'content'));
    } finally {
      legacy.close();
    }
    const converted = {
      ...old,
      version: 3,
      instanceId: journal.instanceId,
      storage: selection.dataDir ? { dataDir: paths.dataDir } : {},
      targets: old.publish?.repository
        ? [
          {
            id: 'site',
            repository: old.publish.repository,
            branch: old.publish.branch,
            format: 'jekyll',
            managedPrefix: 'content',
            auxiliaryFiles: ['config/topics.json'],
            output: resolve(base, old.feed?.directory ?? 'content'),
          },
        ]
        : [],
      feed: {
        directory: resolve(base, old.feed?.directory ?? 'content'),
        topics: resolve(base, old.feed?.topics ?? 'config/topics.json'),
      },
      sources: old.sources.map((source: any) => ({
        ...source,
        processAfter: ['arxiv', 'producthunt'].includes(source.id) ? '18:00' : '06:00',
        streams: source.streams.map(({ channels, ...stream }: any) => ({ ...stream, routes: channels })),
      })),
    };
    delete converted.publish;
    delete converted.$schema;
    const config = configSchema.parse(converted),
      stagedDatabase = join(paths.dataDir, 'recovery', 'upgrade-database.sqlite'),
      store = openDatabase(stagedDatabase);
    const rewrite = (value: unknown): unknown => {
      if (typeof value === 'string') {
        if (!isAbsolute(value)) return value;
        for (const [from, to] of mapping) {
          const rel = relative(from, value);
          if (value === from || (!rel.startsWith('..') && !isAbsolute(rel))) return join(to, rel);
        }
        return value;
      }
      if (Array.isArray(value)) return value.map(rewrite);
      if (value && typeof value === 'object')
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rewrite(v)]));
      return value;
    };
    try {
      migrateInstance(store, config, workspace => {
        if (workspace) {
          const rel = relative(join(oldRoot, 'workspaces'), workspace);
          if (!isAbsolute(workspace) || !rel || rel.startsWith('..') || isAbsolute(rel))
            throw new FdgError(
              'UPGRADE_OWNERSHIP_MISMATCH',
              'Task workspace is outside the selected legacy root; verify --legacy-base',
            );
        }
        return rewrite(workspace) as string;
      });
      // Durable journals and tool/workspace manifests also contain recovery paths.
      const visit = async (dir: string): Promise<void> => {
        if (!existsSync(dir)) return;
        for (const name of await readdir(dir)) {
          const file = join(dir, name),
            stat = await lstat(file);
          if (stat.isDirectory()) await visit(file);
          else if (name.endsWith('.json') && file !== journalPath) {
            let parsed;
            try {
              parsed = JSON.parse(await readFile(file, 'utf8'));
            } catch {
              continue;
            }
            await atomicWrite(file, JSON.stringify(rewrite(parsed)));
          }
        }
      };
      for (const dir of ['workspaces', 'recovery', 'tools']) await visit(join(paths.dataDir, dir));
      const context = createInstanceContext(config, paths);
      if (existsSync(config.feed.directory)) await importArchives(context, store, undefined, true);
      await migrateRecipes(context, store);
      for (const row of store.ownedWorkspaces()) {
        const marker = join(row.workspace, '.feedgarden-workspace.json');
        if (!existsSync(marker))
          throw new FdgError(
            'UPGRADE_OWNERSHIP_MISMATCH',
            'Missing workspace ownership marker: ' + row.workspace,
          );
        const owner = JSON.parse(await readFile(marker, 'utf8'));
        if (
          owner.version !== 1 ||
          (row.kind === 'batch' ? owner.batch !== row.id : owner.task !== row.id)
        )
          throw new FdgError('UPGRADE_OWNERSHIP_MISMATCH', 'Workspace identity mismatch: ' + row.workspace);
      }
      await atomicWrite(
        join(paths.configDir, 'feedgarden.schema.v3.json'),
        await readFile(resource('schemas/feedgarden.v3.json'), 'utf8'),
      );
    } finally {
      store.close();
    }
    renameSync(stagedDatabase, mapping[0]![1]);
    let updated = await readFile(paths.configFile, 'utf8');
    old.sources.forEach((source: any, i: number) =>
      source.streams.forEach((_stream: any, j: number) => {
        updated = renameJsoncProperty(updated, ['sources', i, 'streams', j, 'channels'], 'routes');
      }),
    );
    updated = editJsonc(updated, [], { ...config, $schema: './feedgarden.schema.v3.json' });
    await atomicWrite(paths.configFile, updated);
    await atomicWrite(journalPath, JSON.stringify({ ...journal, complete: true }));
    return { instanceId: config.instanceId, paths, mapping, legacyPreserved: true };
  } finally {
    await maintenance();
    await release();
  }
}
