import assert from 'node:assert/strict';
import { mkdir,mkdtemp,rm,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { agentIdentity,configuredAgent,createAgentResolver } from '../../src/agent/index.js';
import { relate,summarize,transcriptStep,type Generator } from '../../src/content/index.js';
import { type AgentResolver,type ResolvedAgent } from '../../src/contracts/agent.js';
import { configSchema } from '../../src/contracts/configuration.js';
import type { Item } from '../../src/contracts/items.js';
import { agentRuntime } from '../../src/instance/index.js';
import { hash } from '../../src/platform/hash.js';
import { testContext } from '../support/context.js';
import { TestDatabase as Store } from '../support/database.js';
import { snapshotPublications } from '../support/fixtures/core-publications.js';
import { agentVersion } from '../../src/agent/backends.js';

test('backend version probes leave the event loop available for lease heartbeats',async()=>{
  const root=await mkdtemp(join(tmpdir(),'fdg-version-')),command=join(root,'version.mjs');
  await writeFile(command,"setTimeout(()=>console.log('opencode v2.0.31'),150);");
  let ticks=0;const timer=setInterval(()=>ticks++,5);
  try { assert.equal(await agentVersion(configSchema.shape.agent.parse({command})),'2.0.31');assert.ok(ticks>0); }
  finally { clearInterval(timer);await rm(root,{recursive:true,force:true}); }
});

const at = '2026-10-17T04:00:00.000Z';
const generator: Generator = async (_agent, input, _repair, directory) => ({ directory: directory!, usage: [], events: [], output: { contractVersion: 2, newTopics: [], items: input.items.map(item => ({ source: item.source, id: item.id, topics: ['coding'], en: { title: item.title, summary: '' }, 'zh-CN': { title: '中文标题', summary: '' } })) } });

test('model routing changes preserve accepted semantic recipes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-agent-identity-'));
  const config = testContext({ version:3,instanceId:'00000000-0000-4000-8000-000000000001', storage: { dataDir: root }, feed: { directory: join(root, 'content'), topics: join(root, 'topics.json') }, agent: {  }, sources: ['one', 'two'].map(id => ({ id, name: id, intervalHours: 1, streams: [{ id: 'main', routes: [{ id: 'feed', kind: 'feed' }] }] })) });
  await writeFile(config.feed.topics, JSON.stringify({ version: 1, topics: [{ id: 'coding', name: { en: 'Coding', 'zh-CN': '编程' }, description: 'Tools', aliases: [], deprecated: false }] }));
  const store = new Store(config.paths.database);
  let defaults = { model: 'fixture/one', effort: 'low', configurationHash: 'first', version: '2.0.31' }, resolves = 0;
  const resolver: AgentResolver = async requested => {
    resolves++;
    const agent = await configuredAgent({ ...requested, model: requested.model ?? defaults.model, effort: requested.effort ?? defaults.effort });
    agent.execution.configurationHash = defaults.configurationHash;
    agent.execution.version = defaults.version;
    return agent;
  };
  try {
    store.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
    for (const source of ['one', 'two']) {
      const item: Item = { source, id: 'a', stream: 'main', channel: 'feed', title: 'Title', text: '', url: 'https://example.test/' + source, publishedAt: at, observedAt: at, basis: 'published', metrics: {} };
      store.saveCollection(source, 'main', 'feed', { items: [item], raw: [], coverage: { status: 'complete', to: at, notes: [] } }, '');
    }
    const run = () => summarize(config, store, { resolveAgent: resolver }, generator, at, async item => item);
    assert.equal((await run()).generated, 2); assert.equal(resolves, 1, 'sources sharing a configuration reuse its resolution within the run');
    assert.equal((await run()).generated, 0);
    for (const changed of [{ ...defaults, effort: 'high' }, { ...defaults, model: 'fixture/two' }, { ...defaults, configurationHash: 'second' }, { ...defaults, version: '2.0.32' }]) {
      defaults = changed; assert.equal((await run()).generated, 0);
    }
    defaults.version = '2.0.33'; assert.equal((await run()).generated, 0);
    config.sources[1]!.agent = { model: 'fixture/source', effort: 'off' };
    assert.equal((await run()).generated, 0);
    config.agent = { ...config.agent, backend: 'dsh', model: 'deepseek/deepseek-flash', effort: 'off' };
    assert.equal((await run()).generated, 0);
    await summarize(config,store,{rebuild:true,resolveAgent:resolver},generator,at,async item=>item);
    const audit = JSON.parse((store.db.prepare("SELECT usage FROM agent_calls WHERE status='succeeded' ORDER BY id DESC LIMIT 1").get() as { usage: string }).usage);
    assert.equal(audit.execution.backend, 'dsh'); assert.equal(audit.execution.effort, 'off'); assert.deepEqual(audit.updates, []);

    await mkdir(config.feed.directory);
    for (const side of ['a', 'b']) await writeFile(join(config.feed.directory, side + '.md'), `---\npublish: true\ncontent_type: post\ntitle: Atlas release\ndate: ${at}\nsource_url: https://example.test/${side}\n---\nAtlas released Model One with open weights.\n`);
    const relationGenerator = async (_a: unknown, _kind: unknown, value: any, _repair: unknown, directory: string | undefined) => ({ output: { pairs: value.pairs.map((pair: any) => ({ id: pair.id, verdict: 'unrelated', reason: '', evidence: ['', ''] })) }, directory: directory!, usage: [], events: [] });
    const relations = async () => { await snapshotPublications(config,store); return relate(config, store, { resolveAgent: resolver, generator: relationGenerator, at }); };
    assert.ok((await relations()).judged > 0); assert.equal((await relations()).judged, 0);
    config.agent = { ...config.agent, backend: 'opencode' };
    assert.equal((await relations()).judged, 0);
    defaults.configurationHash = 'third'; assert.equal((await relations()).judged, 0);
    defaults.version = '2.0.34'; assert.equal((await relations()).judged, 0);

    const body = 'Fixed transcript facts.';
    store.db.prepare('INSERT INTO podcast_transcripts VALUES (?,?,?,?,?,?)').run('podcast', 'episode', body, hash(body), 'https://example.test/transcript', at);
    const episode: Item = { id: 'episode', source: 'podcast', stream: 'show', channel: 'rss', title: 'Episode', text: '', url: 'https://example.test/episode', publishedAt: at, observedAt: at, basis: 'published', metrics: {}, metadata: { transcriptHash: hash(body) } };
    const agent = await resolver(agentRuntime(config));
    const reduce = async (_a: unknown, _kind: unknown, input: any, _repair: unknown, directory: string | undefined) => ({ output: { taskId: input.taskId, inputIds: input.parts.map((part: any) => part.id), facts: body }, directory: directory!, usage: [], events: [] });
    await transcriptStep(episode, store, agent, true, undefined, false, reduce);
    assert.equal((await transcriptStep(episode, store, agent, false)).ready, true);
    for (const changed of [{ ...agent, effort: 'high' }, { ...agent, model: 'fixture/other' }, { ...agent, backend: 'dsh' as const }, { ...agent, execution: { ...agent.execution, configurationHash: 'fourth' } }, { ...agent, execution: { ...agent.execution, version: '2.0.35' } }]) assert.equal((await transcriptStep(episode, store, changed as ResolvedAgent, false)).ready, true);
  } finally { store.close(); await rm(root, { recursive: true, force: true }); }
});

