import type { SummaryInput } from '../src/agent.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parse } from 'yaml';
import { readHnArticle, articleQuote } from '../src/hackernews.js';
import { enrichItem } from '../src/source-content.js';
import { publicAddress, assertPublicUrl } from '../src/public-url.js';
import { Http } from '../src/http.js';
import { Store } from '../src/store.js';
import { summaryItem, summarize, acceptedItems, type Generator, type AcceptedItem } from '../src/items.js';
import { configSchema } from '../src/config.js';
import { renderItem, writeSite } from '../src/site.js';
import { validateArtifact } from '../src/topics-contract.mjs';
import { reportSkill } from '../src/report-skill.js';
import { apply as dshPlugin } from '../src/dsh-plugin.mjs';
const api = 'https://hacker-news.firebaseio.com/v0/item/';
const item = { source: 'hackernews', stream: 'frontpage', channel: 'firebase', id: '100', title: 'Original article', text: '', url: 'https://example.com/article', publishedAt: '2026-10-09T00:00:00Z', observedAt: '2026-10-09T01:00:00Z', basis: 'published', metrics: {} } as const;
const topics = { version: 1 as const, topics: [{ id: 'coding', name: { en: 'Coding', 'zh-CN': '编程' }, description: 'Tools', aliases: [], deprecated: false }] };
function cache(store: Store, url: string, body: unknown, type = 'application/json') { store.saveCache({ url, status: 200, fetchedAt: new Date().toISOString(), headers: { 'content-type': type }, body: typeof body === 'string' ? body : JSON.stringify(body) }); }
function seed(store: Store) {
  cache(store, item.url, '<article><h1>Design</h1><p>' + 'A bounded system uses evidence to explain its behavior. '.repeat(30) + '</p><img src="/diagram.png" alt="Architecture diagram"></article>', 'text/html');
  cache(store, api + item.id + '.json', { id: 100, type: 'story', descendants: 9, kids: [5, 2, 3, 4] });
  cache(store, api + '5.json', { id: 5, type: 'comment', parent: 100, by: 'deleted', deleted: true });
  cache(store, api + '2.json', { id: 2, type: 'comment', parent: 100, by: 'first', text: 'First argument.<p>Practical experience.', kids: [20] });
  cache(store, api + '20.json', { id: 20, type: 'comment', parent: 2, by: 'reply', text: 'A qualified disagreement.' });
  cache(store, api + '3.json', { id: 3, type: 'comment', parent: 100, by: 'second', text: 'A different approach.' });
  cache(store, api + '4.json', { id: 4, type: 'comment', parent: 999, by: 'wrong-story', text: 'Unrelated evidence.' });
}

test('Readability extracts original prose without executing scripts; short originals become verbatim excerpts', () => {
  const html = '<html><head><title>Design</title></head><body><nav>Navigation</nav><article><h1>Design</h1><p>A bounded system has a clearly defined ownership model and rejects invalid transitions before they can produce effects.</p></article><script>globalThis.leaked=true</script><footer>Footer</footer></body></html>';
  const article = readHnArticle(html, item.url)!;
  assert.ok(article.text.startsWith('A bounded system has a clearly defined ownership model'));
  assert.ok(!article.text.includes('Navigation') && !article.text.includes('Footer'));
  assert.equal((globalThis as any).leaked, undefined);
  const quote = articleQuote(article.text)!;
  assert.ok(article.text.startsWith(quote)); assert.ok(quote.split(/\s+/).length <= 25);
  assert.equal(articleQuote('Long source '.repeat(100)), undefined);
  assert.equal(readHnArticle('<article><p>Sign in to continue reading this article.</p></article>', item.url), undefined);
});

test('public article requests reject private addresses, mixed DNS results, credentials and private redirects', async () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.1.2', '::1', '::ffff:127.0.0.1', 'fc00::1']) assert.equal(publicAddress(address), false);
  assert.ok(publicAddress('8.8.8.8')); assert.ok(publicAddress('2606:4700:4700::1111'));
  await assert.rejects(assertPublicUrl('http://localhost/x'));
  await assert.rejects(assertPublicUrl('http://user:pass@example.com/x'));
  await assert.rejects(assertPublicUrl('https://example.com', async () => [{ address: '8.8.8.8', family: 4 }, { address: '10.0.0.1', family: 4 }]));
  const store = new Store(':memory:'); const requests: string[] = [];
  try {
    const http = new Http(store, async url => { requests.push(String(url)); return new Response('', { status: 302, headers: { location: 'http://127.0.0.1/private' } }); });
    await assert.rejects(http.get('https://8.8.8.8/article', 0, 'fetch', true), /non-public/);
    assert.deepEqual(requests, ['https://8.8.8.8/article']);
  } finally { store.close(); }
});

