import assert from 'node:assert/strict';
import test from 'node:test';
import { Http } from '../../src/platform/http/client.js';
import { adapters,parseFeed,parseFollowBuilders,parsePodcastFeed,parseXTimeline } from '../../src/sources/index.js';
import { testContext } from '../support/context.js';
import { TestDatabase as Store } from '../support/database.js';

const at = '2026-10-13T00:00:00.000Z';
const context = { source: 'one', stream: 'main', channel: 'feed', observedAt: at };
const valid = '<item><title>Valid</title><link>https://example.test/a</link></item>';
const malformed = '<item><title>Broken</title></item>';
const feed = (body: string) => '<rss><channel><title>Fixture feed</title>' + body + '</channel></rss>';

test('feeds preserve valid entries and record malformed rows, while all-invalid feeds fail', async () => {
  const config = testContext({ version:3,instanceId:'00000000-0000-4000-8000-000000000001', agent: { model: 'fixture' }, sources: [{ id: 'one', name: 'One', intervalHours: 1, streams: [{ id: 'main', routes: [{ id: 'feed', kind: 'feed', url: 'https://example.test/feed' }] }] }] });
  const source = config.sources[0]!, stream = source.streams[0]!, channel = stream.routes[0]!;
  const store = new Store(':memory:');
  try {
    const http = new Http(store, async () => new Response(feed(valid + malformed + '<item><title>Bad URL</title><link>javascript:bad()</link></item>')));
    const result = await adapters.feed({ source, stream, channel, store, http, now: at, since: at });
    assert.equal(result.items.length, 1); assert.equal(result.coverage.status, 'partial');
    assert.ok(result.coverage.notes.some(note => /2 malformed feed entries/.test(note)));
    assert.equal(result.raw.length, 1);
    assert.throws(() => parseFeed(feed(malformed), context, []), /All feed entries/);
    assert.deepEqual(parseFeed(feed(''), context, []), []);
    assert.throws(() => parseFeed('<feed>', context, []), /Invalid XML/);
  } finally { store.close(); }
});

test('checkpointed arXiv pages stay strict so malformed rows cannot advance an offset', () => {
  assert.throws(() => parseFeed(feed(valid + malformed), { ...context, source: 'arxiv' }), /no title or link/);
});

test('X timelines skip malformed rows, retain native IDs, and fail when every row is malformed', () => {
  const notes: string[] = [];
  const valid = { id: '1234', createdAtISO: at, text: 'Valid post' };
  const items = parseXTimeline([null, valid, { ...valid, id: 'not-an-id' }], { ...context, source: 'x' }, notes);
  assert.deepEqual(items.map(item => item.id), ['1234']);
  assert.match(notes.join(' '), /2 malformed X timeline entries/);
  assert.throws(() => parseXTimeline([null], context, []), /All X timeline entries/);
  assert.deepEqual(parseXTimeline([], context, []), []);
});

test('JSON post text and quoted posts preserve literal angle brackets and entity-like text', () => {
  const body = 'if x<y then z; <b>literal</b> &copy;';
  const [item] = parseXTimeline([{ id: '1234', createdAtISO: at, text: body, quotedTweet: { text: 'a<b then c', author: { screenName: 'author' } } }], context, []);
  assert.equal(item?.title, body);
  assert.equal(item?.text, body + ' Quoting @author: a<b then c');
  const sampled = parseFollowBuilders(JSON.stringify({ generatedAt: at, x: [{ handle: context.stream, tweets: [{ id: '1234', text: body }] }] }), context);
  assert.equal(sampled.items[0]?.title, body);
  assert.equal(sampled.items[0]?.text, body);
});

test('Hacker News JSON titles and story bodies decode their HTML contract exactly once', async () => {
  const config = testContext({ version: 3, instanceId: '00000000-0000-4000-8000-000000000001', agent: { model: 'fixture' }, sources: [{ id: 'hackernews', name: 'Hacker News', intervalHours: 1, streams: [{ id: 'frontpage', routes: [{ id: 'firebase', kind: 'hn-api' }] }] }] });
  const source = config.sources[0]!, stream = source.streams[0]!, channel = stream.routes[0]!;
  const store = new Store(':memory:');
  try {
    const http = new Http(store, async url => new Response(JSON.stringify(String(url).endsWith('/topstories.json') ? [123] : {
      id: 123, type: 'story', time: Date.parse(at) / 1000, by: 'author',
      title: 'Show HN: why x&lt;y matters &amp; &lt;b&gt;literal&lt;/b&gt; &amp;copy;',
      text: '<p>if a&lt;b then c.</p><p><i>Markup</i> &amp; &amp;copy;<br>Next.</p>',
    })));
    const result = await adapters['hn-api']({ source, stream, channel, store, http, now: at, since: at });
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0]!.title, 'Show HN: why x<y matters & <b>literal</b> &copy;');
    assert.equal(result.items[0]!.text, 'if a<b then c. Markup & &copy; Next.');
    assert.equal(result.items[0]!.url, 'https://news.ycombinator.com/item?id=123');
  } finally { store.close(); }
});

