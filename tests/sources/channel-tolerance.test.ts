import assert from 'node:assert/strict';
import test from 'node:test';
import { Http } from '../../src/platform/http/client.js';
import { adapters,parseFeed,parseXTimeline } from '../../src/sources/index.js';
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
