import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, cp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { configSchema } from '../src/config.js';
import { Store } from '../src/store.js';
import { publish } from '../src/publish.js';
import { writeSite } from '../src/site.js';
import { loadTopics } from '../src/topics.js';
const git=(cwd:string,...args:string[])=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
test('local bare-Git publication isolates managed paths, merges additions, refuses conflicts and rejects races without force',async()=>{
 const project=process.cwd(),temporary=await mkdtemp(join(tmpdir(),'feedgarden-publish-')),root=join(temporary,'local'),remote=join(temporary,'remote.git'),other=join(temporary,'other');await mkdir(root);
 let store:Store|undefined;
 try{
  await mkdir(join(root,'.github'));await mkdir(join(root,'config/locales'),{recursive:true});await cp('config/locales',join(root,'config/locales'),{recursive:true});await cp('config/topics.json',join(root,'config/topics.json'));await writeFile(join(root,'.github/jekyll-obsidian.yml'),'website:\n  source: content\n');await writeFile(join(root,'.gitignore'),'.local/\n');await writeFile(join(root,'README.md'),'Original code');
  git(root,'init','-q','-b','main');git(root,'config','user.name','Fixture');git(root,'config','user.email','fixture@example.invalid');
  const config=configSchema.parse({version:2,storage:{directory:'.local',database:'.local/data.sqlite'},feed:{directory:'content',topics:'config/topics.json'},publish:{repository:remote,branch:'main'},agent:{model:'deepseek/deepseek-flash'},sources:[{id:'one',name:'One',intervalHours:1,streams:[{id:'main',channels:[{id:'rss',kind:'feed'}]}]}]});
  process.chdir(root);store=new Store(config.storage.database);await writeSite(config,store);git(root,'add','.');git(root,'commit','-qm','Base');git(temporary,'init','--bare','-q',remote);git(root,'remote','add','origin',remote);git(root,'push','-q','origin','main');git(temporary,'clone','-q','--branch','main',remote,other);git(other,'config','user.name','Other');git(other,'config','user.email','other@example.invalid');
  const add=(id:string)=>({id,name:{en:id,'zh-CN':id+'中文'},description:'A new reusable topic',aliases:[],deprecated:false});
  const local=await loadTopics('config/topics.json');local.topics.push(add('local-topic'));await writeFile('config/topics.json',JSON.stringify(local));
  const remoteRegistry=JSON.parse(await readFile(join(other,'config/topics.json'),'utf8'));remoteRegistry.topics.push(add('remote-topic'));await writeFile(join(other,'config/topics.json'),JSON.stringify(remoteRegistry));git(other,'add','config/topics.json');git(other,'commit','-qm','Remote topic');git(other,'push','-q');
  await writeFile('README.md','Uncommitted local code');let validated=0;
  await publish(config,store,async(worktree)=>{validated++;assert.equal(await readFile(join(worktree,'README.md'),'utf8'),'Original code');assert.ok(JSON.parse(await readFile(join(worktree,'config/topics.json'),'utf8')).topics.some((t:any)=>t.id==='remote-topic'));});assert.equal(validated,1);assert.equal(await readFile('README.md','utf8'),'Uncommitted local code');
  const published=git(root,'rev-parse','FETCH_HEAD');git(other,'pull','-q','--ff-only');assert.ok(JSON.parse(await readFile(join(other,'config/topics.json'),'utf8')).topics.some((t:any)=>t.id==='local-topic'));
  const current=await loadTopics('config/topics.json');current.topics[0]!.description='Local conflicting description';await writeFile('config/topics.json',JSON.stringify(current));
  const conflict=JSON.parse(await readFile(join(other,'config/topics.json'),'utf8'));conflict.topics[0].description='Remote conflicting description';await writeFile(join(other,'config/topics.json'),JSON.stringify(conflict));git(other,'add','config/topics.json');git(other,'commit','-qm','Conflicting topic');git(other,'push','-q');
  const remoteBefore=git(other,'rev-parse','HEAD');await assert.rejects(publish(config,store,async()=>{throw new Error('Must reject before validation');}),/Topic merge conflicts/);assert.equal(git(remote,'rev-parse','refs/heads/main'),remoteBefore);assert.equal((await loadTopics('config/topics.json')).topics[0]!.description,'Local conflicting description');
  // Resolve through the documented base record, then force a concurrent remote update after validation.
  await writeFile('config/topics.json',JSON.stringify(conflict));await writeFile('.local/topic-remote-base.json',JSON.stringify({commit:remoteBefore,registry:conflict}));const racing=await loadTopics('config/topics.json');racing.topics.push(add('racing-topic'));await writeFile('config/topics.json',JSON.stringify(racing));
  await assert.rejects(publish(config,store,async()=>{await writeFile(join(other,'README.md'),'Concurrent remote code');git(other,'add','README.md');git(other,'commit','-qm','Concurrent update');git(other,'push','-q');}),/git exited/);assert.equal(git(remote,'rev-parse','refs/heads/main'),git(other,'rev-parse','HEAD'));assert.ok((await loadTopics('config/topics.json')).topics.some(t=>t.id==='racing-topic'));assert.equal(git(root,'worktree','list','--porcelain').split('worktree ').length,2);
 }finally{store?.close();process.chdir(project);await rm(temporary,{recursive:true,force:true});}
});