test('public article redirects also respect the destination robots policy', async () => {
  const store = new Store(':memory:'), requests: string[] = [];
  try {
    const http = new Http(store, async value => {
      const url = String(value); requests.push(url);
      if (url === 'https://8.8.8.8/robots.txt') return new Response('User-agent: *\nAllow: /');
      if (url === 'https://8.8.8.8/article') return new Response('', { status: 302, headers: { location: 'https://1.1.1.1/private' } });
      if (url === 'https://1.1.1.1/robots.txt') return new Response('User-agent: *\nDisallow: /private');
      throw new Error('Destination article must not be fetched');
    });
    await assert.rejects(http.page('https://8.8.8.8/article', 0, true), /robots.txt disallows/);
    assert.deepEqual(requests, ['https://8.8.8.8/robots.txt', 'https://8.8.8.8/article', 'https://1.1.1.1/robots.txt']);
  } finally { store.close(); }
});

test('HN enrichment keeps ranked parents with contextual replies, omits deleted and unrelated comments, and reuses caches', async () => {
  const store = new Store(':memory:'); let requests = 0;
  try {
    seed(store);
    const http = new Http(store, async () => { requests++; throw new Error('Unexpected request'); });
    const enriched = await enrichItem(item, store, http);
    assert.equal(requests, 0); assert.equal(http.raw.length, 0);
    assert.ok(enriched.text.length > 1000); assert.equal(enriched.articleQuote, undefined);
    assert.deepEqual(enriched.discussion?.comments.map(comment => comment.id), ['2', '20', '3']);
    assert.equal(enriched.discussion?.comments[0]?.text, 'First argument. Practical experience.');
    assert.equal(enriched.discussion?.comments[1]?.parent, '2');
    assert.equal(enriched.discussion?.partial, true); assert.equal(enriched.discussion?.totalComments, 9);
    assert.equal(enriched.media?.[0]?.url, 'https://example.com/diagram.png');
    const input = summaryItem(enriched, 4000);
    assert.ok(!input.text.includes('First argument'));
    assert.deepEqual(input.discussion?.comments.map(comment => comment.id), ['2', '20', '3']);
    assert.ok(!JSON.stringify(input).includes('hnArticleFetchedAt'));
    const signal = AbortSignal.abort(new Error('Cancelled'));
    await assert.rejects(enrichItem(item, store, new Http(store, undefined, signal)), /Cancelled/);
  } finally { store.close(); }
});

test('HN comment requests are bounded while preserving original rank and excluding malformed parentage', async () => {
  const store = new Store(':memory:'); const requests: string[] = [];
  try {
    const original = { ...item, url: 'https://news.ycombinator.com/item?id=100', text: 'Short original post with concrete information and a useful question.' };
    const http = new Http(store, async value => {
      const url = String(value); requests.push(url); const id = Number(url.match(/item\/(\d+)\.json/)?.[1]);
      return Response.json(id === 100 ? { id, type: 'story', descendants: 300, kids: Array.from({ length: 40 }, (_, i) => i + 200) } : id < 1000 ? { id, type: 'comment', parent: 100, by: 'user', text: 'A useful argument with evidence.', kids: [id + 1000] } : { id, type: 'comment', parent: id - 1000, by: 'reply', text: 'A response.' });
    });
    const enriched = await enrichItem(original, store, http);
    assert.equal(requests.length, 13); assert.equal(enriched.discussion?.comments.length, 10);
    assert.deepEqual(enriched.discussion?.comments.filter(comment => comment.parent === '100').map(comment => comment.id), ['200', '201', '202', '203', '204', '205']);
    assert.ok(enriched.articleQuote); assert.equal(enriched.discussion?.partial, true);
    assert.equal((store.db.prepare('SELECT count(*) n FROM raw_responses').get() as any).n, 13);
  } finally { store.close(); }
});

test('HN native post paragraphs retain spacing even when the older feed parser joined them', async () => {
  const store = new Store(':memory:');
  try {
    cache(store, api + '100.json', { id: 100, type: 'story', text: 'A useful question.<p>A concrete explanation follows.', kids: [], descendants: 0 });
    const enriched = await enrichItem({ ...item, url: 'https://news.ycombinator.com/item?id=100', text: 'A useful question.A concrete explanation follows.' }, store, new Http(store));
    assert.equal(enriched.text, 'A useful question. A concrete explanation follows.');
    assert.equal(enriched.articleQuote, enriched.text);
  } finally { store.close(); }
});

