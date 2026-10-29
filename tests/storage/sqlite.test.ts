import assert from 'node:assert/strict';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import Database from '../../src/storage/sqlite.js';

test('nested rollback, WAL readers and online backups preserve committed data', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-sqlite-')),
    file = join(root, 'database.sqlite');
  assert.throws(() => new Database(file, { fileMustExist: true }), /does not exist/);
  const writer = new Database(file);
  writer.pragma('journal_mode=WAL');
  writer.exec('CREATE TABLE records(id INTEGER PRIMARY KEY, payload BLOB)');
  const reader = new Database(file, { readonly: true, fileMustExist: true });
  try {
    writer.transaction(() => {
      writer.prepare('INSERT INTO records VALUES(?,?)').run(1, Buffer.from('kept'));
      assert.throws(
        () =>
          writer.transaction(() => {
            writer.prepare('INSERT INTO records VALUES(?,?)').run(2, Buffer.from('rollback'));
            throw new Error('rollback');
          })(),
        /rollback/,
      );
      assert.equal(reader.prepare('SELECT count(*) n FROM records').get().n, 0);
    })();
    assert.equal(reader.prepare('SELECT count(*) n FROM records').get().n, 1);
    assert.throws(() => reader.exec('DELETE FROM records'), /readonly/i);
    await writer.backup(join(root, 'backup.sqlite'));
    const backup = new Database(join(root, 'backup.sqlite'), { readonly: true });
    try {
      assert.deepEqual(backup.prepare('SELECT payload FROM records').get().payload, Buffer.from('kept'));
    } finally {
      backup.close();
    }
  } finally {
    reader.close();
    writer.close();
    await rm(root, { recursive: true, force: true });
  }
});