test('resolver shares in-flight probes, evicts failures and retains successful resolutions', async () => {
  const agent = { ...configSchema.shape.agent.parse({ model: 'fixture/one' }), runtimeDirectory: tmpdir() };
  let probes = 0;
  const resolver = createAgentResolver(async config => {
    if (++probes === 1) throw new Error('Transient startup failure');
    return configuredAgent(config);
  });
  const first = resolver(agent), concurrent = resolver(agent);
  assert.equal(first, concurrent);
  assert.deepEqual((await Promise.allSettled([first, concurrent])).map(result => result.status), ['rejected', 'rejected']);
  const recovered = await resolver(agent);
  assert.equal(await resolver(agent), recovered);
  assert.equal(probes, 2);
});

test('cache identity refuses unresolved models', () => {
  assert.throws(() => agentIdentity(configSchema.shape.agent.parse({})), /resolved model/i);
});

test('injected generators preserve an already resolved native execution identity', async () => {
  const resolved = await configuredAgent({ ...configSchema.shape.agent.parse({ model: 'fixture/one' }), runtimeDirectory: tmpdir() });
  resolved.execution = { ...resolved.execution, version: '2.0.31', configurationHash: 'provider-route' };
  assert.equal(await configuredAgent(resolved), resolved);
});

async function planningFixture() {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-agent-planning-'));
  const config = testContext({ version:3,instanceId:'00000000-0000-4000-8000-000000000001', storage: { dataDir: root }, feed: { directory: join(root, 'content'), topics: join(root, 'topics.json') }, agent: { model: 'fixture/one' }, sources: ['one', 'two'].map(id => ({ id, name: id, intervalHours: 1, streams: [{ id: 'main', routes: [{ id: 'feed', kind: 'feed' }] }] })) });
  await writeFile(config.feed.topics, JSON.stringify({ version: 1, topics: [{ id: 'coding', name: { en: 'Coding', 'zh-CN': '编程' }, description: 'Tools', aliases: [], deprecated: false }] }));
  const store = new Store(config.paths.database);
  store.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
  const seed = () => {
    for (const source of ['one', 'two']) {
      const item: Item = { source, id: 'a', stream: 'main', channel: 'feed', title: 'Title', text: '', url: 'https://example.test/' + source, publishedAt: at, observedAt: at, basis: 'published', metrics: {} };
      store.saveCollection(source, 'main', 'feed', { items: [item], raw: [], coverage: { status: 'complete', to: at, notes: [] } }, '');
    }
  };
  return { config, store, seed, cleanup: async () => { store.close(); await rm(root, { recursive: true, force: true }); } };
}

