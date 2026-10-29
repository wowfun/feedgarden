import assert from 'node:assert/strict';
import { ChildProcess } from 'node:child_process';
import { mkdtemp,readFile,rm,stat,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { generateBatch,generateTask } from '../../src/agent/index.js';
import { configSchema } from '../../src/contracts/configuration.js';
import type { Item } from '../../src/contracts/items.js';

// Real stdio JSON-RPC exercises permission rejection and session cleanup without
// using a network or sending synthetic material to a paid model.
const peer = `#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { basename } from 'node:path';
import { spawn } from 'node:child_process';
if (process.argv.includes('--version')) { appendFileSync(process.argv[1]+'.versions','1\\n'); console.log('0.1.7-rc.2'); process.exit(0); }
const mode = basename(process.argv[1]).split('.')[0];
const options = [{ id: 'model', category: 'model', type: 'select', name: 'Model', currentValue: '["deepseek-official","deepseek-flash"]', options: [{value:'["deepseek-official","deepseek-flash"]', name:'Flash'}] }, {id:'thinking', category:'thought_level', type:'select', name:'Thinking', currentValue:'off', options:[{value:'off',name:'Off'}]}];
const send = value => process.stdout.write(JSON.stringify({jsonrpc:'2.0',...value})+'\\n');
let pending;
createInterface({input:process.stdin}).on('line', line => {
 const message=JSON.parse(line), {id,method}=message;
 if(id==='permission-probe' && message.result){
   if(message.result.outcome.outcome!=='cancelled') process.exit(8);
   const input=JSON.parse(readFileSync('input.json','utf8'));
   writeFileSync('result.json',JSON.stringify(input.parts ? {taskId:input.taskId,inputIds:input.parts.map(p=>p.id),facts:'Fixed facts.'} : input.pairs ? {pairs:input.pairs.map(p=>({id:p.id,verdict:'unrelated',reason:'',evidence:['','']}))} : {contractVersion:2,newTopics:[],items:input.items.map(item=>({source:item.source,id:item.id,topics:['coding'],en:{title:item.title,summary:''},'zh-CN':{title:'中文标题',summary:''}}))}));
   send({id:pending,result:{stopReason:mode==='refusal'?'refusal':'end_turn'}});return;
 }
 if(method==='initialize') send({id,result:{protocolVersion:1,agentCapabilities:{},agentInfo:{name:'deepseek-harness-acp',version:'0.0.1'}}});
 else if(method==='session/new') send({id,result:{sessionId:'fixture',configOptions:options}});
 else if(method==='session/set_config_option') {const option=options.find(o=>o.id===message.params.configId);option.currentValue=message.params.value;send({id,result:{configOptions:options}});}
 else if(method==='session/prompt') {
  if(mode==='timeout') return;
  if(mode==='cancel') {writeFileSync('prompt-started','ready');return;}
  if(mode==='heldpipes') {
   const descendant=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:['ignore',process.stdout,process.stderr],windowsHide:true});
   writeFileSync('descendant-pid',String(descendant.pid));writeFileSync('prompt-started','ready');return;
  }
  if(mode==='flood') {
   for(let n=0;n<400;n++)send({method:'session/update',params:{sessionId:'fixture',update:{sessionUpdate:'tool_call',toolCallId:String(n),title:'Fixed tool',status:'in_progress',content:[{type:'content',content:{type:'text',text:'x'.repeat(n===0?70000:1024)}}]}}});
  }
  pending=id;
  send({id:'permission-probe',method:'session/request_permission',params:{sessionId:'fixture',toolCall:{toolCallId:'shell',title:'Forbidden shell',kind:'execute',status:'pending'},options:[{optionId:'allow',name:'Allow',kind:'allow_once'}]}});
 } else if(method==='session/close') send({id,result:{}});
});

`;
test('ACP rejects permissions, accepts fixed artifacts, rejects refusal and times out', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-acp-'));
  const previous = process.env.FEEDGARDEN_AGENT_API_KEY; process.env.FEEDGARDEN_AGENT_API_KEY = 'fixture-key';
  const item: Item = { id:'one',source:'openai',stream:'news',channel:'rss',title:'Title only',text:'',url:'https://example.test',publishedAt:'2026-09-28T00:00:00Z',observedAt:'2026-09-29T00:00:00Z',basis:'published',metrics:{} };
  try {
    for (const mode of ['success', 'refusal', 'timeout']) {
      const command = join(root, mode + '.mjs'); await writeFile(command, peer, {mode:0o700});
      const config = { ...configSchema.shape.agent.parse({ backend: 'dsh', model: 'deepseek/deepseek-flash' }), command, runtimeDirectory:root, timeoutSeconds:mode==='timeout'?0.6:5 };
      if(mode==='success') assert.equal((await generateBatch(config,{contractVersion:2,topics:{version:1,topics:[{id:'coding',name:{en:'Coding','zh-CN':'编程'},description:'Programming',aliases:[],deprecated:false}]},items:[item]})).output.items[0]?.id,'one');
      else await assert.rejects(generateBatch(config,{contractVersion:2,topics:{version:1,topics:[{id:'coding',name:{en:'Coding','zh-CN':'编程'},description:'Programming',aliases:[],deprecated:false}]},items:[item]}), mode==='refusal'?/refusal/:/timed out|aborted/i);
    }
  } finally { if(previous===undefined) delete process.env.FEEDGARDEN_AGENT_API_KEY; else process.env.FEEDGARDEN_AGENT_API_KEY=previous; await rm(root,{recursive:true,force:true}); }
});

