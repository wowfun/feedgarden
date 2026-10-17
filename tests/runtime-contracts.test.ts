import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { reportSkill, reportTaskSkill } from '../src/report-skill.js';
import { configSchema } from '../src/config.js';
import { run, validationEnvironment } from '../src/build-site.js';
import { iso, isoDate } from '../src/util.js';
import { DateTime } from 'luxon';
import { apply as plugin } from '../src/dsh-plugin.mjs';
import { validateArtifact } from '../src/topics-contract.mjs';
import type { SummaryInput } from '../src/agent.js';
import { processCommand } from '../src/process-command.js';
import type { ToolDefinition, ToolRunContext } from '@deepseek-ai/dsh-tools';

test('Windows npm entrypoints use the running Node even when the shim directory has no node.exe', { skip: process.platform !== 'win32' }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-npm-shim-'));
  try {
    await mkdir(join(root, 'node_modules/npm/bin'), { recursive: true });
    await writeFile(join(root, 'node_modules/npm/bin/npm-cli.js'), 'console.log(JSON.stringify(process.argv.slice(2)))');
    const [program, args] = processCommand('npm', ['a b', 'x&y'], { PATH: root });
    assert.equal(program, process.execPath);
    assert.deepEqual(JSON.parse(execFileSync(program, args, { encoding: 'utf8' })), ['a b', 'x&y']);
    assert.throws(() => processCommand('npm', [], { PATH: '' }), /PATH/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('site validation children receive a fixed environment without provider, Git or proxy credentials', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-build-env-'));
  try {
    const env = validationEnvironment({ PATH: process.env.PATH, HOME: root, LANG: 'C.UTF-8', DEEPSEEK_API_KEY: 'fixture-secret', GITHUB_TOKEN: 'fixture-token', HTTPS_PROXY: 'https://user:password@example.test', NODE_OPTIONS: '--inspect', BUNDLE_GEMFILE: 'untrusted' });
    await run(process.execPath, ['-e', 'require("node:fs").writeFileSync("environment.json",JSON.stringify(process.env))'], root, env);
    const child = JSON.parse(await readFile(join(root, 'environment.json'), 'utf8')) as Record<string, string>;
    assert.equal(child.HOME, root);assert.equal(child.PATH, process.env.PATH);assert.equal(child.GIT_TERMINAL_PROMPT, '0');
    for (const name of ['DEEPSEEK_API_KEY', 'GITHUB_TOKEN', 'HTTPS_PROXY', 'NODE_OPTIONS', 'BUNDLE_GEMFILE']) assert.equal(child[name], undefined, name);
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('the DSH fixed tool and client agree on valid and invalid artifacts without overwriting accepted output', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-contract-parity-'));
  const input: SummaryInput = { contractVersion: 2, topics: { version: 1, topics: [{ id: 'coding', name: { en: 'Coding', 'zh-CN': '编程' }, description: 'Tools', aliases: [], deprecated: false }] }, items: [{ source: 'one', id: 'a', title: 'Only a title', text: '' }] };
  const artifact = { contractVersion: 2, newTopics: [], items: [{ source: 'one', id: 'a', topics: ['coding'], en: { title: 'Only a title', summary: '' }, 'zh-CN': { title: '只有标题', summary: '' } }] };
  try {
    await writeFile(join(root, 'input.json'), JSON.stringify(input));await writeFile(join(root, 'SKILL.md'), 'Fixed skill');
    const tools = new Map<string, ToolDefinition>();
    await plugin({ tools: { guard: () => () => {}, register: tool => { tools.set(tool.name, tool);return () => { tools.delete(tool.name); }; } }, provide: () => {} }, { directory: root });
    const result = tools.get('feedgarden_result');assert.ok(result);
    validateArtifact(artifact, input);await result.execute(artifact, {} as ToolRunContext);
    const accepted = await readFile(join(root, 'result.json'), 'utf8');
    const cases: unknown[] = [JSON.stringify(artifact), { ...artifact, path: '/outside' }, { ...artifact, items: [] }];
    for (const change of [ { id: 'wrong' }, { source: 'wrong' }, { topics: ['missing'] }, { topics: ['coding', 'coding'] }, { media: ['forged'] }, { en: { title: 'Only a title', summary: 'Unsupported body' } } ]) cases.push({ ...artifact, items: [{ ...artifact.items[0], ...change }] });
    for (const invalid of cases) {
      assert.throws(() => validateArtifact(invalid, input));await assert.rejects(result.execute(invalid, {} as ToolRunContext));
      assert.equal(await readFile(join(root, 'result.json'), 'utf8'), accepted);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('invalid date serialization fails at the boundary rather than producing null URLs or paths', () => {
  const invalid = DateTime.fromISO('not-a-date');
  assert.throws(() => iso(invalid, 'collection checkpoint'), /Invalid collection checkpoint/);
  assert.throws(() => isoDate(invalid, 'backup day'), /Invalid backup day/);
  assert.equal(iso(DateTime.fromISO('2026-10-11T00:00:00Z', { zone: 'utc' })), '2026-10-11T00:00:00.000Z');
});
test('trusted report skills do not depend on the caller working directory', async () => {
  const previous = process.cwd(), root = await mkdtemp(join(tmpdir(), 'feedgarden-skill-check-'));
  try {
    const trusted = await reportSkill(['one']);
    const transcript=await reportTaskSkill('transcript'),relations=await reportTaskSkill('relations');
    await mkdir(join(root,'.agents/skills/feedgarden-report'),{recursive:true});
    await writeFile(join(root,'.agents/skills/feedgarden-report/SKILL.md'),'Untrusted working-directory replacement');
    process.chdir(root);
    assert.equal(await reportSkill(['one']), trusted);
    assert.equal(await reportTaskSkill('transcript'),transcript);assert.equal(await reportTaskSkill('relations'),relations);
    await assert.rejects(reportTaskSkill('../../other' as any),/Unknown fixed report task/);
    assert.match(execFileSync(process.execPath, ['--import', pathToFileURL(join(previous, 'node_modules/tsx/dist/loader.mjs')).href, join(previous, 'scripts/live-collect.ts'), '--help'], { encoding: 'utf8' }), /Usage:/);
  } finally { process.chdir(previous);await rm(root, { recursive: true, force: true }); }
});
test('podcast channels require complete metadata and the built-in source identity', () => {
 const source={id:'podcast',name:'Podcasts',intervalHours:6,streams:[{id:'show',channels:[{id:'rss',kind:'podcast-rss',url:'https://example.test/feed',podcastName:'Show'}]}]};
 const valid={version:2,agent:{model:'deepseek/deepseek-flash'},sources:[source]};
 assert.ok(configSchema.safeParse(valid).success);
 assert.throws(()=>configSchema.parse({...valid,sources:[{...source,id:'other'}]}),/built-in podcast source ID/);
 for(const field of ['url','podcastName']){const invalid=structuredClone(valid);delete (invalid.sources[0]!.streams[0]!.channels[0]! as any)[field];assert.equal(configSchema.safeParse(invalid).success,false);}
 assert.equal(configSchema.safeParse({...valid,sources:[{...source,streams:[{id:'main',channels:[{id:'feed',kind:'feed',podcastName:'Show'}]}]}]}).success,false);
});
test('live collection rejects mistyped source IDs before creating an evidence directory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-collect-args-'));
  try {
    await writeFile(join(root, 'feedgarden.jsonc'), JSON.stringify({ version: 2, agent: { model: 'deepseek/deepseek-flash' }, sources: [{ id: 'one', name: 'One', intervalHours: 1, streams: [{ id: 'main', channels: [{ id: 'rss', kind: 'feed' }] }] }] }));
    assert.throws(() => execFileSync(process.execPath, ['--import', pathToFileURL(join(process.cwd(), 'node_modules/tsx/dist/loader.mjs')).href, join(process.cwd(), 'scripts/live-collect.ts'), 'typo'], { cwd: root, encoding: 'utf8', env: { ...process.env, FEEDGARDEN_VALIDATION_DIR: join(root, 'evidence') }, stdio: 'pipe' }), error => {
      assert.match(String((error as { stderr: string }).stderr), /Unknown or disabled source: typo/);return true;
    });
    await assert.rejects(stat(join(root, 'evidence')), { code: 'ENOENT' });
  } finally { await rm(root, { recursive: true, force: true }); }
});
