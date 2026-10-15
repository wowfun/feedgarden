import { lstat, readFile, rm } from 'node:fs/promises';
import { dirname, basename, resolve, join } from 'node:path';
import type { Config } from './config.js';
import type { Store } from './store.js';

export async function pruneWorkspaces(agent: Config['agent'], store: Store, at: string): Promise<void> {
  if (!agent.workspaceRetentionDays) return;
  const root = resolve(agent.runtimeDirectory);
  const parent = await lstat(root).catch(error => { if (error.code === 'ENOENT') return; throw error; });
  if (!parent?.isDirectory() || parent.isSymbolicLink()) return;
  const cutoff = new Date(Date.parse(at) - agent.workspaceRetentionDays * 86400_000).toISOString();
  // Deferred batches are not resumed: their pending jobs are re-batched on the
  // next run. Keep their database evidence, but expire their owned directories.
  const rows = store.db.prepare("SELECT id,workspace FROM feed_batches WHERE state IN ('accepted','failed','interrupted','deferred') AND workspace!='' AND julianday(created_at)<julianday(?)").all(cutoff) as { id: string; workspace: string }[];
  for (const row of rows) {
    const path = resolve(row.workspace);
    if (dirname(path) !== root || !/^task-[0-9a-f-]{36}$/.test(basename(path))) continue;
    const directory = await lstat(path).catch(error => { if (error.code === 'ENOENT') return; throw error; });
    if (!directory?.isDirectory() || directory.isSymbolicLink()) continue;
    const marker = join(path, '.feedgarden-workspace.json');
    const metadata = await lstat(marker).catch(error => { if (error.code === 'ENOENT') return; throw error; });
    if (!metadata?.isFile() || metadata.isSymbolicLink()) continue;
    let owner: { version?: number; batch?: string };
    try { owner = JSON.parse(await readFile(marker, 'utf8')); }
    catch (error) { if (error instanceof SyntaxError) continue; throw error; }
    if (owner?.version !== 1 || owner.batch !== row.id) continue;
    store.assertLease();
    await rm(path, { recursive: true, force: true });
    store.assertLease();
    store.db.prepare("UPDATE feed_batches SET workspace='' WHERE id=?").run(row.id);
  }
}
