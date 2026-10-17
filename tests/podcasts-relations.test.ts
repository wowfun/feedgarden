import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { configSchema } from '../src/config.js';
import { Store } from '../src/store.js';
import { parsePodcastFeed, enrichPodcast, transcriptText, transcriptChunks, transcriptStep } from '../src/podcasts.js';
import { fixedTask, taskKey, type TaskGenerator } from '../src/fixed-tasks.js';
import { validateTask } from '../src/task-contract.mjs';
import { hash } from '../src/util.js';
import { writeSite } from '../src/site.js';
import { Http } from '../src/http.js';
import { pruneWorkspaces } from '../src/workspaces.js';

const at = '2026-10-15T12:00:00.000Z';
const context = { source: 'podcast', stream: 'show', channel: 'rss', observedAt: at };
const rss = '<rss xmlns:itunes="urn:itunes" xmlns:podcast="urn:podcast"><channel><item><title>Episode</title><itunes:title>Other title</itunes:title><guid>one</guid><description>Notes</description><pubDate>Thu, 15 Oct 2026 08:00:00 GMT</pubDate><enclosure url="https://example.test/one.mp3" type="audio/mpeg"/><podcast:transcript url="https://example.test/one.vtt" type="text/vtt"/></item></channel></rss>';

test('podcast namespaces, missing episode links, media and namespaced identities', () => {
  const [item] = parsePodcastFeed(rss, context, 'Show');
  assert.equal(item?.title, 'Episode'); assert.equal(item?.url, 'https://example.test/one.mp3');
  assert.equal(item?.id, 'show:one'); assert.equal(item?.media?.[0]?.type, 'audio');
  assert.equal(item?.metadata?.transcriptUrl, 'https://example.test/one.vtt');
  assert.notEqual(parsePodcastFeed(rss, { ...context, stream: 'another' }, 'Other')[0]?.id, item?.id);
  assert.throws(() => parsePodcastFeed('<!DOCTYPE rss>' + rss, context, 'Show'));
  assert.throws(() => parsePodcastFeed(rss.replace(/<title>.*?<\/title>/, '').replace(/<itunes:title>.*?<\/itunes:title>/, ''), context, 'Show'));
});

test('transcript parsing and Unicode chunks retain the complete beginning, middle and end', () => {
  const boundary = transcriptChunks('abcd\nxyz',4);
  assert.equal(boundary.map(part=>part.text).join(''),'abcd\nxyz');assert.ok(boundary.every(part=>part.text.length<=4));
  assert.equal(transcriptText('WEBVTT\n\n00:00:00.000 --> 00:00:01.000\n<v Ada>Hello\n\n00:00:01.000 --> 00:00:02.000\nTail', true), 'Ada: Hello\n\nTail');
  const text = 'HEAD ' + '🙂 evidence.\n'.repeat(5000) + ' TAIL';
  const chunks = transcriptChunks(text, 12000);
  assert.equal(chunks.map(c => c.text).join(''), text);
  assert.equal(chunks[0]!.start, 0); assert.equal(chunks.at(-1)!.end, text.length);
  chunks.forEach((c, i) => { if (i) assert.equal(c.start, chunks[i - 1]!.end); assert.ok(c.text.length <= 12000); });
});

test('minimum encoded transcript budgets terminate and retain escaped UTF-16 evidence', () => {
  // A single UTF-16 code unit always fits the accepted minimum JSON budget.
  for (let unit = 0; unit <= 0xffff; unit++) assert.ok(JSON.stringify(String.fromCharCode(unit)).length <= 8);
  const body = '\u0000"\\\ud800X🙂尾\n'.repeat(12);
  const chunks = transcriptChunks(body, 2, 8);
  assert.equal(chunks.map(chunk => chunk.text).join(''), body);
  assert.ok(chunks.every(chunk => chunk.end > chunk.start && JSON.stringify(chunk.text).length <= 8));
  assert.throws(() => transcriptChunks(body, 2, 7), /Invalid transcript chunk budget/);
});

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-new-'));
  const config = configSchema.parse({ version: 2, storage: { database: join(root, 'data.sqlite'), directory: root }, feed: { directory: join(root, 'content') }, agent: { model: 'deepseek/deepseek-flash', runtimeDirectory: join(root, 'tasks') }, sources: [{ id: 'podcast', name: 'Podcasts', intervalHours: 6, streams: [{ id: 'show', channels: [{ id: 'rss', kind: 'podcast-rss', podcastName: 'Show', url: 'https://example.test/feed' }] }] }] });
  const store = new Store(config.storage.database);
  return { config, store, root, cleanup: async () => { store.close(); await rm(root, { recursive: true, force: true }); } };
}

