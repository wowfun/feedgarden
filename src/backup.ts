import { mkdir, readdir, rm, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { DateTime } from 'luxon';
import { Store } from './store.js';
import { isoDate } from './util.js';

export async function backup(store: Store, directory: string, at = new Date().toISOString()): Promise<string[]> {
  const day = DateTime.fromISO(at, { zone: 'utc' });
  const created: string[] = [];
  for (const [kind, stamp, keep] of [['daily', isoDate(day, 'backup day'), 7], ['weekly', isoDate(day.startOf('week'), 'backup week'), 4]] as const) {
    const root = join(directory, 'backups', kind);
    await mkdir(root, { recursive: true, mode: 0o700 });
    const path = join(root, stamp + '.sqlite');
    // Keep the temporary file beside its destination for same-filesystem rename.
    const temporary = join(root, stamp + '.' + randomUUID() + '.tmp');
    try { await store.backup(temporary); await rename(temporary, path); created.push(path); }
    finally { await rm(temporary, { force: true }); }
    const files = (await readdir(root)).filter(file => /^\d{4}-\d{2}-\d{2}\.sqlite$/.test(file)).sort().reverse();
    for (const file of files.slice(keep)) await rm(join(root, file));
  }
  return created;
}