test('ACP notification audit is bounded and exposes omitted counts', async () => {
 const root=await mkdtemp(join(tmpdir(),'feedgarden-acp-log-')),previous=process.env.FEEDGARDEN_AGENT_API_KEY;process.env.FEEDGARDEN_AGENT_API_KEY='fixture-key';
 try {
  const command=join(root,'flood.mjs');await writeFile(command,peer,{mode:0o700});
  const config={...configSchema.shape.agent.parse({backend:'dsh',model:'deepseek/deepseek-flash'}),command,runtimeDirectory:root};
  const result=await generateBatch(config,{contractVersion:2,topics:{version:1,topics:[]},items:[]});
  assert.ok(result.events.length>0 && result.events.length<=128);
  assert.ok(Buffer.byteLength(JSON.stringify(result.events))<66000);
  assert.equal(result.events.length+result.omittedNotifications!.events,400);
 }finally{if(previous===undefined)delete process.env.FEEDGARDEN_AGENT_API_KEY;else process.env.FEEDGARDEN_AGENT_API_KEY=previous;await rm(root,{recursive:true,force:true});}
});

test('ACP probes each executable version once while checking every configured version', async () => {
 const root=await mkdtemp(join(tmpdir(),'feedgarden-acp-version-')),previous=process.env.FEEDGARDEN_AGENT_API_KEY;process.env.FEEDGARDEN_AGENT_API_KEY='fixture-key';
 try {
  const command=join(root,'success.mjs');await writeFile(command,peer,{mode:0o700});
  const config={...configSchema.shape.agent.parse({backend:'dsh',model:'deepseek/deepseek-flash'}),command,runtimeDirectory:root};
  const input={contractVersion:2 as const,topics:{version:1 as const,topics:[]},items:[]};
  await generateBatch(config,input);await generateBatch(config,input);
  await assert.rejects(generateBatch({...config,version:'wrong-version'},input),/Expected DSH wrong-version/);
  assert.equal(await readFile(command+'.versions','utf8'),'1\n');
  const other=join(root,'other.mjs');await writeFile(other,peer,{mode:0o700});
  await generateBatch({...config,command:other},input);
  assert.equal(await readFile(other+'.versions','utf8'),'1\n');
 }finally{if(previous===undefined)delete process.env.FEEDGARDEN_AGENT_API_KEY;else process.env.FEEDGARDEN_AGENT_API_KEY=previous;await rm(root,{recursive:true,force:true});}
});

test('ACP runner cancellation stops an active prompt with the original lease failure', async () => {
 const root=await mkdtemp(join(tmpdir(),'feedgarden-acp-cancel-')),previous=process.env.FEEDGARDEN_AGENT_API_KEY;process.env.FEEDGARDEN_AGENT_API_KEY='fixture-key';
 try {
  const command=join(root,'cancel.mjs');await writeFile(command,peer,{mode:0o700});
  const config={...configSchema.shape.agent.parse({backend:'dsh',model:'deepseek/deepseek-flash'}),command,runtimeDirectory:root},cancellation=new AbortController(),reason=new Error('Lost database job lease');
  const pending=generateBatch(config,{contractVersion:2,topics:{version:1,topics:[]},items:[]},undefined,root,cancellation.signal);
  const deadline=Date.now()+5000;
  while(!(await stat(join(root,'prompt-started')).catch(()=>undefined))){assert.ok(Date.now()<deadline,'ACP peer must reach its active prompt');await new Promise(done=>setTimeout(done,10));}
  const rejected=assert.rejects(pending,error=>error===reason);
  cancellation.abort(reason);await rejected;
 }finally{if(previous===undefined)delete process.env.FEEDGARDEN_AGENT_API_KEY;else process.env.FEEDGARDEN_AGENT_API_KEY=previous;await rm(root,{recursive:true,force:true});}
});

