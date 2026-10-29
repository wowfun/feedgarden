import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp,readdir,readFile,rm,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { editConfig,execute,setup } from '../../src/app/index.js';
import { saveItems } from '../../src/content/index.js';
import type { Item } from '../../src/contracts/items.js';
import { loadInstance } from '../../src/instance/index.js';
import { createRun,executeRun,status } from '../../src/runs/index.js';
import { indexItems,listItems } from '../../src/storage/index.js';
import { openTestInstance as openInstance } from '../support/database.js';
const exec = promisify(execFile),
  cli = resolve('src/cli.ts');
async function invoke(...args: string[]) {
  try {
    const out = await exec(process.execPath, ['--import', 'tsx', cli, ...args], { timeout: 30000 });
    return { code: 0, json: JSON.parse(out.stdout), stderr: out.stderr };
  } catch (error) {
    const e = error as any;
    return { code: e.code, json: JSON.parse(e.stdout), stderr: e.stderr };
  }
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'fdg-cli-'));
  await setup({ workspace: root });
  let loaded = loadInstance({ workspace: root });
  await editConfig(loaded.paths.configFile, ['sources'], []);
  loaded = loadInstance({ workspace: root });
  return { root, ...loaded, cleanup: () => rm(root, { recursive: true, force: true }) };
}
test('every parsing and configuration failure is a single JSON envelope', async () => {
  for (const args of [
    ['no-such-command'],
    ['sync', '--no-publish'],
    ['version', '--bogus'],
    ['doctor', '--workspace', '/fdg-does-not-exist'],
  ]) {
    const result = await invoke(...args);
    assert.notEqual(result.code, 0);
    assert.equal(result.json.schemaVersion, 1);
    assert.equal(result.json.state, 'failed');
    assert.equal(result.json.command,args[0]);
    assert.ok(!result.json.issues[0].message.includes('\n'));
    assert.ok(Array.isArray(result.json.issues));
  }
  const result = await invoke('version');
  assert.equal(result.code, 0);
  assert.equal(result.json.result.package, 'feedgarden');
});