for (const shared of [false, true]) test('source probe failure preserves healthy work and reports errors: ' + (shared ? 'shared transient configuration' : 'unsupported source override'), async () => {
  const f = await planningFixture(); let probes = 0;
  try {
    f.seed();
    if (!shared) f.config.sources[0]!.agent = { model: 'fixture/missing' };
    const resolver: AgentResolver = async requested => {
      probes++;
      if (shared ? probes === 1 : requested.model === 'fixture/missing') throw new Error('Unsupported or unavailable model');
      return configuredAgent(requested);
    };
    const result = await summarize(f.config, f.store, { resolveAgent: resolver }, generator, at, async item => item);
    assert.equal(result.generated, 1);
    assert.deepEqual(result.sourceErrors, [{ source: 'one', error: 'Unsupported or unavailable model' }]);
    assert.equal((f.store.db.prepare("SELECT count(*) n FROM feed_summaries WHERE source='two'").get() as { n: number }).n, 1);
    assert.equal((f.store.db.prepare("SELECT count(*) n FROM feed_planning WHERE source='one'").get() as { n: number }).n, 1);
    assert.equal((f.store.db.prepare('SELECT count(*) n FROM agent_calls').get() as { n: number }).n, 1, 'failed probes spend no model quota');
  } finally { await f.cleanup(); }
});

test('summary planning skips probes for empty sources and sources outside the cutoff', async () => {
  const f = await planningFixture();
  try {
    let probes = 0;
    const resolver: AgentResolver = async () => { probes++; throw new Error('No eligible work'); };
    assert.equal((await summarize(f.config, f.store, { resolveAgent: resolver }, generator, at)).generated, 0);
    f.seed(); f.store.setMeta('cutoff', '2026-10-18T00:00:00.000Z');
    assert.equal((await summarize(f.config, f.store, { resolveAgent: resolver }, generator, at)).generated, 0);
    assert.equal(probes, 0);
  } finally { await f.cleanup(); }
});

test('relation planning skips probes when no candidate pair exists', async () => {
  const f = await planningFixture();
  try {
    const resolver: AgentResolver = async () => { throw new Error('No candidates need resolution'); };
    await snapshotPublications(f.config,f.store);
    assert.deepEqual(await relate(f.config, f.store, { resolveAgent: resolver, at }), { candidates: 0, judged: 0, pending: 0, deferred: false });
  } finally { await f.cleanup(); }
});

