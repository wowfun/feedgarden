import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { Transport, openDatabase } from '../../src/storage/index.js';
import Database from '../../src/storage/sqlite.js';

test('transport reuses a lazy connection, shares reservations, and closes with its storage owner', async t => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-transport-'));
  const first = new Transport(join(root, 'transport.sqlite')), second = new Transport(first.path);
  const store = openDatabase(':memory:'); store.transport = first;
  const exec = Database.prototype.exec; let initialized = 0;
  t.mock.method(Database.prototype, 'exec', function(this: Database, sql: string) {
    if(sql.startsWith('CREATE TABLE IF NOT EXISTS hosts')) initialized++;
    return exec.call(this, sql);
  });
  try {
    assert.equal(initialized,0);
    first.reserve('example.com',1000);
    assert.ok(second.reserve('example.com',1000)>0);
    for(let i=0;i<10;i++) first.reserve('example.com',0);
    assert.equal(initialized,2);
    first.cooldown('example.com',new Date(Date.now()+60000).toISOString());
    assert.throws(()=>second.reserve('example.com',0),/cooling down/);
    store.close(); assert.throws(()=>first.reserve('example.com',0),/closed/);
  } finally { first.close();second.close();await rm(root,{recursive:true,force:true}); }
});