test('command help includes positional usage and irrelevant subscription options fail early',async()=>{
  for(const action of ['list','remove','enable','disable']) {
    const result=await invoke('subscriptions',action,...(action==='list'?[]:['one']),'--url','https://example.com');
    assert.equal(result.code,2);assert.match(result.json.issues[0].message,/Unsupported option/);
  }
  const help=await exec(process.execPath,['--import','tsx',cli,'help','items','read']);
  assert.match(help.stdout,/fdg items read SOURCE ID/);
});
test('read commands do not initialize a missing workspace', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-empty-'));
  try {
    const result = await invoke('doctor', '--workspace', root);
    assert.equal(result.json.issues[0].code, 'NOT_INITIALIZED');
    assert.deepEqual(await readdir(root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

for(const fault of ['summary','relations'] as const) test(`${fault} configuration failures return partial envelopes and render healthy sources`,async()=>{
  const f=await fixture();
  try {
    await editConfig(f.paths.configFile,['agent'],{command:resolve('tests/support/fixtures/acp-peer.mjs'),model:fault==='relations'?'missing/model':'fixture/other'});
    await editConfig(f.paths.configFile,['sources'],['one','two'].map(id=>({id,name:id,intervalHours:1,processAfter:'00:00',agent:{model:fault==='summary'&&id==='one'?'missing/model':'fixture/other'},streams:[{id:'main',routes:[{id:'rss',kind:'feed'}]}]})));
    const {config}=loadInstance({workspace:f.root}),store=openInstance(config),at=new Date().toISOString();
    await writeFile(config.feed.topics,JSON.stringify({version:1,topics:[{id:'coding',name:{en:'Coding','zh-CN':'编程'},description:'Tools',aliases:[],deprecated:false,hidden:false}]}));
    try {
      for(const source of ['one','two']) {
        const item:Item={source,id:'a',stream:'main',channel:'rss',title:'Atlas validation pipeline release',text:'Atlas releases structured diagnostics and deterministic validation records.',url:'https://example.test/'+source,publishedAt:at,observedAt:at,basis:'published',metrics:{}};
        store.saveCollection(source,'main','rss',{items:[item],raw:[],coverage:{status:'complete',to:at,notes:[]}},'');
      }
    }finally{store.close();}
    const result=await invoke('process','--workspace',f.root,'--since',new Date(Date.parse(at)-3600000).toISOString(),'--until',new Date(Date.parse(at)+1000).toISOString());
    assert.equal(result.code,3,JSON.stringify(result.json));assert.equal(result.json.state,'partial');
    assert.ok(result.json.issues.some((issue:any)=>issue.code===(fault==='summary'?'PROCESSING_FAILED':'RELATIONS_FAILED')));
    assert.ok(result.json.result.summary.generated>0);
    const reader=openInstance(config,true);
    try {
      const path=reader.statement("SELECT day,number FROM feed_item_paths WHERE source='two' AND id='a'").get();
      assert.match(await readFile(join(config.feed.directory,'two',path.day.slice(0,7),path.day.slice(8),'item-'+path.number+'.md'),'utf8'),/Atlas/);
      assert.equal(reader.runs.find(result.json.runId)?.exit_code,3);
    }finally{reader.close();}
  }finally{await f.cleanup();}
});
test('empty sync, persistent status and frozen default window complete without a model', async () => {
  const f = await fixture();
  try {
    const run = await createRun(f.config, {}, ['sync']),
      outcome = await executeRun(f.config, run.id, run.token, execute);
    assert.equal(outcome.state, 'completed');
    const state = await status(f.config, run.id);
    assert.equal(state.runs[0]!.runExitCode, 0);
    assert.ok(state.runs[0]!.scope.window.until);
    assert.equal(state.runs[0]!.scope.windowClipped, false);
    const cliStatus = await invoke('status', run.id, '--workspace', f.root);
    assert.equal(cliStatus.code, 0);
    assert.equal(cliStatus.json.result.runs[0].state, 'completed');
  } finally {
    await f.cleanup();
  }
});
test('out-of-history requests fail before creating a run or importing archives', async () => {
  const f = await fixture();
  try {
    await assert.rejects(
      createRun(f.config, { since: '2000-01-01', until: '2000-01-02' }, ['process']),
      /collectionStart/,
    );
    const store = openInstance(f.config, true);
    try {
      assert.equal(store.statement('SELECT count(*) n FROM fdg_runs').get().n, 0);
      assert.equal(store.meta('publications_initialized'), undefined);
    } finally {
      store.close();
    }
  } finally {
    await f.cleanup();
  }
});
test('resume rejects changed configuration and stale source generations', async () => {
  const f = await fixture();
  try {
    const run = await createRun(f.config, {}, ['sync']);
    await editConfig(f.paths.configFile, ['observedDays'], 6);
    const changed = loadInstance({ workspace: f.root });
    const result = await executeRun(changed.config, run.id, undefined, execute, true);
    assert.equal(result.issues[0]!.code, 'CONFIG_CHANGED');
  } finally {
    await f.cleanup();
  }
});
test('explicit inbox preserves historical dates, exclusions and read-only Chinese keyset search', async () => {
  const f = await fixture(),
    item: Item = {
      source: 'web',
      id: 'one',
      url: 'https://example.test/a',
      title: '大语言模型',
      text: '推理能力 OpenAI tools',
      stream: 'explicit',
      channel: 'public-http',
      observedAt: new Date().toISOString(),
      publishedAt: '2000-01-01T00:00:00.000Z',
      basis: 'published',
      metrics: {},
    };
  try {
    await saveItems(f.config, [item]);
    const store = openInstance(f.config);
    try {
      assert.equal(store.inbox.accept(), 1);
      indexItems(store);
      for (const query of ['模型', '型', '语言', 'OpenAI', '模型 tools'])
        assert.equal(listItems(store, { query }).items.length, 1, query);
      assert.equal(listItems(store, { query: '" OR *' }).items.length, 0);
      assert.equal(
        JSON.parse(store.statement('SELECT data FROM items').get().data).publishedAt,
        item.publishedAt,
      );
      store.statement('INSERT INTO feed_excluded VALUES(?,?)').run(item.source, item.id);
    } finally {
      store.close();
    }
    await assert.rejects(saveItems(f.config, [item]), /excluded/);
    await assert.rejects(saveItems(f.config, [{ ...item, id: 'batch-allowed' }, item]), /excluded/);
    const reader = openInstance(f.config, true);
    try {
      assert.throws(() => reader.setMeta('bad', 'write'));
      assert.equal(reader.statement("SELECT count(*) n FROM fdg_inbox WHERE id='batch-allowed'").get().n,0,'Explicit save rejects the whole batch rather than silently saving part');
    } finally {
      reader.close();
    }
  } finally {
    await f.cleanup();
  }
});

test('keyset cursors retain their first-page ceiling while a WAL reader sees later updates', async () => {
  const f = await fixture(),
    writer = openInstance(f.config),
    reader = openInstance(f.config, true);
  const at = new Date().toISOString();
  const insert = (id: string, title = id) =>
    writer.saveCollection(
      'web',
      'main',
      'feed',
      {
        items: [
          {
            source: 'web',
            id,
            stream: 'main',
            channel: 'feed',
            title,
            text: '模型',
            url: 'https://example.test/' + id,
            observedAt: at,
            publishedAt: at,
            basis: 'observed',
            metrics: {},
          },
        ],
        raw: [],
        coverage: { status: 'complete', to: at, notes: [] },
      },
      at,
      at,
    );
  try {
    for (const id of ['a', 'b', 'c']) insert(id);
    indexItems(writer);
    const first = listItems(reader, { limit: 1, query: '模型' });
    insert('a', 'updated');
    insert('d');
    indexItems(writer);
    const second = listItems(reader, { limit: 1, query: '模型', cursor: first.nextCursor! });
    const third = listItems(reader, { limit: 1, query: '模型', cursor: second.nextCursor! });
    assert.deepEqual(
      [first, second, third].flatMap((p) => p.items.map((i) => i.id)),
      ['a', 'b', 'c'],
    );
    assert.equal(third.nextCursor, null);
    assert.equal(listItems(reader).items.length, 4);
    assert.throws(() => listItems(reader, { query: 'changed', cursor: first.nextCursor! }), /cursor/);
  } finally {
    reader.close();
    writer.close();
    await f.cleanup();
  }
});