test('auxiliary retention prunes owned accepted and failed tasks while preserving resumable and unowned evidence', async () => {
  const f = await fixture();
  try {
    const rows: { key: string; workspace: string; state: string; input: string }[] = [];
    for (const state of ['accepted', 'failed', 'pending', 'running', 'unowned']) {
      const key = state, workspace = join(f.config.agent.runtimeDirectory, 'task-' + randomUUID());
      await mkdir(workspace, { recursive: true });
      await writeFile(join(workspace, '.feedgarden-workspace.json'), JSON.stringify({ version: 1, task: state === 'unowned' ? 'different-owner' : key }));
      await writeFile(join(workspace, 'audit.json'), 'Retained evidence');
      const input = JSON.stringify({ fixed: key });
      f.store.db.prepare('INSERT INTO feed_tasks(key,kind,input,output,workspace,state,attempts,error,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
        .run(key, 'transcript', input, state === 'accepted' ? '{"facts":"Retained result"}' : null, workspace, state === 'unowned' ? 'failed' : state, state === 'failed' ? 5 : 1, 'retained diagnostic', '2026-10-01T00:00:00Z');
      rows.push({ key, workspace, state, input });
    }
    await pruneWorkspaces({ ...f.config.agent, workspaceRetentionDays: 0 }, f.store, '2026-10-15T00:00:00Z');
    for (const row of rows) assert.ok(await stat(row.workspace));
    await pruneWorkspaces(f.config.agent, f.store, '2026-10-15T00:00:00Z');
    for (const row of rows) {
      const record = f.store.db.prepare('SELECT workspace,input,error,state,attempts FROM feed_tasks WHERE key=?').get(row.key) as { workspace: string; input: string; error: string; state: string; attempts: number };
      if (['accepted', 'failed'].includes(row.state)) {
        await assert.rejects(stat(row.workspace), { code: 'ENOENT' }); assert.equal(record.workspace, '');
      } else {
        assert.equal(await readFile(join(row.workspace, 'audit.json'), 'utf8'), 'Retained evidence'); assert.equal(record.workspace, row.workspace);
      }
      assert.equal(record.input, row.input); assert.equal(record.error, 'retained diagnostic');
      assert.equal(record.state, row.state === 'unowned' ? 'failed' : row.state);
      assert.equal(record.attempts, row.state === 'failed' ? 5 : 1);
    }
  } finally { await f.cleanup(); }
});

test('retrying a pruned failed auxiliary task creates a new owned workspace and retention age', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(at) });
  const f = await fixture();
  try {
    const input = { taskId: 'pruned', parts: [{ id: 'part', text: 'Evidence' }], maxChars: 1500 };
    const key = await taskKey(f.config.agent, 'transcript', input), created = '2026-10-01T00:00:00Z';
    f.store.db.prepare("INSERT INTO feed_tasks(key,kind,input,workspace,state,attempts,error,created_at) VALUES (?,?,?,'','failed',5,?,?)")
      .run(key, 'transcript', JSON.stringify(input), 'Original failure', created);
    const stopped = await fixedTask(f.store, f.config.agent, 'transcript', input, { generator: async () => { throw new Error('Retry flag is required'); } });
    assert.equal(stopped.state, 'failed'); assert.equal(stopped.performed, false);
    const result = await fixedTask(f.store, f.config.agent, 'transcript', input, { retryFailed: true, generator: async (_a, _k, value, _r, directory) => {
      assert.ok(directory, 'a pruned task must not write into the current working directory');
      assert.equal(dirname(directory!), resolve(f.config.agent.runtimeDirectory));
      assert.deepEqual(JSON.parse(await readFile(join(directory!, '.feedgarden-workspace.json'), 'utf8')), { version: 1, task: key });
      assert.deepEqual(value, input);
      return { output: { taskId: input.taskId, inputIds: ['part'], facts: 'Evidence' }, directory: directory!, usage: [], events: [] };
    } });
    assert.equal(result.state, 'accepted');
    const row = f.store.db.prepare('SELECT workspace,created_at FROM feed_tasks WHERE key=?').get(key) as { workspace: string; created_at: string };
    assert.notEqual(row.workspace, ''); assert.equal(row.created_at, at);
    await pruneWorkspaces(f.config.agent, f.store, at); assert.ok(await stat(row.workspace));
    const calls = (f.store.db.prepare('SELECT count(*) n FROM agent_calls').get() as { n: number }).n;
    const recovered = await fixedTask(f.store, f.config.agent, 'transcript', input, { generator: async () => { throw new Error('Accepted result must be reused'); } });
    assert.equal(recovered.state, 'accepted');
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM agent_calls').get() as { n: number }).n, calls);
  } finally { await f.cleanup(); }
});

