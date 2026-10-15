import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { XMLValidator, XMLParser } from 'fast-xml-parser';
test('generated schedulers preserve exclusion of concurrent runs without a conflicting whole-run timeout', async () => {
 const root=await mkdtemp(join(tmpdir(),'feedgarden-schedule-'));
 try {
  await promisify(execFile)(process.execPath,['--import','tsx',resolve('scripts/schedule.ts'),'--output',root,'--distro','Fixture distro']);
  const service=await readFile(join(root,'feedgarden.service'),'utf8');assert.match(service,/Type=oneshot/);assert.match(service,/TimeoutStartSec=infinity/);
  const xml=await readFile(join(root,'Feedgarden.xml'),'utf8');assert.equal(XMLValidator.validate(xml),true);
  const settings=new XMLParser().parse(xml).Task.Settings;assert.equal(settings.ExecutionTimeLimit,'PT0S');assert.equal(settings.MultipleInstancesPolicy,'IgnoreNew');
  execFileSync('bash',['-n'],{input:await readFile(join(root,'run.sh'))});
 }finally{await rm(root,{recursive:true,force:true});}
});