test('RSS and podcast titles and authors retain decoded XML text without HTML reparsing', () => {
  const document = feed('<item><title>if x&lt;y then z</title><author>Author &lt;a@example.test&gt;</author><link>https://example.test/a</link></item>');
  const podcast = document.replace('<rss>', '<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">').replace('<author>', '<itunes:author>').replace('</author>', '</itunes:author>');
  for (const [item] of [parseFeed(document, context), parsePodcastFeed(podcast, context, 'Show')]) {
    assert.equal(item?.title, 'if x<y then z');
    assert.equal(item?.author, 'Author <a@example.test>');
  }
});

test('Atom text constructs preserve literal text while explicitly HTML constructs are parsed', () => {
  const document = '<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>if x&lt;y then z</title><link href="https://example.test/text"/><summary type="text">if a&lt;b then c; &lt;img src="https://example.test/literal.png"&gt;</summary></entry><entry><title type="html">&lt;b&gt;Bold&lt;/b&gt;</title><link href="https://example.test/html"/><summary type="html">&lt;p&gt;Rendered &amp;amp; decoded.&lt;/p&gt;&lt;img src="/figure.png"/&gt;</summary></entry></feed>';
  const [literal, html] = parseFeed(document, context);
  assert.equal(literal?.title, 'if x<y then z');
  assert.equal(literal?.text, 'if a<b then c; <img src="https://example.test/literal.png">');
  assert.deepEqual(literal?.media, []);
  assert.equal(html?.title, 'Bold');
  assert.equal(html?.text, 'Rendered & decoded.');
  assert.equal(html?.media?.[0]?.url, 'https://example.test/figure.png');
});

test('Reddit HTML content keeps only post text and preserves decoded comparisons', () => {
  for (const type of ['', ' type="html"']) {
    const document = '<feed><entry><title>A post</title><link href="https://reddit.com/r/test/comments/123"/><content' + type + '>&lt;span&gt;submitted by user&lt;/span&gt;&lt;div class="md"&gt;&lt;p&gt;if a&amp;lt;b then c.&lt;/p&gt;&lt;p&gt;Second paragraph.&lt;/p&gt;&lt;/div&gt; [link] [comments]</content></entry></feed>';
    assert.equal(parseFeed(document, { ...context, source: 'reddit' })[0]?.text, 'if a<b then c. Second paragraph.');
  }
});

test('Atom XHTML constructs preserve inline order, literal text and media across namespace prefixes', () => {
  for (const prefix of ['', 'xh:']) for (const element of ['summary', 'content']) {
    const div = `${prefix}div`, p = `${prefix}p`, b = `${prefix}b`, img = `${prefix}img`;
    const document = `<feed xmlns="http://www.w3.org/2005/Atom" xmlns:xh="http://www.w3.org/1999/xhtml"><entry><title type="xhtml"><${div} xmlns="http://www.w3.org/1999/xhtml">A <${b}>bold</${b}> title &lt;literal&gt; &amp;copy;</${div}></title><link href="https://example.test/xhtml"/><${element} type="xhtml"><${div} xmlns="http://www.w3.org/1999/xhtml"><${p}>First <${b}>bold</${b}> last.</${p}><${p}>Second &lt;literal&gt; &amp;copy;.</${p}><${img} src="/figure.png"/><${p}><![CDATA[<img src="https://example.test/literal.png">]]></${p}></${div}></${element}></entry></feed>`;
    const [item] = parseFeed(document, context);
    assert.equal(item?.title, 'A bold title <literal> &copy;');
    assert.equal(item?.text, 'First bold last. Second <literal> &copy;. <img src="https://example.test/literal.png">');
    assert.deepEqual(item?.media?.map(media => media.url), ['https://example.test/figure.png']);
  }
});

test('Atom content accepts text MIME types and keeps encoded HTML precedence', () => {
  const entry = (content: string) => '<feed xmlns:content="http://purl.org/rss/1.0/modules/content/"><entry><title>Fixture</title><link href="https://example.test/a"/>' + content + '</entry></feed>';
  const [literal] = parseFeed(entry('<content type="text/plain">if x&lt;y then z; &lt;b&gt;literal&lt;/b&gt;</content>'), context);
  assert.equal(literal?.text, 'if x<y then z; <b>literal</b>');
  assert.deepEqual(literal?.media, []);
  for (const type of ['text/html', 'text/HTML; charset=UTF-8']) {
    const [html] = parseFeed(entry(`<content type="${type}">&lt;p&gt;Rendered.&lt;/p&gt;&lt;img src="/figure.png"/&gt;</content>`), context);
    assert.equal(html?.text, 'Rendered.');
    assert.equal(html?.media?.[0]?.url, 'https://example.test/figure.png');
  }
  const [encoded] = parseFeed(entry('<content:encoded>&lt;p&gt;Encoded HTML.&lt;/p&gt;</content:encoded><content type="text">Fallback</content>'), context);
  assert.equal(encoded?.text, 'Encoded HTML.');
});