test('a transcript above its explicit chunk budget is retained without spending a model attempt', async () => {
 const f=await fixture();try{
  Object.assign(f.config.agent,{maxTranscriptChunks:2});
  const body='All spoken facts including the ending.\n'.repeat(1500),item=parsePodcastFeed(rss,context,'Show')[0]!;
  f.store.db.prepare('INSERT INTO podcast_transcripts VALUES (?,?,?,?,?,?)').run('podcast',item.id,body,hash(body),'https://example.test/transcript',at);
  item.metadata={...item.metadata,transcriptHash:hash(body)};
  let calls=0;
  const step=await transcriptStep(item,f.store,f.config.agent,true,undefined,false,async()=>{calls++;throw new Error('Budget must be checked first');});
  assert.equal(calls,0);assert.equal(step.failed,true);assert.match(step.error!,/maxTranscriptChunks/);
  assert.equal((f.store.db.prepare('SELECT body FROM podcast_transcripts').get() as {body:string}).body,body);
  assert.equal((f.store.db.prepare('SELECT count(*) n FROM agent_calls').get() as {n:number}).n,0);
 }finally{await f.cleanup();}
});

test('escaped transcripts fit a small JSON input budget and their reduction converges', async () => {
 const f=await fixture();try{
  f.config.agent.maxInputChars=4000;
  const body='\u0000'.repeat(4500)+' END',item=parsePodcastFeed(rss,context,'Show')[0]!;
  f.store.db.prepare('INSERT INTO podcast_transcripts VALUES (?,?,?,?,?,?)').run('podcast',item.id,body,hash(body),'https://example.test/transcript',at);
  item.metadata={...item.metadata,transcriptHash:hash(body)};
  let ready=false,calls=0;
  const generator:TaskGenerator=async(_a,_k,value,_r,directory)=>{
   assert.ok(JSON.stringify(value).length<=4000);
   const input=value as {taskId:string;parts:{id:string;text:string}[];maxChars:number};calls++;
   return {output:{taskId:input.taskId,inputIds:input.parts.map(p=>p.id),facts:'\u0000'.repeat(input.maxChars)},directory:directory!,usage:[],events:[]};
  };
  for(let i=0;i<40;i++){const step=await transcriptStep(item,f.store,f.config.agent,true,undefined,false,generator);if(step.ready){ready=true;break;}}
  assert.ok(ready,'every reduction level must shrink even for heavily escaped facts');assert.ok(calls>1&&calls<40);
 }finally{await f.cleanup();}
});

test('follow-builders transcripts are parsed once per collector while every episode is matched by show and GUID', async t => {
 const f=await fixture();try{
  const body=JSON.stringify({podcasts:[{name:'Show',guid:'one',transcript:'First complete transcript'},{name:'Show',guid:'two',transcript:'Second complete transcript'}]});
  let requests=0,parses=0;const parse=JSON.parse;
  t.mock.method(JSON,'parse',(text:string,...rest:any[])=>{if(text===body)parses++;return Reflect.apply(parse,JSON,[text,...rest]);});
  const http=new Http(f.store,async()=>{requests++;return new Response(body);});
  const first=parsePodcastFeed(rss,context,'Show')[0]!;delete first.metadata!.transcriptUrl;
  const second={...first,id:'show:two',metadata:{...first.metadata,podcastGuid:'two'}};
  const a=await enrichPodcast(first,f.store,http),b=await enrichPodcast(second,f.store,http);
  assert.equal(requests,1);assert.equal(parses,1);assert.notEqual(a.metadata?.transcriptHash,b.metadata?.transcriptHash);
 }finally{t.mock.restoreAll();await f.cleanup();}
});

