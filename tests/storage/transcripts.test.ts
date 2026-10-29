import assert from 'node:assert/strict';
import test from 'node:test';
import { openDatabase } from '../../src/storage/index.js';
import { hash } from '../../src/platform/hash.js';

test('transcript storage preserves NUL, Unicode and trailing evidence on supported Node versions', () => {
  const store=openDatabase(':memory:'),body='\0开始🙂\0 END';
  try {
    store.sources.saveTranscript('podcast','one',body,hash(body),'https://example.com/transcript','2026-10-29T00:00:00Z');
    assert.equal(store.sources.transcript('podcast','one')?.body,body);
    assert.equal(store.sources.transcriptBody('podcast','one').body,body);
    assert.equal(store.sources.transcriptSize('podcast','one')?.bytes,Buffer.byteLength(body));
  } finally { store.close(); }
});
