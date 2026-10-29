import assert from 'node:assert/strict';
import test from 'node:test';
import type { Item } from '../../src/contracts/items.js';
import { inItemWindow,resolveItemWindow } from '../../src/contracts/window.js';
import Database from '../../src/storage/sqlite.js';
import { itemWindowSql } from '../../src/storage/window-sql.js';

test('durable cutoff cannot invert a requested window',()=>{
 assert.throws(()=>resolveItemWindow({since:'2026-10-01',until:'2026-10-02'},'2026-10-03T00:00:00Z','2026-10-04T00:00:00Z'),/cutoff/);
});

test('bounded item scans use both indexed date ranges',()=>{
 const db=new Database(':memory:');try{
  db.exec('CREATE TABLE items(source TEXT,id TEXT,data TEXT,first_seen TEXT,published_at TEXT); CREATE INDEX seen ON items(source,julianday(first_seen)); CREATE INDEX published ON items(source,julianday(published_at));');
  const window=resolveItemWindow({since:'2026-10-20',until:'2026-10-21',observedDays:7},'1970-01-01','2026-10-22');
  const sql=itemWindowSql('i.data','i.first_seen',window,'$','i.published_at');
  const plan=db.prepare('EXPLAIN QUERY PLAN SELECT data FROM items i WHERE source=? AND '+sql.clause).all('one',...sql.parameters) as {detail:string}[];
  for(const index of ['seen','published'])assert.ok(plan.some(row=>row.detail.includes('USING INDEX '+index+' (source=? AND <expr>>? AND <expr><?)')),JSON.stringify(plan));
 }finally{db.close();}
});

test('JavaScript and durable SQL window checks agree across date bases, offsets and millisecond boundaries',()=>{
  const db=new Database(':memory:');
  const at='2026-10-21T22:00:00.000Z',cutoff='2026-10-01T00:00:00.000Z';
  const bounded={since:'2026-10-20T00:00:00+08:00',until:'2026-10-21T00:00:00+08:00'};
  const windows=[resolveItemWindow({},cutoff,at),resolveItemWindow(bounded,cutoff,at),resolveItemWindow({...bounded,observedDays:7},cutoff,at)];
  try{
    db.exec('CREATE TABLE sample(item TEXT,first_seen TEXT)');
    const insert=db.prepare('INSERT INTO sample VALUES (?,?)');
    for(const window of windows){
      const edges=[window.since,window.until,window.observedSince,window.observedUntil].filter((value):value is string=>!!value);
      const dates=[...new Set(edges.flatMap(edge=>[-1,0,1].map(delta=>new Date(Date.parse(edge)+delta).toISOString())))];
      dates.push('2026-10-20T00:00:00+08:00','2026-10-19T12:00:00-04:00','invalid');
      const sql=itemWindowSql('item','first_seen',window),query=db.prepare(`SELECT ${sql.clause} admitted FROM sample`);
      for(const basis of ['published','submitted','leaderboard','observed'] as const)for(const publishedAt of dates)for(const firstSeen of dates){
        const item={basis,publishedAt} as Item;
        db.exec('DELETE FROM sample');insert.run(JSON.stringify(item),firstSeen);
        const result=query.get(...sql.parameters) as {admitted:number|null};
        assert.equal(!!result.admitted,inItemWindow(item,firstSeen,window),JSON.stringify({basis,publishedAt,firstSeen,window}));
      }
    }
  }finally{db.close();}
});
