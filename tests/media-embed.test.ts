import test from 'node:test';
import assert from 'node:assert/strict';
import { embedKind } from '../src/media-embed.js';
import { renderItem, renderArchivedMedia } from '../src/site.js';
import { extractMedia } from '../src/source-content.js';
import { parseFeed } from '../src/channels/parsers.js';
import { validateArtifact } from '../src/topics-contract.mjs';
import { summaryItem, type AcceptedItem } from '../src/items.js';
import type { Item } from '../src/types.js';

const item: Item = { source: 'hackernews', id: '1', stream: 'main', channel: 'rss', title: 'Report', text: 'Evidence.', url: 'https://example.test/paper.pdf', publishedAt: '2026-10-13T00:00:00Z', observedAt: '2026-10-13T00:00:00Z', basis: 'published', metrics: {} };
const record = (changes: Partial<Item> = {}): AcceptedItem => ({ item: { ...item, ...changes }, copy: { source: item.source, id: item.id, topics: ['research'], en: { title: 'Paper', summary: 'Evidence.' }, 'zh-CN': { title: '论文', summary: '研究证据。' } }, firstSeen: item.observedAt, date: item.publishedAt, dateBasis: 'published', updated: item.observedAt });

test('recognizes supported direct files and provider originals without mistaking articles or unsafe URLs for media', () => {
  for (const [url, kind] of [
    ['https://cdn.example/image.GIF?token=signed', 'image'], ['https://cdn.example/a.ogg', 'audio'], ['https://cdn.example/a.webm', 'video'], ['https://cdn.example/a.PDF', 'pdf'],
    ['https://arxiv.org/pdf/2609.12345v2', 'pdf'], ['https://www.youtube.com/watch?v=NnTvZWp5Q7o&t=1m30s', 'video'], ['https://youtu.be/NnTvZWp5Q7o', 'video'],
    ['https://www.bilibili.com/video/BV1E7411e7hC?p=2', 'video'], ['https://vimeo.com/212731897', 'video'], ['https://x.com/obsdmd/status/1580548874246443010', 'post'],
  ]) assert.equal(embedKind(url!), kind, url);
  for (const url of ['https://example.test/article', 'https://arxiv.org/abs/2609.12345', 'http://cdn.example/a.png', 'https://cdn.example:444/a.mp4', 'https://user:pass@cdn.example/a.pdf', 'https://www.youtube.com/watch?v=bad', 'https://www.youtube.com/watch?v=NnTvZWp5Q7o&v=duplicate', 'https://b23.tv/short', 'https://www.bilibili.com/video/BV1E7411e7hC?p=']) assert.equal(embedKind(url), undefined, url);
  assert.equal(embedKind('https://cdn.example/render?id=figure', true), 'image');
});

