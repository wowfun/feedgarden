import { lstat, readdir, readFile, rm } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import type { AgentRuntimeConfig } from '../contracts/agent.js';
import type { Storage } from '../storage/index.js';

export async function pruneWorkspaces(agent: AgentRuntimeConfig, store: Storage, at: string): Promise<void> {
  if (!agent.workspaceRetentionDays) return;
  const root = resolve(agent.runtimeDirectory);
  const parent = await lstat(root).catch(error => { if (error.code === 'ENOENT') return; throw error; });
  if (!parent?.isDirectory() || parent.isSymbolicLink()) return;
  const cutoff = new Date(Date.parse(at) - agent.workspaceRetentionDays * 86400_000).toISOString();
  // Deferred batches are not resumed: their pending jobs are re-batched on the
  // next run. Auxiliary pending/running tasks resume in place, so only accepted
  // and exhausted failed tasks may lose their directories. Keep all DB evidence.
  const rows = store.batches.prunable(cutoff, cutoff) as { id: string; workspace: string; auxiliary: number }[];
  const known = new Set(rows.map(row => resolve(row.workspace)));
  // Old preparation directories and superseded attempts retain ownership markers
  // even after the current DB pointer moves. Only prune old, proven, unreferenced
  // children; active pointers, unknown directories and links remain untouched.
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink() || !/^task-[0-9a-f-]{36}$/.test(entry.name)) continue;
    const path = join(root, entry.name);
    if (known.has(path) || (await lstat(path)).mtimeMs >= Date.parse(cutoff)) continue;
    const marker = join(path, '.feedgarden-workspace.json');
    const stat = await lstat(marker).catch(error => { if (error.code !== 'ENOENT') throw error; });
    if (!stat?.isFile() || stat.isSymbolicLink() || stat.size > 4096) continue;
    let owner;
    try { owner = JSON.parse(await readFile(marker, 'utf8')); } catch (error) { if (error instanceof SyntaxError) continue; throw error; }
    if (owner?.version !== 1 || typeof (owner.batch ?? owner.task) !== 'string') continue;
    const id = owner.batch ?? owner.task, auxiliary = owner.batch ? 0 : 1;
    const current = auxiliary ? store.tasks.find(id) : store.batches.owner(id);
    if (current && resolve(current.workspace) !== path) rows.push({ id, workspace: path, auxiliary });
  }
  const clearBatch = store.batches.clearWorkspace, clearTask = store.tasks.clearWorkspace;
  for (const row of rows) {
    const path = resolve(row.workspace);
    if (dirname(path) !== root || !/^task-[0-9a-f-]{36}$/.test(basename(path))) continue;
    const directory = await lstat(path).catch(error => { if (error.code === 'ENOENT') return; throw error; });
    if (!directory?.isDirectory() || directory.isSymbolicLink()) continue;
    const marker = join(path, '.feedgarden-workspace.json');
    const metadata = await lstat(marker).catch(error => { if (error.code === 'ENOENT') return; throw error; });
    if (!metadata?.isFile() || metadata.isSymbolicLink()) continue;
    let owner: { version?: number; batch?: string; task?: string };
    try { owner = JSON.parse(await readFile(marker, 'utf8')); }
    catch (error) { if (error instanceof SyntaxError) continue; throw error; }
    if (owner?.version !== 1 || (row.auxiliary ? owner.task : owner.batch) !== row.id) continue;
    store.assertLease();
    await rm(path, { recursive: true, force: true });
    store.assertLease();
    (row.auxiliary ? clearTask : clearBatch)(row.id, row.workspace);
  }
}
