import test from 'node:test';
import assert from 'node:assert/strict';
import { extractMedia, parseArticle, enrichItem } from '../src/source-content.js';
import { parseFeed } from '../src/channels/parsers.js';
import { validateArtifact } from '../src/topics-contract.mjs';
import { renderItem } from '../src/site.js';
import { summaryItem, type AcceptedItem } from '../src/items.js';
import { Store } from '../src/store.js';
import { Http } from '../src/http.js';
import { hash } from '../src/util.js';
import type { Item } from '../src/types.js';

const item: Item = { source: 'openai', id: 'a', stream: 'news', channel: 'rss', title: 'Research report', text: 'Brief introduction.', url: 'https://openai.com/index/a', publishedAt: '2026-10-09T00:00:00Z', observedAt: '2026-10-09T00:00:00Z', basis: 'published', metrics: {} };
const html = '<nav>Navigation</nav><article><h1>Research report</h1><p>' + 'Evidence and methods. '.repeat(30) + '</p><figure><img src="/figure.png" alt="Measured results"><figcaption>Evaluation chart</figcaption></figure><img src="/logo.svg" alt="Logo"><img src="/tiny.png" width="1"><img src="javascript:alert(1)"><video src="/demo.mp4" title="Demo"></video><iframe src="https://www.youtube.com/embed/abcd" title="Walkthrough"></iframe><iframe src="https://evil.test/unrelated"></iframe></article><footer>Footer</footer>';

test('article extraction keeps source evidence and useful media while excluding chrome and unsafe candidates', () => {
  const article = parseArticle(html, item.url)!;
  assert.ok(article.text.includes('Evidence and methods'));
  assert.ok(!article.text.includes('Navigation') && !article.text.includes('Footer'));
  assert.deepEqual(article.media.map(media => media.url), ['https://openai.com/figure.png', 'https://openai.com/demo.mp4', 'https://www.youtube.com/embed/abcd']);
  assert.equal(article.media[0]?.title, 'Evaluation chart');
  assert.deepEqual(extractMedia(html, item.url), article.media);
  assert.equal(parseArticle('<main>Please sign in</main>', item.url), undefined);
  assert.equal(extractMedia('<img src="https://user:password@example.test/a.png">', item.url).length, 0);
});

test('RSS full content supersedes the short description and HTML/enclosure media retain provenance', () => {
  const feed = '<rss xmlns:content="https://example.test/content"><channel><item><title>Report</title><link>https://example.test/report</link><description>Brief</description><content:encoded><![CDATA[<p>Detailed source body.</p><img src="/chart.png" alt="Results">]]></content:encoded><enclosure type="video/mp4" url="https://example.test/demo.mp4"/></item></channel></rss>';
  const parsed = parseFeed(feed, { source: 'openai', stream: 'news', channel: 'rss', observedAt: item.observedAt })[0]!;
  assert.equal(parsed.text, 'Detailed source body.');
  assert.deepEqual(parsed.media?.map(media => media.type), ['image', 'video']);
  assert.equal(parsed.media?.[0]?.url, 'https://example.test/chart.png');
});

test('media-only collection revisions remain auditable while metric changes reuse the content version', () => {
  const store = new Store(':memory:');
  const save = (record: Item) => store.saveCollection(record.source, record.stream, record.channel, { items: [record], raw: [], coverage: { status: 'complete', to: record.observedAt, notes: [] } }, '');
  try {
    save(item);
    save({ ...item, metrics: { score: 100 } });
    assert.equal((store.db.prepare('SELECT count(*) n FROM item_versions').get() as { n: number }).n, 1);
    save({ ...item, media: extractMedia(html, item.url) });
    assert.equal((store.db.prepare('SELECT count(*) n FROM item_versions').get() as { n: number }).n, 2);
  } finally { store.close(); }
});

test('expanded bilingual copy selects only known media and the renderer preserves safe paragraphs and lists', () => {
  const media = extractMedia(html, item.url), enriched = { ...item, media };
  const input = { contractVersion: 2, topics: { version: 1, topics: [{ id: 'research', name: { en: 'Research', 'zh-CN': '研究' }, description: 'Research', aliases: [], deprecated: false }] }, items: [summaryItem(enriched, 4000)] };
  const summary = 'First paragraph. '.repeat(45) + '\n\n- Measured results\n- <script>unsafe</script>';
  const artifact = { contractVersion: 2, newTopics: [], items: [{ source: item.source, id: item.id, topics: ['research'], media: [media[0]!.id], en: { title: item.title, summary }, 'zh-CN': { title: '研究报告', summary: '第一段。\n\n- 结果\n- 方法' } }] };
  const copy = validateArtifact(artifact, input).output.items[0]!;
  const record: AcceptedItem = { item: enriched, copy, firstSeen: item.observedAt, date: item.publishedAt, dateBasis: 'published', updated: item.observedAt };
  const markdown = renderItem(record, 'en');
  assert.match(markdown, /\n\n- Measured results\n- &lt;script&gt;/);
  assert.match(markdown, /\[Image: Evaluation chart\]\(<https:\/\/openai.com\/figure.png>\)/);
  assert.ok(!markdown.includes('<script>') && !markdown.includes('demo.mp4'));
  const forged = structuredClone(artifact); forged.items[0]!.media = ['invented'];
  assert.throws(() => validateArtifact(forged, input), /Unknown/);
  forged.items[0]!.media = [media[0]!.id, media[0]!.id];
  assert.throws(() => validateArtifact(forged, input), /duplicate/);
  artifact.items[0]!.en.summary = 'x'.repeat(4001);
  assert.throws(() => validateArtifact(artifact, input));
});

test('official article cache avoids requests and failed refresh preserves accepted evidence without changing collection state', async () => {
  const store = new Store(':memory:');
  try {
    store.saveCache({ url: item.url, status: 200, body: html, fetchedAt: new Date().toISOString(), headers: {} });
    let requests = 0;
    const http = new Http(store, async url => { requests++; return new Response(String(url).endsWith('/robots.txt') ? 'User-agent: *\nAllow: /' : 'Forbidden', { status: String(url).endsWith('/robots.txt') ? 200 : 403 }); });
    const enriched = await enrichItem(item, store, http);
    assert.equal(requests, 0);
    assert.equal(enriched.metadata?.feedTextHash, hash(item.text));
    store.db.prepare('INSERT INTO feed_summaries VALUES (?,?,?,?,?)').run(item.source, item.id, 'key', JSON.stringify({ item: enriched }), item.observedAt);
    store.db.prepare('DELETE FROM http_cache WHERE url=?').run(item.url);
    const retained = await enrichItem(item, store, http, true);
    assert.equal(retained.text, enriched.text);
    assert.match(String(retained.metadata?.articleError), /403/);
    assert.equal(store.states().length, 0);
    assert.equal((store.db.prepare('SELECT count(*) n FROM raw_responses').get() as { n: number }).n, 2);
    assert.equal((await enrichItem({ ...item, text: 'Changed introduction.' }, store, http, true)).text, 'Changed introduction.');
    const before = requests;
    assert.deepEqual(await enrichItem({ ...item, source: 'hackernews', url: 'https://untrusted.test/post' }, store, http), { ...item, source: 'hackernews', url: 'https://untrusted.test/post' });
    assert.equal(requests, before);
  } finally { store.close(); }
});