test('full transcript reduction resumes accepted nodes and invalidates on tail changes', async () => {
  const f = await fixture();
  try {
    const body = 'HEAD ' + 'Speech with specific facts.\n'.repeat(1800) + ' TAIL';
    let calls = 0; const supplied: string[] = [];
    const generator: TaskGenerator = async (_agent, _kind, value, _repair, directory) => {
      const input = value as { taskId: string; parts: { id: string; text: string }[] };
      calls++; supplied.push(...input.parts.map(p => p.text));
      return { output: { taskId: input.taskId, inputIds: input.parts.map(p => p.id), facts: 'HEAD and TAIL; factual notes covering all supplied parts.' }, directory: directory!, usage: [], events: [] };
    };
    const item = parsePodcastFeed(rss, context, 'Show')[0]!;
    f.store.db.prepare('INSERT INTO podcast_transcripts VALUES (?,?,?,?,?,?)').run('podcast', item.id, body, hash(body), 'https://example.test/transcript', at);
    item.metadata = { ...item.metadata, transcriptHash: hash(body) };
    let ready = false;
    for (let i = 0; i < 30; i++) {
      const step = await transcriptStep(item, f.store, f.config.agent, true, undefined, false, generator);
      if (step.ready) { ready = true; assert.match(step.item.text, /complete transcript/); break; }
    }
    assert.ok(ready); assert.ok(calls > 2);
    assert.equal(supplied.filter(text => text.includes('Speech with')).join(''), body);
    const before = calls; assert.ok((await transcriptStep(item, f.store, f.config.agent, false)).ready); assert.equal(calls, before);
    const changed = body + ' New ending'; f.store.db.prepare('UPDATE podcast_transcripts SET body=?,hash=?').run(changed, hash(changed));
    assert.equal((await transcriptStep({ ...item, metadata: { ...item.metadata, transcriptHash: hash(changed) } }, f.store, f.config.agent, false)).ready, false);
  } finally { await f.cleanup(); }
});

test('fixed task recovery and global quota do not pay again for a saved artifact', async () => {
  const f = await fixture();
  try {
    const input = { taskId: 'one', parts: [{ id: 'part', text: 'Evidence' }], maxChars: 1500 };
    const generator: TaskGenerator = async (_a, _k, _i, _r, directory) => ({ output: { taskId: 'one', inputIds: ['part'], facts: 'Evidence' }, directory: directory!, usage: [], events: [] });
    const task = await fixedTask(f.store, f.config.agent, 'transcript', input, { generator });
    f.store.db.prepare("UPDATE feed_tasks SET output=NULL,state='running' WHERE key=?").run(task.key);
    const recovered = await fixedTask(f.store, { ...f.config.agent, maxDailyCalls: 1 }, 'transcript', input, { generator: async () => { throw new Error('must not call'); } });
    assert.equal(recovered.state, 'accepted'); assert.equal(recovered.performed, false);
    const before=f.store.db.prepare('SELECT total_changes() n').get();
    await fixedTask(f.store,f.config.agent,'transcript',input,{generator});
    assert.deepEqual(f.store.db.prepare('SELECT total_changes() n').get(),before,'an accepted cache hit must not rewrite the task');
    const deferred = await fixedTask(f.store, { ...f.config.agent, maxDailyCalls: 1 }, 'transcript', { ...input, taskId: 'two' }, { generator });
    assert.equal(deferred.state, 'deferred');
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM agent_calls').get() as any).n, 1);
  } finally { await f.cleanup(); }
});

