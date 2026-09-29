import { mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { DateTime } from 'luxon';
import { Store } from './store.js';

export async function backup(store: Store, directory: string, at = new Date().toISOString()): Promise<string[]> {
  const day = DateTime.fromISO(at, { zone: 'utc' });
  const created: string[] = [];
  for (const [kind, stamp, keep] of [['daily', day.toISODate()!, 7], ['weekly', day.startOf('week').toISODate()!, 4]] as const) {
    const root = join(directory, 'backups', kind);
    await mkdir(root, { recursive: true, mode: 0o700 });
    const path = join(root, stamp + '.sqlite');
    if (!(await readdir(root)).includes(stamp + '.sqlite')) { await store.backup(path); created.push(path); }
    const files = (await readdir(root)).filter(file => /^\d{4}-\d{2}-\d{2}\.sqlite$/.test(file)).sort().reverse();
    for (const file of files.slice(keep)) await rm(join(root, file));
  }
  return created;
}
