import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { repositoryUrl, productHuntPage, parseProductHuntRepository } from '../src/producthunt.js';
import { enrichItem } from '../src/source-content.js';
import { Store } from '../src/store.js';
import { Http } from '../src/http.js';
import { configSchema } from '../src/config.js';
import { summarize, acceptedItems, type Generator } from '../src/items.js';
import { writeSite } from '../src/site.js';
import type { Item } from '../src/types.js';

const pageUrl = 'https://www.producthunt.com/products/test';
const repo = 'https://github.com/maker/test';
const item: Item = { source: 'producthunt', stream: 'daily', channel: 'leaderboard', id: '123', title: 'Test', text: 'Provided facts.', url: pageUrl, observedAt: '2026-10-09T12:00:00Z', publishedAt: '2026-10-09T07:00:00Z', basis: 'leaderboard', metrics: {} };
const transport = (nodes: unknown) => '<script>(window[Symbol.for("ApolloSSRDataTransport")] ??= []).push(' + JSON.stringify({ rehydrate: nodes }) + ')</script>';
const product = (githubUrl: string | null = repo) => ({ __typename: 'Product', id: '456', slug: 'test', githubUrl });

test('repository URLs retain actual repository roots and reject profiles, unrelated routes and unsafe URLs', () => {
  assert.equal(repositoryUrl(repo + '.git/?ref=producthunt#readme'), repo);
  assert.equal(repositoryUrl('https://gitlab.com/group/subgroup/repo'), 'https://gitlab.com/group/subgroup/repo');
  assert.equal(repositoryUrl('https://codeberg.org/maker/repo'), 'https://codeberg.org/maker/repo');
  assert.equal(repositoryUrl('https://bitbucket.org/maker/repo/'), 'https://bitbucket.org/maker/repo');
  for (const value of [undefined, 'javascript:alert(1)', 'https://user:secret@github.com/maker/repo', 'https://github.com/maker', 'https://github.com/topics/ai', 'https://github.com/sponsors/maker', repo + '/issues/1', 'https://github.com/maker/.git', 'https://github.com.evil.test/maker/repo', 'https://gitlab.com/group/repo/-/issues']) assert.equal(repositoryUrl(value), undefined, String(value));
  assert.ok(productHuntPage(pageUrl + '?ref=feed'));
  assert.ok(!productHuntPage('https://www.producthunt.com.evil.test/products/test'));
});

test('only the requested Product Hunt product or its linked Post supplies the repository', () => {
  const other = { __typename: 'Product', id: '999', slug: 'other', githubUrl: 'https://github.com/other/project' };
  const body = transport([product(), other, { __typename: 'Comment', body: repo }]) + '<a href="https://github.com/another/repo">Comment link</a>';
  assert.equal(parseProductHuntRepository(body, pageUrl).repoUrl, repo);
  assert.deepEqual(parseProductHuntRepository(transport([product(null), other]), pageUrl), { matched: true });
  assert.deepEqual(parseProductHuntRepository(transport([other]), pageUrl), { matched: false });
  assert.equal(parseProductHuntRepository(transport([{ __typename: 'Post', slug: 'launch', product: { id: '456' } }, product()]), 'https://www.producthunt.com/posts/launch').repoUrl, repo);
  assert.equal(parseProductHuntRepository(transport([{ ...product(null), primaryLink: { url: repo + '?ref=producthunt' } }]), pageUrl).repoUrl, repo);
  assert.equal(parseProductHuntRepository(transport([product(), { ...product(), githubUrl: 'https://github.com/maker/another' }]), pageUrl).repoUrl, undefined, 'conflicting explicit repositories are not guessed');
  assert.equal(parseProductHuntRepository(transport([{ ...product(), githubUrl: 'https://github.com/maker' }]), pageUrl).repoUrl, undefined);
  const serialized = transport([product()]).replace('"rehydrate":', '"absent":undefined,"text":"undefined","rehydrate":');
  assert.equal(parseProductHuntRepository(serialized, pageUrl).repoUrl, repo);
  assert.deepEqual(parseProductHuntRepository('<script>(window[Symbol.for("ApolloSSRDataTransport")] ??= []).push({bad:process.exit(1)})</script>', pageUrl), { matched: false });
});

