import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generateBatch } from '../src/agent.js';
import { configSchema } from '../src/config.js';
import type { Item } from '../src/types.js';

// Real stdio JSON-RPC exercises permission rejection and session cleanup without
// using a network or sending synthetic material to a paid model.
const peer = `#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync } from 'node:fs';
if (process.argv.includes('--version')) { console.log('0.1.7-rc.2'); process.exit(0); }
const mode = process.argv[1].split('/').at(-1).split('.')[0];
const options = [{ id: 'model', category: 'model', type: 'select', name: 'Model', currentValue: '["deepseek-official","deepseek-flash"]', options: [{value:'["deepseek-official","deepseek-flash"]', name:'Flash'}] }, {id:'thinking', category:'thought_level', type:'select', name:'Thinking', currentValue:'off', options:[{value:'off',name:'Off'}]}];
const send = value => process.stdout.write(JSON.stringify({jsonrpc:'2.0',...value})+'\\n');
let pending;
createInterface({input:process.stdin}).on('line', line => {
 const message=JSON.parse(line), {id,method}=message;
 if(id==='permission-probe' && message.result){
   if(message.result.outcome.outcome!=='cancelled') process.exit(8);
   const input=JSON.parse(readFileSync('input.json','utf8'));
   writeFileSync('result.json',JSON.stringify({contractVersion:2,newTopics:[],items:input.items.map(item=>({source:item.source,id:item.id,topics:['coding'],en:{title:item.title,summary:''},'zh-CN':{title:'中文标题',summary:''}}))}));
   send({id:pending,result:{stopReason:mode==='refusal'?'refusal':'end_turn'}});return;
 }
 if(method==='initialize') send({id,result:{protocolVersion:1,agentCapabilities:{},agentInfo:{name:'deepseek-harness-acp',version:'0.0.1'}}});
 else if(method==='session/new') send({id,result:{sessionId:'fixture',configOptions:options}});
 else if(method==='session/set_config_option') send({id,result:{configOptions:options}});
 else if(method==='session/prompt') {
  if(mode==='timeout') return;
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
      const config = { ...configSchema.shape.agent.parse({ model: 'deepseek/deepseek-flash' }), command, runtimeDirectory:root, timeoutSeconds:mode==='timeout'?0.6:5 };
      if(mode==='success') assert.equal((await generateBatch(config,{contractVersion:2,topics:{version:1,topics:[{id:'coding',name:{en:'Coding','zh-CN':'编程'},description:'Programming',aliases:[],deprecated:false}]},items:[item]})).output.items[0]?.id,'one');
      else await assert.rejects(generateBatch(config,{contractVersion:2,topics:{version:1,topics:[{id:'coding',name:{en:'Coding','zh-CN':'编程'},description:'Programming',aliases:[],deprecated:false}]},items:[item]}), mode==='refusal'?/refusal/:/timed out|aborted/i);
    }
  } finally { if(previous===undefined) delete process.env.FEEDGARDEN_AGENT_API_KEY; else process.env.FEEDGARDEN_AGENT_API_KEY=previous; await rm(root,{recursive:true,force:true}); }
});
