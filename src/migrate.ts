import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, rm, copyFile } from 'node:fs/promises';
import { resolve, join, dirname, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { DateTime } from 'luxon';
import { parse } from 'jsonc-parser';
import { configSchema, type Config } from './config.js';
import { initializeFeedSchema, Store } from './store.js';
import { atomicWrite, hash, nowIso } from './util.js';
import { writeSite } from './site.js';

export function convertConfig(value: any): Config {
  if (value.version === 2) return configSchema.parse(value);
  if (value.version !== 1) throw new Error('Unsupported configuration version');
  const { reports, ...rest } = value;
  return configSchema.parse({ ...rest, version: 2, feed: { directory: 'content', topics: 'config/topics.json' }, collection: { backfillDays: reports?.backfillDays ?? 7 }, sources: value.sources.map((source: any) => {
    const { frequencies, reportAgent, topics, ...next } = source;
    if (reportAgent) {
      const overrides = (frequencies ?? []).map((frequency: string) => ({ model: value.agent.model, ...(value.agent.effort ? { effort: value.agent.effort } : {}), ...source.agent, ...reportAgent[frequency] }));
      if (new Set(overrides.map((entry: unknown) => JSON.stringify(entry))).size > 1) throw new Error('MANUAL_ACTION: incompatible frequency-specific agent overrides for ' + source.id + '; choose one per-item model/effort');
      if (overrides.length) next.agent = overrides[0];
    }
    if (topics?.length) next.includeKeywords = topics;
    return next;
  }) });
}
async function checksums(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  async function visit(directory: string) {
    for (const file of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, file.name);
      if (file.isSymbolicLink()) throw new Error('Migration archive must not contain symlinks');
      if (file.isDirectory()) await visit(path);
      else if (file.name !== 'manifest.json' && !file.name.startsWith('new-state-') && !relative(root,path).split('/').some(part=>part.startsWith('new-content-'))) result[relative(root, path)] = hash((await readFile(path)).toString('base64'));
    }
  }
  await visit(root); return result;
}
const revision = (directory = process.cwd()) => execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
export async function migrate(configFile = 'feedgarden.jsonc', at = nowIso()): Promise<string> {
  const raw = await readFile(configFile, 'utf8'), legacy = parse(raw), config = convertConfig(legacy);
  await mkdir(config.storage.directory, { recursive: true, mode: 0o700 });
  const journalPath = resolve(config.storage.directory, 'migration.json');
  let journal: { archive: string; cutoff: string; configHash: string; state: string } | undefined;
  if (existsSync(journalPath)) journal = JSON.parse(await readFile(journalPath, 'utf8'));
  if (journal?.state === 'complete') return journal.archive;
  const db = new Database(config.storage.database);
  try {
    const version = db.pragma('user_version', { simple: true }) as number;
    if (![2, 3].includes(version)) throw new Error('Migration expects schema 2 (or its interrupted schema 3 migration)');
    const lease = db.prepare('SELECT expires FROM job_lease WHERE id=1').get() as { expires: string } | undefined;
    if (lease && lease.expires > nowIso()) throw new Error('Another job holds the database lease');
    if (!journal) {
      if (version !== 2) throw new Error('Schema 3 database lacks its migration journal; refusing to infer a legacy baseline');
      const archive = resolve(config.storage.directory, 'migrations', at.replace(/[:.]/g, '-'));
      await mkdir(archive, { recursive: true, mode: 0o700 });
      await db.backup(join(archive, 'legacy.sqlite'));
      const archived = new Database(join(archive, 'legacy.sqlite'));
      archived.pragma('journal_mode = DELETE');
      let counts: Record<string, number>;
      try {
        if (archived.pragma('quick_check', { simple: true }) !== 'ok') throw new Error('Legacy database backup failed integrity check');
        counts = Object.fromEntries(['items', 'observations', 'reports', 'raw_responses'].map(table => [table, (archived.prepare('SELECT count(*) count FROM ' + table).get() as { count: number }).count]));
      } finally { archived.close(); }
      await copyFile(configFile, join(archive, 'config.original'));
      for (const file of ['package-lock.json', '.github/theme.lock.json', '.github/jekyll-obsidian.yml']) if (existsSync(file)) await cp(file, join(archive, file), { recursive: true });
      for (const file of ['package-lock.json', '.github/theme.lock.json', '.github/jekyll-obsidian.yml']) {
        const original = execFileSync('git', ['show', 'HEAD:' + file], {encoding:'utf8'});
        await atomicWrite(join(archive, 'code-base', file), original);
      }
      if (existsSync(legacy.reports?.directory ?? 'reports')) await cp(legacy.reports?.directory ?? 'reports', join(archive, 'reports'), { recursive: true });
      const manifest = { createdAt: at, configFile: resolve(configFile), reportsDirectory: resolve(legacy.reports?.directory ?? 'reports'), database: resolve(config.storage.database), codeCommit: revision(), themeCommit: JSON.parse(await readFile(join(archive, 'code-base/.github/theme.lock.json'), 'utf8')).commit, workingThemeCommit: JSON.parse(await readFile('.github/theme.lock.json', 'utf8')).commit, counts, checksums: await checksums(archive), quickCheck: 'ok' };
      await atomicWrite(join(archive, 'manifest.json'), JSON.stringify(manifest, null, 2));
      journal = { archive, cutoff: DateTime.fromISO(at).setZone('Asia/Shanghai').startOf('day').toUTC().toISO()!, configHash: hash(raw), state: 'archived' };
      await atomicWrite(journalPath, JSON.stringify(journal));
    }
    if (version === 2) {
      if (hash(raw) !== journal.configHash) throw new Error('Original config changed during migration');
      initializeFeedSchema(db, journal.cutoff);
    }
    const cutoff = (db.prepare('SELECT value FROM feed_meta WHERE key=?').get('cutoff') as {value:string})?.value;
    if (cutoff !== journal.cutoff) throw new Error('Migration cutoff differs from its durable journal');
    db.prepare('INSERT OR REPLACE INTO feed_meta VALUES (?,?)').run('migration_archive', journal.archive);
  } finally { db.close(); }
  await atomicWrite(configFile, JSON.stringify(config, null, 2) + '\n');
  const store = new Store(config.storage.database);
  try { await writeSite(config, store); } finally { store.close(); }
  const manifest = JSON.parse(await readFile(join(journal!.archive, 'manifest.json'), 'utf8'));
  if (manifest.reportsDirectory === resolve(config.feed.directory)) throw new Error('Legacy reports must have a different destination from item content');
  await rm(manifest.reportsDirectory, { recursive: true, force: true });
  journal!.state = 'complete'; await atomicWrite(journalPath, JSON.stringify(journal));
  return journal!.archive;
}
export async function rollback(archive: string): Promise<void> {
  archive = resolve(archive);
  const manifest = JSON.parse(await readFile(join(archive, 'manifest.json'), 'utf8'));
  const actual = await checksums(archive);
  for (const [file, expected] of Object.entries(manifest.checksums)) if (actual[file] !== expected) throw new Error('Archive checksum mismatch: ' + file);
  const original = parse(await readFile(join(archive, 'config.original'), 'utf8'));
  const current = new Database(manifest.database);
  try {
    const lease = current.prepare('SELECT expires FROM job_lease WHERE id=1').get() as { expires: string } | undefined;
    if (lease && lease.expires > nowIso()) throw new Error('Another job holds the database lease');
    await current.backup(join(archive, 'new-state-' + Date.now() + '.sqlite'));
  } finally { current.close(); }
  // Keep the new content as a recovery artifact before restoring the old tree.
  const newContent = resolve(parse(await readFile(manifest.configFile, 'utf8')).feed?.directory ?? 'content');
  if (existsSync(newContent)) await cp(newContent, join(archive, 'new-content-' + Date.now()), { recursive: true });
  for (const suffix of ['-wal', '-shm']) await rm(manifest.database + suffix, { force: true });
  await copyFile(join(archive, 'legacy.sqlite'), manifest.database);
  const restored = new Database(manifest.database);
  try { restored.exec('DELETE FROM job_lease'); } finally { restored.close(); }
  await atomicWrite(manifest.configFile, await readFile(join(archive, 'config.original'), 'utf8'));
  await rm(manifest.reportsDirectory, { recursive: true, force: true });
  if (existsSync(join(archive, 'reports'))) await cp(join(archive, 'reports'), manifest.reportsDirectory, { recursive: true });
  for (const file of ['package-lock.json', '.github/theme.lock.json', '.github/jekyll-obsidian.yml']) if (existsSync(join(archive, 'code-base', file))) await cp(join(archive, 'code-base', file), resolve(file));
  else if (existsSync(join(archive, file))) await cp(join(archive, file), resolve(file));
  await rm(resolve(original.storage?.directory ?? '.local', 'migration.json'), { force: true });
  console.log('Restored legacy data. Run code commit ' + manifest.codeCommit + ' in an independent worktree; remote publication rollback requires a normal revert commit.');
}
