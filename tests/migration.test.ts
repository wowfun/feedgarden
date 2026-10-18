import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, cp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import Database from 'better-sqlite3';
import { Store } from '../src/store.js';
import { configSchema } from '../src/config.js';
import { hash } from '../src/util.js';
import { convertConfig, rollback } from '../src/migrate.js';
import { readSiteBundle, siteBundleIdentity } from '../src/site-bundle.js';
const project=process.cwd();
test('v1 migration preserves the DSH execution backend while v2 defaults to OpenCode', () => {
  const sources = [{ id: 'one', name: 'One', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'feed', kind: 'feed' }] }] }];
  const converted = convertConfig({ version: 1, agent: { command: 'dsh', model: 'deepseek/deepseek-flash', effort: 'off' }, sources });
  assert.equal(converted.agent.backend, 'dsh'); assert.equal(converted.agent.command, 'dsh'); assert.equal(converted.agent.effort, 'off');
  assert.equal(convertConfig({ version: 2, agent: {}, sources }).agent.backend, 'opencode');
});
test('default JSON config migration archives WAL data, resumes fixed baseline, and rollback restores schema 2',async()=>{
 const root=await mkdtemp(join(tmpdir(),'feedgarden-migration-'));
 try {
  await mkdir(join(root,'.github'));await mkdir(join(root,'config/locales'),{recursive:true});await mkdir(join(root,'reports'));
  await cp('config/locales',join(root,'config/locales'),{recursive:true});await cp('config/topics.json',join(root,'config/topics.json'));for (const file of ['Gemfile', 'Gemfile.lock']) await cp(file,join(root,file));await cp('.github/jekyll-obsidian.yml',join(root,'.github/jekyll-obsidian.yml'));await cp('package-lock.json',join(root,'package-lock.json'));
  await writeFile(join(root,'reports/old.md'),'Legacy report preserved');
  const opaque=Buffer.alloc(300007,0xff);await writeFile(join(root,'reports/opaque.bin'),opaque);
  const c=configSchema.parse({version:2,storage:{directory:join(root,'.local'),database:join(root,'.local/data.sqlite')},feed:{directory:join(root,'content'),topics:join(root,'config/topics.json')},agent:{model:'deepseek/deepseek-flash'},sources:[{id:'one',name:'One',intervalHours:1,streams:[{id:'main',channels:[{id:'rss',kind:'feed'}]}]}]});
  const configFile=join(root,'feedgarden.json');await writeFile(configFile,JSON.stringify(c));
  const store=new Store(c.storage.database);store.close();
  const db=new Database(c.storage.database);db.pragma('journal_mode = WAL');
  db.exec('DROP TABLE feed_meta; DROP TABLE feed_excluded; DROP TABLE feed_jobs; DROP TABLE feed_summaries; DROP TABLE feed_cache; DROP TABLE feed_batches; PRAGMA user_version=2;');
  db.prepare('INSERT INTO items VALUES (?,?,?,?,?,?,?)').run('one','historical','2026-10-09T00:00:00Z','2026-10-09T00:00:00Z','2026-10-09T00:00:00Z','{}','old');
  execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});execFileSync('git',['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Fixture'],{cwd:root});
  const invoke=(...args:string[])=>execFileSync(process.execPath,['--import',pathToFileURL(resolve('node_modules/tsx/dist/loader.mjs')).href,resolve('src/cli.ts'),...args],{cwd:root,encoding:'utf8'});
  let result: string; try { result=invoke('migrate'); } finally { db.close(); } assert.match(result,/Migration archive/);
  const journal=JSON.parse(await readFile(join(root,'.local/migration.json'),'utf8'));assert.equal(journal.state,'complete');
  const manifest=JSON.parse(await readFile(join(journal.archive,'manifest.json'),'utf8'));
  assert.equal(manifest.format,2);
  assert.deepEqual(manifest.themeBundle,siteBundleIdentity(await readSiteBundle(root)));
  assert.deepEqual(manifest.workingThemeBundle,manifest.themeBundle);
  const originalGemfile=await readFile(join(root,'Gemfile'),'utf8'),originalLockfile=await readFile(join(root,'Gemfile.lock'),'utf8');
  assert.equal(manifest.checksums['reports/opaque.bin'],hash(opaque.toString('base64')),'streaming checksums must match existing archive hashes across chunk boundaries');
  const archived=new Database(join(journal.archive,'legacy.sqlite'),{readonly:true});try{assert.equal(archived.pragma('user_version',{simple:true}),2);assert.equal(archived.pragma('journal_mode',{simple:true}),'delete');assert.equal((archived.prepare('SELECT count(*) n FROM items').get() as any).n,1);assert.equal(archived.pragma('quick_check',{simple:true}),'ok');}finally{archived.close();}
  await assert.rejects(readFile(join(journal.archive,'legacy.sqlite-wal')));await assert.rejects(readFile(join(journal.archive,'legacy.sqlite-shm')));
  assert.equal(await readFile(join(journal.archive,'reports/old.md'),'utf8'),'Legacy report preserved');await assert.rejects(readFile(join(root,'reports/old.md')));
  const upgraded=new Store(c.storage.database);try{assert.equal(upgraded.db.prepare('SELECT count(*) n FROM feed_excluded').get() && (upgraded.db.prepare('SELECT count(*) n FROM feed_excluded').get() as any).n,1);assert.equal(upgraded.meta('cutoff')?.slice(11),'16:00:00.000Z');}finally{upgraded.close();}
  assert.equal(invoke('migrate'),result);
  // Resume the journal after the schema transaction but before final content cleanup.
  const interrupted = {...journal,state:'archived'};await writeFile(join(root,'.local/migration.json'),JSON.stringify(interrupted));
  const afterSchema = new Database(c.storage.database);afterSchema.prepare('INSERT INTO items VALUES (?,?,?,?,?,?,?)').run('one','post-migration','2026-10-09T00:00:00Z','2026-10-09T00:00:00Z','2026-10-09T00:00:00Z','{}','new');afterSchema.close();invoke('migrate');
  const resumed = new Store(c.storage.database);try{assert.equal((resumed.db.prepare('SELECT count(*) n FROM feed_excluded').get() as any).n,1);assert.equal((resumed.db.prepare('SELECT count(*) n FROM items').get() as any).n,2);}finally{resumed.close();}
  await writeFile(join(root,'Gemfile'),'Changed working dependency');
  await writeFile(join(root,'Gemfile.lock'),'Changed working lock');
  invoke('rollback',journal.archive);
  assert.equal(await readFile(join(root,'Gemfile'),'utf8'),originalGemfile);
  assert.equal(await readFile(join(root,'Gemfile.lock'),'utf8'),originalLockfile);
  const restored=new Database(c.storage.database);try{assert.equal(restored.pragma('user_version',{simple:true}),2);assert.equal((restored.prepare('SELECT count(*) n FROM items').get() as any).n,1);assert.equal((restored.prepare('SELECT count(*) n FROM job_lease').get() as any).n,0);}finally{restored.close();}
  assert.equal(await readFile(join(root,'reports/old.md'),'utf8'),'Legacy report preserved');
 }finally{await rm(root,{recursive:true,force:true});}
});

test('legacy archives are rejected before opening or changing the database', async () => {
 const root=await mkdtemp(join(tmpdir(),'feedgarden-old-archive-'));
 try {
  const database=join(root,'protected.sqlite');await writeFile(database,'Untouched database bytes');
  await writeFile(join(root,'manifest.json'),JSON.stringify({database,codeCommit:'legacy-code',checksums:{}}));
  await assert.rejects(rollback(root),/Unsupported migration archive format.*legacy-code/);
  assert.equal(await readFile(database,'utf8'),'Untouched database bytes');
 } finally {await rm(root,{recursive:true,force:true});}
});