test('ACP cancellation finishes even when a descendant keeps the stdio pipes open', async () => {
 const root=await mkdtemp(join(tmpdir(),'feedgarden-acp-pipes-')),previous=process.env.FEEDGARDEN_AGENT_API_KEY;process.env.FEEDGARDEN_AGENT_API_KEY='fixture-key';
 let descendant: number | undefined, pending: Promise<unknown> | undefined;
 try {
  const command=join(root,'heldpipes.mjs');await writeFile(command,peer,{mode:0o700});
  const config={...configSchema.shape.agent.parse({backend:'dsh',model:'deepseek/deepseek-flash'}),command,runtimeDirectory:root},cancellation=new AbortController(),reason=new Error('Lost lease while pipes were held');
  pending=generateBatch(config,{contractVersion:2,topics:{version:1,topics:[]},items:[]},undefined,root,cancellation.signal).then(()=>undefined,error=>error);
  const deadline=Date.now()+5000;
  while(!(await stat(join(root,'prompt-started')).catch(()=>undefined))){assert.ok(Date.now()<deadline);await new Promise(done=>setTimeout(done,10));}
  descendant=Number(await import('node:fs/promises').then(fs=>fs.readFile(join(root,'descendant-pid'),'utf8')));
  cancellation.abort(reason);
  let timer: NodeJS.Timeout | undefined;
  try { assert.equal(await Promise.race([pending,new Promise(done=>{timer=setTimeout(()=>done('cleanup hung'),4500);})]),reason); }
  finally {if(timer)clearTimeout(timer);}
 } finally {
  if(descendant)try{process.kill(descendant,'SIGKILL');}catch{}
  await pending;
  if(previous===undefined)delete process.env.FEEDGARDEN_AGENT_API_KEY;else process.env.FEEDGARDEN_AGENT_API_KEY=previous;
  await rm(root,{recursive:true,force:true});
 }
});

test('ACP cleanup has a deadline when the child never emits close', async t => {
 const root=await mkdtemp(join(tmpdir(),'feedgarden-acp-no-close-')),previous=process.env.FEEDGARDEN_AGENT_API_KEY;process.env.FEEDGARDEN_AGENT_API_KEY='fixture-key';
 const emit=ChildProcess.prototype.emit,children: ChildProcess[]=[];
 t.mock.method(ChildProcess.prototype,'emit',function(this: ChildProcess,event: string,...args: unknown[]){
  if(event==='close'&&this.spawnargs.includes('acp')){children.push(this);return false;}return Reflect.apply(emit,this,[event,...args]);
 });
 let pending: Promise<unknown> | undefined;
 try {
  const command=join(root,'cancel.mjs');await writeFile(command,peer,{mode:0o700});
  const config={...configSchema.shape.agent.parse({backend:'dsh',model:'deepseek/deepseek-flash'}),command,runtimeDirectory:root},cancellation=new AbortController(),reason=new Error('Missing close notification');
  pending=generateBatch(config,{contractVersion:2,topics:{version:1,topics:[]},items:[]},undefined,root,cancellation.signal).then(()=>undefined,error=>error);
  const deadline=Date.now()+5000;
  while(!(await stat(join(root,'prompt-started')).catch(()=>undefined))){assert.ok(Date.now()<deadline);await new Promise(done=>setTimeout(done,10));}
  cancellation.abort(reason);
  let timer: NodeJS.Timeout | undefined;
  try {assert.equal(await Promise.race([pending,new Promise(done=>{timer=setTimeout(()=>done('cleanup hung'),4500);})]),reason);}
  finally {if(timer)clearTimeout(timer);}
 } finally {
  t.mock.restoreAll();for(const child of children)Reflect.apply(emit,child,['close',0,null]);await pending;
  if(previous===undefined)delete process.env.FEEDGARDEN_AGENT_API_KEY;else process.env.FEEDGARDEN_AGENT_API_KEY=previous;
  await rm(root,{recursive:true,force:true});
 }
});


test('DSH ACP validates transcript and relation artifacts through the shared task contract', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-dsh-tasks-'));
  const previous = process.env.FEEDGARDEN_AGENT_API_KEY; process.env.FEEDGARDEN_AGENT_API_KEY = 'fixture-key';
  try {
    const command = join(root, 'success.mjs'); await writeFile(command, peer, { mode: 0o700 });
    const config = { ...configSchema.shape.agent.parse({ backend: 'dsh', command, model: 'deepseek/deepseek-flash', effort: 'off'}), runtimeDirectory: root };
    assert.deepEqual((await generateTask(config, 'transcript', { taskId: 'task', parts: [{ id: 'part', text: 'Fixed facts.' }], maxChars: 100 })).output, { taskId: 'task', inputIds: ['part'], facts: 'Fixed facts.' });
    assert.deepEqual((await generateTask(config, 'relations', { pairs: [{ id: 'pair', texts: ['one', 'two'] }] })).output, { pairs: [{ id: 'pair', verdict: 'unrelated', reason: '', evidence: ['', ''] }] });
  } finally {
    if (previous === undefined) delete process.env.FEEDGARDEN_AGENT_API_KEY; else process.env.FEEDGARDEN_AGENT_API_KEY = previous;
    await rm(root, { recursive: true, force: true });
  }
});
