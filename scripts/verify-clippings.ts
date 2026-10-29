import assert from 'node:assert/strict';
import { cp,mkdir,mkdtemp,readFile,writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { parse,stringify } from 'yaml';
import { run,validationEnvironment } from '../src/platform/process/execute.js';
import { checkClippings } from './clippings-check.js';
import { developmentConfig } from './development-config.js';
import { validationDirectory } from './validation-paths.js';
import { validationTheme } from './validation-theme.js';

const { values } = parseArgs({ options: { config: { type: 'string' }, gem: { type: 'string' }, help: { type: 'boolean' } } });
if (values.help) { console.log('Usage: npm run verify:clippings -- [--config FILE] [--gem PATH]\nBuild and check isolated content copies with the frozen published theme by default, or an explicit local gem. No database or publication access.'); process.exit(0); }
const project = process.cwd(), base = join(validationDirectory(developmentConfig(values.config)), 'clippings');
await mkdir(base, { recursive: true });
const root = await mkdtemp(join(base, 'run-'));
const environment = validationEnvironment();
const builder = await validationTheme(root, values.gem);
const config = parse(await readFile('.github/jekyll-obsidian.yml', 'utf8'));
// Use the real site configuration, disabling external analytics and comments in validation.
delete config.website.analytics;
delete config.website.comments;
const builds: Record<string, string> = {};
for (const name of ['fixture', 'production-copy']) {
  const host = join(root, name);
  await mkdir(join(host, '.github'), { recursive: true });
  await writeFile(join(host, '.github/jekyll-obsidian.yml'), stringify(config, { version: '1.1' }));
  if (name === 'production-copy') await cp('content', join(host, 'content'), { recursive: true });
  else {
    await mkdir(join(host, 'content/clippings'), { recursive: true });
    await mkdir(join(host, 'content/_translations/zh-CN'), { recursive: true });
    for (const file of ['index.md', '_locale.yml', '_translations/zh-CN/index.md', '_translations/zh-CN/_locale.yml', 'clippings/index.md']) await cp(join('content', file), join(host, 'content', file));
    await mkdir(join(host, 'content/clippings/assets'));
    await writeFile(join(host, 'content/clippings/assets/animated.gif'), Buffer.from('47494638396101000100800000000000ffffff21f904000a0000002c00000000010001000002024401003b', 'hex'));
    for (let i = 0; i < 52; i++) {
      const id = String(i).padStart(3, '0');
      const properties = { title: 'Clipping ' + id, lang: 'zh-CN',
        published: new Date(Date.UTC(2026, 9, 24, 0, i)).toISOString(), description: '单份手工摘录 ' + id,
        tags: [i % 2 ? 'models' : 'coding'], ...(i ? { source: 'https://example.invalid/clip-' + id, source_title: 'Original clipping ' + id } : {}) };
      await writeFile(join(host, 'content/clippings/clip-' + id + '.md'), '---\n' + stringify(properties, { version: '1.1' }) + '---\n\n共享正文 ' + id + '。这是一份本地验证素材。\n\n[[clippings/clip-000|同一板块链接]]\n' + (i === 51 ? '\n![inline](assets/animated.gif "animation")\n\n![reference][shared]\n\n[ordinary][shared]\n\n[shared]: assets/animated.gif\n' : ''));
    }
    await mkdir(join(host, 'content/arxiv'));
    await cp('content/arxiv/index.md', join(host, 'content/arxiv/index.md'));
    for (const source of ['arxiv', 'news']) await writeFile(join(host, 'content', source + '-item.md'), `---\npublish: true\ncontent_type: post\ntitle: ${source}\ndate: 2026-10-23\ntags: [source/${source}]\n---\nFixture ${source}.\n`);
  }
  console.log('Building ' + name + ' in ' + host);
  await builder.build(host);
  const output = join(host, '.jekyll-obsidian-cache/site'); builds[name] = output;
  for (const prefix of ['', 'zh-CN/']) {
    const html = await readFile(join(output, prefix, 'clippings/index.html'), 'utf8');
    assert.doesNotMatch(html, /class="translation-fallback"/);
    if (name === 'fixture') {
      const detail = await readFile(join(output, prefix, 'clippings/clip-051/index.html'), 'utf8');
      assert.match(detail, /lang="zh-CN"/); assert.match(detail, /共享正文 051/);
      const search = JSON.parse(await readFile(join(output, 'assets/website', prefix ? 'i18n/zh-CN/search.v1.json' : 'search.v1.json'), 'utf8'));
      assert.equal(search.documents.length, 54);
    }
  }
  await checkClippings(output, join(root, name + '-browser'), name === 'fixture');
}
await run(process.execPath, ['--import', 'tsx', 'scripts/visual-check.ts', ...(values.config ? ['--config', values.config] : [])], project, { ...environment, FEEDGARDEN_VISUAL_ROOT: builds['production-copy']!, FEEDGARDEN_VALIDATION_DIR: join(root, 'production-regression') });
await writeFile(join(root, 'results.json'), JSON.stringify({ theme: builder.identity, builds, browserChecks: 'passed', productionData: 'content copy only; no database opened' }, null, 2) + '\n');
console.log('Clippings validation passed: ' + root);
