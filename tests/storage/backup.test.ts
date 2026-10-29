import assert from 'node:assert/strict';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { backup } from '../../src/storage/index.js';
import Database from '../../src/storage/sqlite.js';
import { TestDatabase as Store } from '../support/database.js';

test('daily and weekly backups include the last successful source and survive a failed refresh',async()=>{
 const root=await mkdtemp(join(tmpdir(),'feedgarden-backup-')),store=new Store(':memory:');
 try{
  store.setMeta('fixture','first');const paths=await backup(store,root,'2026-10-22T00:00:00Z');
  store.setMeta('fixture','second');await backup(store,root,'2026-10-22T10:00:00Z');
  const check=()=>{for(const path of paths){const db=new Database(path,{readonly:true});try{assert.equal((db.prepare("SELECT value FROM feed_meta WHERE key='fixture'").get() as {value:string}).value,'second');}finally{db.close();}}};
  check();store.backup=async()=>{throw new Error('Backup failure');};await assert.rejects(backup(store,root,'2026-10-22T11:00:00Z'),/Backup failure/);check();
 }finally{store.close();await rm(root,{recursive:true,force:true});}
});