test('failed article and discussion refresh retain accepted evidence; successful removal does not revive old comments', async () => {
  const store = new Store(':memory:');
  try {
    seed(store); const original = await enrichItem(item, store, new Http(store));
    store.db.prepare('INSERT INTO feed_summaries VALUES (?,?,?,?,?)').run(item.source, item.id, 'key', JSON.stringify({ item: original }), item.observedAt);
    const http = new Http(store, async () => new Response('Unavailable', { status: 403 }));
    const retained = await enrichItem(item, store, http, true);
    assert.equal(retained.text, original.text); assert.deepEqual(retained.discussion, original.discussion);
    assert.match(String(retained.metadata?.hnArticleError), /403/); assert.match(String(retained.metadata?.hnDiscussionError), /403/);
    assert.equal(http.raw.length, 0);
    cache(store, api + '100.json', { id: 100, deleted: true });
    assert.deepEqual((await enrichItem(item, store, new Http(store))).discussion?.comments, []);
  } finally { store.close(); }
});

test('discussion artifacts require grounded citations and bilingual text while quoted originals render as safe blockquotes', () => {
  const enriched = { ...item, text: 'Short source <unsafe> with facts.', articleQuote: 'Short source <unsafe> with facts.', discussion: { url: 'https://news.ycombinator.com/item?id=100', comments: [{ id: '2', parent: '100', author: '<user>', text: 'A disputed claim.' }], totalComments: 1, partial: false } };
  const input: SummaryInput = { contractVersion: 2, topics, items: [summaryItem(enriched, 4000)] };
  const output = { contractVersion: 2, newTopics: [], items: [{ source: item.source, id: item.id, topics: ['coding'], en: { title: String(item.title), summary: '' }, 'zh-CN': { title: '原文', summary: '' }, discussion: { commentIds: ['2'], en: 'A commenter argues for a different design.', 'zh-CN': '一位评论者提出不同设计。' } }] };
  const copy = validateArtifact(output, input).output.items[0]!;
  const record: AcceptedItem = { item: enriched, copy, firstSeen: item.observedAt, date: item.publishedAt, dateBasis: 'published', updated: item.observedAt };
  for (const locale of ['en', 'zh-CN'] as const) {
    const markdown = renderItem(record, locale);
    assert.match(markdown, /> Short source &lt;unsafe&gt; with facts\./);
    assert.ok(markdown.includes('https://news.ycombinator.com/item?id=2'));
    assert.ok(markdown.includes(locale === 'en' ? 'Based on 1 selected' : '根据 1 条选取'));
    assert.equal(parse(markdown.split('---')[1]!).discussion_url, enriched.discussion.url);
    const body = markdown.split('---\n\n')[1]!;
    assert.ok(!body.includes('<unsafe>') && !body.includes('<user>'));
  }
  assert.match(renderItem({ ...record, item: { ...enriched, text: enriched.text + ' Further source text.' } }, 'en'), /> Short source &lt;unsafe&gt; with facts\.…/);
  const forged = structuredClone(output); forged.items[0]!.discussion.commentIds = ['999'];
  assert.throws(() => validateArtifact(forged, input), /Unknown/);
  forged.items[0]!.discussion.commentIds = ['2', '2']; assert.throws(() => validateArtifact(forged, input), /duplicate/);
  forged.items[0]!.discussion.commentIds = ['2']; forged.items[0]!.en.summary = 'Paraphrase'; assert.throws(() => validateArtifact(forged, input), /Quoted/);
  const missing = structuredClone(output); delete (missing.items[0] as any).discussion; assert.throws(() => validateArtifact(missing, input), /require/);
  const longInput = { ...input, items: [{ ...input.items[0]!, title: 'A substantial original article about bounded systems', text: 'Source evidence. '.repeat(100), articleQuote: undefined }] };
  const placeholder = structuredClone(output); placeholder.items[0]!.en = { title: longInput.items[0]!.title, summary: 'Body.' }; placeholder.items[0]!['zh-CN'] = { title: '原文的完整标题', summary: '正文。' };
  assert.throws(() => validateArtifact(placeholder, longInput), /informative bilingual/);
  placeholder.items[0]!.en.title = 'T'; assert.throws(() => validateArtifact(placeholder, longInput), /informative headlines/);
});