test('source probe isolation propagates cancellation', async () => {
  const f = await planningFixture(); const controller = new AbortController(), reason = new Error('Cancelled during probe');
  try {
    f.seed();
    const resolver: AgentResolver = async () => { controller.abort(reason); throw reason; };
    await assert.rejects(summarize(f.config, f.store, { resolveAgent: resolver, signal: controller.signal }, generator, at), error => error === reason);
  } finally { await f.cleanup(); }
});

test('probe and planning gates agree across excluded, archived, accepted and cutoff states', async () => {
  const scenarios = [
    { name: 'fresh', probes: 1, generated: 1 },
    { name: 'excluded', excluded: true, probes: 0, generated: 0 },
    { name: 'archived', archived: true, probes: 0, generated: 0 },
    { name: 'archived refresh', archived: true, refresh: true, probes: 1, generated: 1 },
    { name: 'archived rebuild', archived: true, rebuild: true, probes: 1, generated: 1 },
    { name: 'accepted archive', archived: true, accepted: true, probes: 1, generated: 0 },
    { name: 'accepted rebuilt archive', archived: true, accepted: true, rebuild: true, probes: 1, generated: 1 },
    { name: 'excluded rebuild', excluded: true, rebuild: true, probes: 0, generated: 0 },
    { name: 'outside cutoff', stale: true, probes: 0, generated: 0 },
    { name: 'outside cutoff rebuild', stale: true, rebuild: true, probes: 0, generated: 0 },
  ];
  for (const scenario of scenarios) {
    const f = await planningFixture(); let probes = 0;
    try {
      f.seed(); f.config.sources[1]!.enabled = false;
      if (scenario.accepted) await summarize(f.config, f.store, {}, generator, at, async item => item);
      if (scenario.archived) f.store.db.prepare('INSERT INTO feed_archives VALUES (?,?,?,?,?,?,?,?)').run('one/archive.md', 'one', 'a', '2026-10-17', 1, null, '{}', '{}');
      if (scenario.excluded) f.store.db.prepare('INSERT INTO feed_excluded VALUES (?,?)').run('one', 'a');
      if (scenario.stale) f.store.setMeta('cutoff', '2026-10-18T00:00:00.000Z');
      const resolver: AgentResolver = async requested => { probes++; return configuredAgent(requested); };
      const result = await summarize(f.config, f.store, { refresh: scenario.refresh, rebuild: scenario.rebuild, resolveAgent: resolver }, generator, at, async item => item);
      assert.equal(probes, scenario.probes, scenario.name + ' probes');
      assert.equal(result.generated, scenario.generated, scenario.name + ' generated');
      assert.deepEqual(result.sourceErrors, []);
    } finally { await f.cleanup(); }
  }
});

for (const takeover of [false, true]) test('relation configuration isolation propagates ' + (takeover ? 'lost ownership' : 'cancellation'), async () => {
  const f = await planningFixture(), cancellation = new AbortController(), reason = new Error('Cancelled relation probe');
  try {
    await mkdir(f.config.feed.directory);
    for (const name of ['a', 'b']) await writeFile(join(f.config.feed.directory, name + '.md'), `---\npublish: true\ncontent_type: post\ntitle: Atlas validation pipeline\ndate: ${at}\nsource_url: https://example.test/${name}\n---\nAtlas releases a configurable validation pipeline with deterministic input records and structured diagnostics.\n`);
    if (takeover) f.store.acquireLease('fixture');
    const resolver: AgentResolver = async () => {
      if (takeover) f.store.db.prepare("UPDATE job_lease SET owner='other'").run();
      else cancellation.abort(reason);
      throw reason;
    };
    await snapshotPublications(f.config,f.store);
    await assert.rejects(relate(f.config, f.store, { resolveAgent: resolver, signal: cancellation.signal, at }), error => takeover ? /Lost database job lease/.test(String(error)) : error === reason);
  } finally { await f.cleanup(); }
});