test('embeds media originals in both languages, keeps ordinary source links, and deduplicates selected original media', () => {
  for (const locale of ['en', 'zh-CN'] as const) {
    assert.match(renderItem(record(), locale), /!\[.*\]\(<https:\/\/example.test\/paper.pdf>\)/);
    assert.ok(!renderItem(record({ url: 'https://example.test/article' }), locale).includes('!['));
  }
  const selected = record({ media: [{ id: 'paper', type: 'pdf', title: 'Paper', url: item.url }] }); selected.copy.media = ['paper'];
  assert.equal((renderItem(selected, 'en').match(/!\[/g) ?? []).length, 1);
});

test('selected supported media embed while unsupported video and HTTP media retain usable links', () => {
  const selected = record({ url: 'https://example.test/article', media: [
    { id: 'image', type: 'image', title: '<unsafe>|200', url: 'https://cdn.example/render?image=1' },
    { id: 'video', type: 'video', title: 'Live', url: 'https://cdn.example/live.m3u8' },
    { id: 'http', type: 'image', title: 'Old image', url: 'http://cdn.example/old.png' },
  ] }); selected.copy.media = ['image', 'video', 'http'];
  const body = renderItem(selected, 'en');
  assert.match(body, /!\[Image: &lt;unsafe&gt;&#124;200 · Image\]/);
  assert.ok(!body.includes('![Video: Live]') && !body.includes('![Image: Old image]'));
  assert.match(body, /\[Video: Live\]\(<https:\/\/cdn.example\/live.m3u8>\)/);
});

test('source audio and PDFs retain provenance through extraction, enclosures and the summary contract', () => {
  const media = extractMedia('<audio src="/interview.mp3"></audio><object type="application/pdf" data="/paper.pdf"></object><a href="https://arxiv.org/pdf/2609.12345">Paper</a><iframe src="https://evil.test/path/youtube.com/embed/123"></iframe>', 'https://example.test/article');
  assert.deepEqual(media.map(candidate => candidate.type), ['audio', 'pdf', 'pdf']);
  const feed = parseFeed('<rss><channel><item><title>Paper</title><link>https://example.test/article</link><enclosure type="audio/ogg" url="https://cdn.example/a.ogg"/><enclosure type="application/pdf" url="https://cdn.example/paper.pdf"/></item></channel></rss>', { source: 'hackernews', stream: 'main', channel: 'rss', observedAt: item.observedAt });
  assert.deepEqual(feed[0]!.media?.map(candidate => candidate.type), ['audio', 'pdf']);
  const input = { contractVersion: 2 as const, topics: { version: 1 as const, topics: [{ id: 'research', name: { en: 'Research', 'zh-CN': '研究' }, description: 'Research', aliases: [], deprecated: false }] }, items: [summaryItem({ ...item, media }, 4000)] };
  const accepted = record({ media }); accepted.copy.media = [media[0]!.id, media[1]!.id];
  assert.deepEqual(validateArtifact({ contractVersion: 2, items: [accepted.copy], newTopics: [] }, input).output.items[0]!.media, accepted.copy.media);
});

test('existing snapshots upgrade their generated media section without changing prose, identity or unrelated bytes', () => {
  const front = '---\npublish: true\ncontent_type: post\ntitle: Archive\nsource_url: https://example.test/paper.pdf\ndate: 2026-10-09\n---\n';
  const prose = '\nExisting prose with &#40;escaped&#41; punctuation.\n\n## HN discussion\n\nExisting comments.\n';
  const old = front + prose + '\n## Images and video\n\n- [Image: Figure](<https://cdn.example/a.png>)\n';
  const updated = renderArchivedMedia(old, 'en');
  assert.ok(updated.startsWith(front + prose));
  assert.match(updated, /!\[Image: Figure\]\(<https:\/\/cdn.example\/a.png>\)/);
  assert.match(updated, /!\[Original: Archive\]\(<https:\/\/example.test\/paper.pdf>\)/);
  assert.equal(renderArchivedMedia(updated, 'en'), updated);
  const ordinary = (front + prose).replace('paper.pdf', 'article');
  assert.equal(renderArchivedMedia(ordinary, 'en'), ordinary);
  const authored = ordinary + '\n## Images and video\n\nCustom authored text.\n';
  assert.equal(renderArchivedMedia(authored, 'en'), authored);
  assert.equal(renderArchivedMedia('Not a post.\r\n', 'en'), 'Not a post.\r\n');
});

test('malformed archived media falls back to the complete original bytes in either locale', () => {
  const front = '---\r\ncontent_type: post\r\ntitle: Archive\r\nsource_url: https://example.test/paper.pdf\r\n---\r\n';
  const body = front + '\r\nOriginal prose.\r\n\r\n## Images and video\r\n\r\n- [Image: Figure](<https://cdn.example/a.png>)\r\n';
  for (const malformed of [
    body.replace('https://example.test/paper.pdf', 'not a url'),
    body.replace('https://cdn.example/a.png', 'https://exa mple.com/x.png'),
    body.replace('title: Archive', 'title: [invalid yaml'),
    body + '\r\n![Authored](<https://exa mple.com/x.png>)\r\n',
  ]) for (const locale of ['en', 'zh-CN'] as const) assert.equal(renderArchivedMedia(malformed, locale), malformed);
});
