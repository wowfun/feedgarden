import assert from 'node:assert/strict';
import { cp,mkdir,writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { resolveAgent } from '../src/agent/index.js';
import { acceptedItems,collect,loadTopics,summarize,writeSite } from '../src/content/index.js';
import { configSchema } from '../src/contracts/configuration.js';
import { agentRuntime } from '../src/instance/index.js';
import { openDatabase } from '../src/storage/index.js';
import { developmentConfig } from './development-config.js';
import { validationDirectory as resolveValidationDirectory,validationContext } from './validation-paths.js';

const { values } = parseArgs({ options: { config: { type: 'string' } } });
const selected = developmentConfig(values.config);
const validationDirectory = resolveValidationDirectory(selected);
const root = join(validationDirectory, 'live-' + Date.now());
await mkdir(root, { recursive: true, mode: 0o700 });
await cp(selected.feed.topics, join(root, 'topics.json'));
const config = validationContext(configSchema.parse({
  version:3,instanceId:'00000000-0000-4000-8000-000000000001',
  storage: { dataDir: root },
  feed: { directory: join(root, 'content'), topics: join(root, 'topics.json') },
  agent: { ...selected.agent, ...selected.sources.find(source => source.id === 'openai')?.agent },
  sources: [{ id: 'openai', name: 'OpenAI', intervalHours: 6, streams: [{
    id: 'news', routes: [{ id: 'rss', kind: 'feed', url: 'https://openai.com/news/rss.xml' }],
  }] }],
}));
const store = openDatabase(config.paths.database), checkedAt = new Date().toISOString();
const evidencePath = join(validationDirectory, 'live-agent.json');
try {
  store.setMeta('cutoff', '1970-01-01T00:00:00.000Z');
  const collection = await collect(config, store);
  assert.ok(collection.some(row => 'fetchedItems' in row && (row.fetchedItems ?? 0) > 0));

  // Keep a bounded sample of actual collected items for the paid live run.
  const all = store.items('openai');
  const kept = all.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 3);
  const ids = new Set(kept.map(item => item.id));
  for (const item of all) {
    if (!ids.has(item.id)) store.archives.exclude(item.source, item.id);
  }
  const now = new Date().toISOString();
  store.saveCollection('openai', 'news', 'fixture', {
    raw: [], coverage: { status: 'complete', to: now, notes: [] },
    items: [{ id: 'live-title-only', source: 'openai', stream: 'news', channel: 'fixture',
      title: 'Local storage for feed summaries', text: '', url: 'https://example.invalid/title-only',
      publishedAt: now, observedAt: now, basis: 'published', metrics: {} }],
  }, '');

  const resolved = await resolveAgent(agentRuntime(config));
  const result = await summarize(config, store, { resolveAgent: async () => resolved });
  assert.equal(result.generated, 4); assert.equal(result.failed, 0); assert.equal(result.pending, 0);
  const records = acceptedItems(store);
  assert.equal(records.length, 4);
  assert.equal(records.find(row => row.item.id === 'live-title-only')?.copy.en.summary, '');
  await writeSite(config, store);
  const calls = store.modelCallRecords();
  const evidence = { checkedAt, node: process.version, agent: resolved.execution,
    status: 'passed', root, collection, accepted: records, calls, topics: await loadTopics(config.feed.topics) };
  await writeFile(evidencePath, JSON.stringify(evidence, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ checkedAt, status: 'passed', root, accepted: records.length, calls: calls.length, agent: resolved.execution }));
} catch (error) {
  await writeFile(evidencePath, JSON.stringify({ checkedAt, status: 'failed', root, error: String(error) }, null, 2), { mode: 0o600 });
  throw error;
} finally { store.close(); }
