import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { configSchema } from '../src/config.js';
import { generateBatch } from '../src/agent.js';
const { values } = parseArgs({ options: {
  'agent-version': { type: 'string' },
  'runtime-directory': { type: 'string' },
  output: { type: 'string', default: '.local/notes/0929/live-agent.json' },
} });
const config = configSchema.shape.agent.parse({ model: 'deepseek/deepseek-flash', effort: 'off',
  version: values['agent-version'], runtimeDirectory: values['runtime-directory'] });
const metadata = { checkedAt: new Date().toISOString(), model: config.model,
  dshVersion: config.version, nodeVersion: process.version };
try {
  const result = await generateBatch(config, [{ id: 'live-check', source: 'hackernews', stream: 'frontpage', channel: 'fixture',
    title: 'Feedgarden stores source data locally', text: 'Feedgarden stores raw source responses in SQLite and generates an English report with a matching Simplified Chinese translation.',
    url: 'https://sinputer.top/feedgarden/', publishedAt: new Date().toISOString(), observedAt: new Date().toISOString(), metrics: {}, basis: 'published' }]);
  await writeFile(values.output!, JSON.stringify({ ...metadata, status: 'passed', ...result }, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ ...metadata, status: 'passed', directory: result.directory, copies: result.copies, usage: result.usage }));
} catch (error) {
  const result = { ...metadata, status: 'failed', error: String(error) };
  await writeFile(values.output!, JSON.stringify(result, null, 2), { mode: 0o600 });
  console.error(JSON.stringify(result));
  process.exitCode = 1;
}
