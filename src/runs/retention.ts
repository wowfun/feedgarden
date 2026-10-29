import { lstat, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { InstanceContext } from '../instance/index.js';
import { processAlive } from '../platform/retention.js';
import type { Storage } from '../storage/index.js';

export async function pruneRunLogs(config: InstanceContext, store: Storage, now = Date.now()): Promise<void> {
  const root = join(config.paths.state, 'runs'), info = await lstat(root).catch(() => undefined);
  if (!info?.isDirectory() || info.isSymbolicLink()) return;
  for (const file of await readdir(root, { withFileTypes: true })) {
    if (!file.isFile() || !/^[a-f0-9-]{36}\.log$/.test(file.name)) continue;
    const row = store.runs.find(file.name.slice(0, -4));
    if (!row || ['queued', 'running'].includes(row.state) || processAlive(row.pid ?? 0)) continue;
    const path = join(root, file.name), current = await lstat(path).catch(() => undefined);
    if (!current?.isFile() || current.isSymbolicLink() || current.mtimeMs >= now - 30 * 86400_000) continue;
    await rm(path).catch(() => undefined);
  }
}
