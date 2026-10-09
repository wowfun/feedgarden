import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, cp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import Database from 'better-sqlite3';
import { Store } from '../src/store.js';
import { configSchema } from '../src/config.js';
const project=process.cwd();
test('actual migration archives WAL data and legacy files, resumes fixed baseline, and rollback restores schema 2',async()=>{
 const root=await mkdtemp(join(tmpdir(),'feedgarden-migration-'));
 try {
  await mkdir(join(root,'.github'));await mkdir(join(root,'config/locales'),{recursive:true});await mkdir(join(root,'reports'));
  await cp('config/locales',join(root,'config/locales'),{recursive:true});await cp('config/topics.json',join(root,'config/topics.json'));await cp('.github/theme.lock.json',join(root,'.github/theme.lock.json'));await cp('.github/jekyll-obsidian.yml',join(root,'.github/jekyll-obsidian.yml'));await cp('package-lock.json',join(root,'package-lock.json'));
  await writeFile(join(root,'reports/old.md'),'Legacy report preserved');
  const c=configSchema.parse({version:2,storage:{directory:join(root,'.local'),database:join(root,'.local/data.sqlite')},feed:{directory:join(root,'content'),topics:join(root,'config/topics.json')},agent:{model:'deepseek/deepseek-flash'},sources:[{id:'one',name:'One',intervalHours:1,streams:[{id:'main',channels:[{id:'rss',kind:'feed'}]}]}]});
  const configFile=join(root,'config.json');await writeFile(configFile,JSON.stringify(c));
  const store=new Store(c.storage.database);store.close();
  const db=new Database(c.storage.database);db.pragma('journal_mode = WAL');
  db.exec('DROP TABLE feed_meta; DROP TABLE feed_excluded; DROP TABLE feed_jobs; DROP TABLE feed_summaries; DROP TABLE feed_cache; DROP TABLE feed_batches; PRAGMA user_version=2;');
  db.prepare('INSERT INTO items VALUES (?,?,?,?,?,?,?)').run('one','historical','2026-10-09T00:00:00Z','2026-10-09T00:00:00Z','2026-10-09T00:00:00Z','{}','old');
  execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});execFileSync('git',['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Fixture'],{cwd:root});
  const invoke=(...args:string[])=>execFileSync(process.execPath,['--import',resolve('node_modules/tsx/dist/loader.mjs'),resolve('src/cli.ts'),...args,'--config',configFile],{cwd:root,encoding:'utf8'});
  const result=invoke('migrate');db.close();assert.match(result,/Migration archive/);
  const journal=JSON.parse(await readFile(join(root,'.local/migration.json'),'utf8'));assert.equal(journal.state,'complete');
  const archived=new Database(join(journal.archive,'legacy.sqlite'),{readonly:true});try{assert.equal(archived.pragma('user_version',{simple:true}),2);assert.equal(archived.pragma('journal_mode',{simple:true}),'delete');assert.equal((archived.prepare('SELECT count(*) n FROM items').get() as any).n,1);assert.equal(archived.pragma('quick_check',{simple:true}),'ok');}finally{archived.close();}
  await assert.rejects(readFile(join(journal.archive,'legacy.sqlite-wal')));await assert.rejects(readFile(join(journal.archive,'legacy.sqlite-shm')));
  assert.equal(await readFile(join(journal.archive,'reports/old.md'),'utf8'),'Legacy report preserved');await assert.rejects(readFile(join(root,'reports/old.md')));
  const upgraded=new Store(c.storage.database);try{assert.equal(upgraded.db.prepare('SELECT count(*) n FROM feed_excluded').get() && (upgraded.db.prepare('SELECT count(*) n FROM feed_excluded').get() as any).n,1);assert.equal(upgraded.meta('cutoff')?.slice(11),'16:00:00.000Z');}finally{upgraded.close();}
  assert.equal(invoke('migrate'),result);
  // Resume the journal after the schema transaction but before final content cleanup.
  const interrupted = {...journal,state:'archived'};await writeFile(join(root,'.local/migration.json'),JSON.stringify(interrupted));
  const afterSchema = new Database(c.storage.database);afterSchema.prepare('INSERT INTO items VALUES (?,?,?,?,?,?,?)').run('one','post-migration','2026-10-09T00:00:00Z','2026-10-09T00:00:00Z','2026-10-09T00:00:00Z','{}','new');afterSchema.close();invoke('migrate');
  const resumed = new Store(c.storage.database);try{assert.equal((resumed.db.prepare('SELECT count(*) n FROM feed_excluded').get() as any).n,1);assert.equal((resumed.db.prepare('SELECT count(*) n FROM items').get() as any).n,2);}finally{resumed.close();}
  invoke('rollback',journal.archive);
  const restored=new Database(c.storage.database);try{assert.equal(restored.pragma('user_version',{simple:true}),2);assert.equal((restored.prepare('SELECT count(*) n FROM items').get() as any).n,1);assert.equal((restored.prepare('SELECT count(*) n FROM job_lease').get() as any).n,0);}finally{restored.close();}
  assert.equal(await readFile(join(root,'reports/old.md'),'utf8'),'Legacy report preserved');
 }finally{await rm(root,{recursive:true,force:true});}
});