test('corrupt accepted task output recovers a valid saved artifact before quota or attempts', async () => {
  const f = await fixture();
  try {
    const input = { taskId: 'recovery', parts: [{ id: 'part', text: 'Evidence' }], maxChars: 1500 };
    const output = { taskId: input.taskId, inputIds: ['part'], facts: 'Evidence' };
    const task = await fixedTask(f.store, f.config.agent, 'transcript', input, { generator: async (_a, _k, _i, _r, directory) => ({ output, directory: directory!, usage: [], events: [] }) });
    f.config.agent.maxDailyCalls = 1;
    for (const broken of ['{broken', JSON.stringify({ ...output, inputIds: ['wrong'] })]) {
      f.store.db.prepare("UPDATE feed_tasks SET output=?,attempts=5 WHERE key=?").run(broken, task.key);
      const recovered = await fixedTask(f.store, f.config.agent, 'transcript', input, { generator: async () => { throw new Error('Saved artifact must recover without a model call'); } });
      assert.deepEqual(recovered.output, output); assert.equal(recovered.performed, false);
      assert.deepEqual(f.store.db.prepare('SELECT state,attempts,error FROM feed_tasks WHERE key=?').get(task.key), { state: 'accepted', attempts: 5, error: null });
    }
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM agent_calls').get() as { n: number }).n, 1);
  } finally { await f.cleanup(); }
});

test('rejected task caches defer under quota and regenerate within the paid attempt limit', async () => {
  const f = await fixture();
  try {
    const input = { taskId: 'regenerate', parts: [{ id: 'part', text: 'Evidence' }], maxChars: 1500 };
    let calls = 0;
    const generator: TaskGenerator = async (_a, _k, _i, _r, directory) => {
      calls++; return { output: { taskId: input.taskId, inputIds: ['part'], facts: 'Evidence' }, directory: directory!, usage: [], events: [] };
    };
    const task = await fixedTask(f.store, f.config.agent, 'transcript', input, { generator });
    const row = f.store.db.prepare('SELECT workspace FROM feed_tasks WHERE key=?').get(task.key) as { workspace: string };
    f.store.db.prepare('UPDATE feed_tasks SET output=? WHERE key=?').run('{broken', task.key);
    await writeFile(join(row.workspace, 'result.json'), '{broken');
    f.config.agent.maxDailyCalls = 1;
    const deferred = await fixedTask(f.store, f.config.agent, 'transcript', input, { generator });
    assert.equal(deferred.state, 'deferred'); assert.equal(calls, 1);
    assert.deepEqual(f.store.db.prepare('SELECT output,state,attempts FROM feed_tasks WHERE key=?').get(task.key), { output: null, state: 'pending', attempts: 1 });
    f.config.agent.maxDailyCalls = 2;
    assert.equal((await fixedTask(f.store, f.config.agent, 'transcript', input, { generator })).state, 'accepted');
    assert.equal(calls, 2);
    f.store.db.prepare("UPDATE feed_tasks SET output=?,attempts=5,state='accepted' WHERE key=?").run('{broken', task.key);
    await writeFile(join(row.workspace, 'result.json'), '{broken');
    f.config.agent.maxDailyCalls = 3;
    assert.equal((await fixedTask(f.store, f.config.agent, 'transcript', input, { generator })).state, 'failed');
    assert.equal(calls, 2);
    assert.equal((await fixedTask(f.store, f.config.agent, 'transcript', input, { generator, retryFailed: true })).state, 'accepted');
    assert.equal(calls, 3);
  } finally { await f.cleanup(); }
});

test('transcript planning treats rejected accepted nodes as misses and execution repairs them', async () => {
  const f = await fixture();
  try {
    const body = 'Complete spoken evidence', item = parsePodcastFeed(rss, context, 'Show')[0]!;
    item.metadata = { ...item.metadata, transcriptHash: hash(body) };
    f.store.db.prepare('INSERT INTO podcast_transcripts VALUES (?,?,?,?,?,?)').run('podcast', item.id, body, hash(body), item.url, at);
    let calls = 0;
    const generator: TaskGenerator = async (_a, _k, value, _r, directory) => {
      const input = value as { taskId: string; parts: { id: string }[] };
      calls++; return { output: { taskId: input.taskId, inputIds: input.parts.map(p => p.id), facts: body }, directory: directory!, usage: [], events: [] };
    };
    await transcriptStep(item, f.store, f.config.agent, true, undefined, false, generator);
    const row = f.store.db.prepare('SELECT key,workspace,output FROM feed_tasks').get() as { key: string; workspace: string; output: string };
    f.store.db.prepare('UPDATE feed_tasks SET output=? WHERE key=?').run(JSON.stringify({ ...JSON.parse(row.output), inputIds: ['wrong'] }), row.key);
    await writeFile(join(row.workspace, 'result.json'), '{broken');
    const planned = await transcriptStep(item, f.store, f.config.agent, false);
    assert.equal(planned.ready, false); assert.equal(calls, 1);
    assert.equal((await transcriptStep(item, f.store, f.config.agent, true, undefined, false, generator)).performed, true);
    assert.equal((await transcriptStep(item, f.store, f.config.agent, false)).ready, true);
    assert.equal(calls, 2);
  } finally { await f.cleanup(); }
});