test('DSH structured result preserves bilingual punctuation and paragraphs and refuses forged comment links', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'feedgarden-hn-tool-')), tools = new Map<string, any>();
  try {
    const enriched = { ...item, text: 'A source fact.', discussion: { url: 'https://news.ycombinator.com/item?id=100', comments: [{ id: '2', parent: '100', author: 'reader', text: 'A qualified disagreement.' }], totalComments: 1, partial: false } };
    await writeFile(join(directory, 'input.json'), JSON.stringify({ contractVersion: 2, topics, items: [summaryItem(enriched, 4000)] }));
    await writeFile(join(directory, 'SKILL.md'), await reportSkill(['hackernews']));
    await dshPlugin({ tools: { guard: () => () => {}, register: tool => { tools.set(tool.name, tool); return () => { tools.delete(tool.name); }; } }, provide() {} }, { directory });
    const artifact = { contractVersion: 2, newTopics: [], items: [{ source: item.source, id: item.id, topics: ['coding'], en: { title: item.title, summary: 'The author calls it "bounded", using {braces} and [lists].\n\nThe path is C:\\work.' }, 'zh-CN': { title: '一个原文事实', summary: '作者使用“引号”、{括号}和[列表]。\n\n第二段保留原来的换行。' }, discussion: { commentIds: ['2'], en: 'A commenter says "it depends".', 'zh-CN': '评论者说“要视情况而定”。' } }] };
    const result = tools.get('feedgarden_result');
    await result.execute(artifact);
    assert.deepEqual(JSON.parse(await readFile(join(directory, 'result.json'), 'utf8')), artifact);
    const forged = structuredClone(artifact); forged.items[0]!.discussion.commentIds = ['999'];
    await assert.rejects(result.execute(forged), /Unknown/);
    assert.deepEqual(JSON.parse(await readFile(join(directory, 'result.json'), 'utf8')), artifact);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('HN output budgeting preserves FIFO items and resumes quota-deferred work without regenerating accepted copy', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'feedgarden-hn-batches-')), store = new Store(':memory:'), batches: string[][] = [];
  try {
    await writeFile(join(directory, 'topics.json'), JSON.stringify(topics));
    const config = configSchema.parse({ version: 2, storage: { directory }, feed: { directory: join(directory, 'content'), topics: join(directory, 'topics.json') }, agent: { model: 'deepseek/deepseek-flash', maxDailyCalls: 2, runtimeDirectory: join(directory, 'tasks') }, sources: [{ id: 'hackernews', name: 'HN', intervalHours: 1, streams: [{ id: 'frontpage', channels: [{ id: 'firebase', kind: 'hn-api' }] }] }] });
    store.setMeta('cutoff', '1970-01-01T00:00:00Z');
    const items = Array.from({ length: 6 }, (_, index) => ({ ...item, id: String(200 + index), text: 'The article describes a bounded system.', discussion: { url: 'https://news.ycombinator.com/item?id=' + (200 + index), comments: [{ id: String(1000 + index), parent: String(200 + index), author: 'reader', text: 'A commenter discusses practical limits.' }], totalComments: 1, partial: false } }));
    store.saveCollection('hackernews', 'frontpage', 'firebase', { items, raw: [], coverage: { status: 'complete', to: item.observedAt, notes: [] } }, '');
    const generator: Generator = async (_agent, input, _repair, workspace) => {
      batches.push(input.items.map(row => row.id));
      return { output: { contractVersion: 2, newTopics: [], items: input.items.map(row => ({ source: row.source, id: row.id, topics: ['coding'], en: { title: row.title, summary: row.text }, 'zh-CN': { title: '有界系统', summary: '文章介绍有界系统。' }, discussion: { commentIds: [row.discussion!.comments[0]!.id], en: row.discussion!.comments[0]!.text, 'zh-CN': '一位评论者讨论实践限制。' } })) }, directory: workspace!, events: [], usage: [] };
    };
    const prepare = async (row: Parameters<typeof enrichItem>[0]) => row;
    assert.deepEqual(await summarize(config, store, {}, generator, item.observedAt, prepare), { generated: 4, pending: 2, failed: 0, deferred: true });
    const accepted = acceptedItems(store);
    config.agent.maxDailyCalls = 3;
    assert.deepEqual(await summarize(config, store, {}, generator, item.observedAt, prepare), { generated: 2, pending: 0, failed: 0, deferred: false });
    assert.deepEqual(batches, [['200', '201'], ['202', '203'], ['204', '205']]);
    assert.deepEqual(acceptedItems(store).slice(0, 4), accepted);
  } finally { store.close(); await rm(directory, { recursive: true, force: true }); }
});