test('Product Hunt enrichment caches positive and absent repositories and preserves verified evidence on failed refresh', async () => {
  const store = new Store(':memory:'); let requests = 0;
  const http = new Http(store, async url => { requests++; return new Response(String(url).endsWith('/robots.txt') ? 'User-agent: *\nAllow: /' : 'Forbidden', { status: String(url).endsWith('/robots.txt') ? 200 : 403 }); });
  try {
    store.saveCache({ url: pageUrl, body: transport([product()]), status: 200, fetchedAt: new Date().toISOString(), headers: {} });
    const enriched = await enrichItem(item, store, http);
    assert.equal(enriched.repoUrl, repo); assert.equal(requests, 0);
    assert.equal(enriched.metadata?.repositoryLastAttemptAt, undefined, 'a cache hit does not invent a network attempt');
    store.db.prepare('INSERT INTO feed_summaries VALUES (?,?,?,?,?)').run(item.source, item.id, 'key', JSON.stringify({ item: enriched }), item.observedAt);
    const retained = await enrichItem(item, store, http, true);
    assert.equal(retained.repoUrl, repo); assert.match(String(retained.metadata?.repositoryError), /403/);
    assert.equal(retained.metadata?.repositoryCheckedAt, enriched.metadata?.repositoryCheckedAt);
    assert.ok(Date.parse(String(retained.metadata?.repositoryLastAttemptAt)) >= Date.parse(String(enriched.metadata?.repositoryCheckedAt)));
    assert.equal(http.raw.length, 0);
    assert.equal((store.db.prepare('SELECT count(*) n FROM raw_responses').get() as { n: number }).n, 2);
    store.saveCache({ url: pageUrl, body: transport([product(null)]), status: 200, fetchedAt: new Date().toISOString(), headers: {} });
    assert.equal((await enrichItem(enriched, store, http)).repoUrl, undefined, 'an explicit removal is reflected');
    const before = requests;
    await enrichItem(item, store, http);
    assert.equal(requests, before, 'an absent repository is cached too');
    assert.deepEqual(await enrichItem({ ...item, url: 'https://untrusted.test/products/test' }, store, http), { ...item, url: 'https://untrusted.test/products/test' });
    assert.equal(requests, before);
    const signal = AbortSignal.abort(new Error('Cancelled'));
    await assert.rejects(enrichItem(item, store, new Http(store, undefined, signal)), /Cancelled/);
  } finally { store.close(); }
});

test('a repository update reaches both frontmatters without another summary call or changing item paths', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-09T13:00:00Z') });
  const directory = await mkdtemp(join(tmpdir(), 'feedgarden-ph-repo-'));
  const store = new Store(':memory:'); let calls = 0;
  try {
    const topics = { version: 1, topics: [{ id: 'coding', name: { en: 'Coding', 'zh-CN': '编程' }, description: 'Tools', aliases: [], deprecated: false }] };
    await writeFile(join(directory, 'topics.json'), JSON.stringify(topics));
    const config = configSchema.parse({ version: 2, storage: { root: directory }, feed: { directory: join(directory, 'content'), topics: join(directory, 'topics.json') }, agent: { model: 'deepseek/deepseek-flash' }, sources: [{ id: item.source, name: 'Product Hunt', timezone: 'America/Los_Angeles', intervalHours: 6, streams: [{ id: item.stream, channels: [{ id: item.channel, kind: 'ph-html' }] }] }] });
    store.setMeta('cutoff', '2026-10-09T00:00:00Z');
    store.saveCollection(item.source, item.stream, item.channel, { items: [item], raw: [], coverage: { status: 'complete', to: item.observedAt, notes: [] } }, '');
    const generator: Generator = async (_agent, input, _repair, workspace) => {
      calls++;
      return { output: { contractVersion: 2, newTopics: [], items: input.items.map(i => ({ source: i.source, id: i.id, topics: ['coding'], en: { title: i.title, summary: i.text }, 'zh-CN': { title: '测试', summary: '提供的事实。' } })) }, directory: workspace!, events: [], usage: [] };
    };
    function cache(githubUrl: string | null) { store.saveCache({ url: pageUrl, status: 200, fetchedAt: new Date().toISOString(), headers: {}, body: transport([product(githubUrl)]) }); }
    cache(null); await summarize(config, store, {}, generator); await writeSite(config, store);
    const relative = 'producthunt/2026-10/09/item-1.md';
    const before = await readFile(join(config.feed.directory, relative), 'utf8');
    assert.ok(!before.includes('repo_url:'));
    const copy = acceptedItems(store)[0]!.copy;
    cache(repo); assert.equal((await summarize(config, store, {}, generator, new Date(Date.now() + 6 * 3600_000 + 1).toISOString())).generated, 0);
    await writeSite(config, store); assert.equal(calls, 1);
    assert.deepEqual(acceptedItems(store)[0]!.copy, copy);
    for (const prefix of ['', '_translations/zh-CN/']) {
      const markdown = await readFile(join(config.feed.directory, prefix, relative), 'utf8');
      const frontmatter = parse(markdown.split('---')[1]!);
      assert.equal(frontmatter.repo_url, repo); assert.equal(frontmatter.source_url, pageUrl);
      assert.deepEqual(frontmatter.tags, ['source/producthunt', 'topics/coding']);
    }
    const after = await readFile(join(config.feed.directory, relative), 'utf8');
    assert.equal(after.replace('repo_url: "' + repo + '"\n', ''), before);
  } finally { store.close(); await rm(directory, { recursive: true, force: true }); }
});