test('cancelled fixed tasks preserve call accounting and resume immediately without failure backoff', async () => {
  const f = await fixture();
  try {
    const input = { taskId: 'cancelled', parts: [{ id: 'part', text: 'Evidence' }], maxChars: 1500 };
    const cancellation = new AbortController();
    await assert.rejects(fixedTask(f.store, f.config.agent, 'transcript', input, { signal: cancellation.signal, generator: async (_a, _k, _i, _r, directory) => {
      cancellation.abort();
      return { output: { taskId: input.taskId, inputIds: ['part'], facts: 'Evidence' }, directory: directory!, usage: [], events: [] };
    } }), { name: 'AbortError' });
    const row = f.store.db.prepare('SELECT attempts,next_at,error FROM feed_tasks').get() as { attempts: number; next_at: string; error: string | null };
    assert.equal(row.attempts, 1); assert.equal(row.next_at, ''); assert.equal(row.error, null);
    let calls = 0;
    const recovered = await fixedTask(f.store, f.config.agent, 'transcript', input, { generator: async (_a, _k, _i, _r, directory) => {
      calls++; return { output: { taskId: input.taskId, inputIds: ['part'], facts: 'Evidence' }, directory: directory!, usage: [], events: [] };
    } });
    assert.equal(recovered.state, 'accepted'); assert.equal(calls, 1);
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM agent_calls').get() as { n: number }).n, 2);
  } finally { await f.cleanup(); }
});

test('fixed tasks propagate lease takeover before acceptance or retry mutation', async () => {
  for (const transportFailure of [false, true]) {
    const f = await fixture();
    try {
      const input = { taskId: 'lease', parts: [{ id: 'part', text: 'Evidence' }], maxChars: 1500 };
      f.store.acquireLease('runner');
      await assert.rejects(fixedTask(f.store, f.config.agent, 'transcript', input, { generator: async (_a, _k, _i, _r, directory) => {
        f.store.db.prepare("UPDATE job_lease SET owner='replacement'").run();
        if (transportFailure) throw new Error('Transport interrupted during takeover');
        return { output: { taskId: input.taskId, inputIds: ['part'], facts: 'Evidence' }, directory: directory!, usage: [], events: [] };
      } }), /Lost database job lease/);
      const row = f.store.db.prepare('SELECT attempts,next_at,error,output FROM feed_tasks').get() as { attempts: number; next_at: string; error: string | null; output: string | null };
      assert.deepEqual(row, { attempts: 1, next_at: '', error: null, output: null });
      assert.equal((f.store.db.prepare('SELECT count(*) n FROM agent_calls').get() as { n: number }).n, 1);
    } finally { await f.cleanup(); }
  }
});

test('an unsatisfiable derived transcript note budget fails before model work',async()=>{
  const f=await fixture();
  try{
    const body='Complete evidence',item=parsePodcastFeed(rss,context,'Show')[0]!;
    item.metadata={...item.metadata,transcriptHash:hash(body)};
    f.store.db.prepare('INSERT INTO podcast_transcripts VALUES (?,?,?,?,?,?)').run('podcast',item.id,body,hash(body),'https://example.test/transcript',at);
    await assert.rejects(transcriptStep(item,f.store,{...f.config.agent,maxItemChars:50},true),/prefix leaves no room/);
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM agent_calls').get() as {n:number}).n,0);
  }finally{await f.cleanup();}
});
