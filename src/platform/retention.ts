import { lstat, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { atomicWrite } from './files.js';

const marker = '.feedgarden-retention.json';
interface Owner { version: 1; kind: string; owner: string; group: string; createdAt: string; pid: number; complete: boolean; succeeded?: boolean }
export function processAlive(pid: number): boolean {
  if (!Number.isSafeInteger(pid) || pid < 1) return false;
  try { process.kill(pid, 0); return true; } catch (error) { return (error as NodeJS.ErrnoException).code === 'EPERM'; }
}
async function ownership(directory: string): Promise<Owner | undefined> {
  const info = await lstat(directory).catch(() => undefined);
  if (!info?.isDirectory() || info.isSymbolicLink()) return;
  const path = join(directory, marker), file = await lstat(path).catch(() => undefined);
  if (!file?.isFile() || file.isSymbolicLink() || file.size > 4096) return;
  try {
    const value = JSON.parse(await readFile(path, 'utf8'));
    if (value.version === 1 && ['kind', 'owner', 'group'].every(key => typeof value[key] === 'string') && Number.isSafeInteger(value.pid) && Number.isFinite(Date.parse(value.createdAt)) && typeof value.complete === 'boolean') return value;
  } catch { /* Unknown or damaged evidence is retained. */ }
}
export async function markArtifact(directory: string, kind: string, owner: string, group = kind): Promise<void> {
  await atomicWrite(join(directory, marker), JSON.stringify({ version: 1, kind, owner, group, createdAt: new Date().toISOString(), pid: process.pid, complete: false } satisfies Owner));
}
export async function completeArtifact(directory: string, succeeded = true): Promise<void> {
  const value = await ownership(directory);
  if (value) await atomicWrite(join(directory, marker), JSON.stringify({ ...value, complete: true, succeeded }));
}
export async function holdArtifact(directory: string, pid = process.pid): Promise<void> {
  if (!await ownership(directory)) return;
  if (await lstat(join(directory, '.feedgarden-pinned')).catch(() => undefined)) return;
  await mkdir(join(directory, '.feedgarden-users'), { recursive: true });
  await atomicWrite(join(directory, '.feedgarden-users', String(pid)), '');
}
export async function pinArtifact(directory: string, pinned = true, owner?: string): Promise<void> {
  const value = await ownership(directory);
  if (!value || owner !== undefined && value.owner !== owner) return;
  const path = join(directory, '.feedgarden-pinned');
  if (pinned) await atomicWrite(path, 'Persistent external reference or unconfirmed push\n');
  else await rm(path, { force: true });
}
async function inUse(directory: string): Promise<boolean> {
  if (await lstat(join(directory, '.feedgarden-pinned')).catch(() => undefined)) return true;
  const users = join(directory, '.feedgarden-users');
  const info = await lstat(users).catch(() => undefined);
  if (info?.isSymbolicLink()) return true;
  let active = false;
  for (const name of await readdir(users).catch(() => [])) {
    if (!/^\d+$/.test(name)) { active = true; continue; }
    if (processAlive(Number(name))) active = true;
    else await rm(join(users, name), { force: true }).catch(() => undefined);
  }
  return active;
}
/** Only direct, marked children are eligible. Retain recent artifacts, at least
 * keepPerGroup newest artifacts, and every active or pinned artifact. */
export async function pruneArtifacts(root: string, kind: string, owner: string, keepPerGroup = 3, days = 30, now = Date.now()): Promise<string[]> {
  root = resolve(root);
  const info = await lstat(root).catch(() => undefined);
  if (!info?.isDirectory() || info.isSymbolicLink()) return [];
  const groups = new Map<string, { path: string; value: Owner }[]>();
  for (const entry of await readdir(root, { withFileTypes: true }).catch(() => [])) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    const path = resolve(root, entry.name);
    if (dirname(path) !== root) continue;
    const value = await ownership(path);
    if (!value || value.owner !== owner || value.kind !== kind || !value.complete && processAlive(value.pid) || await inUse(path)) continue;
    const group = groups.get(value.group) ?? [];
    group.push({ path, value }); groups.set(value.group, group);
  }
  const removed: string[] = [];
  for (const group of groups.values()) {
    group.sort((a, b) => Date.parse(b.value.createdAt) - Date.parse(a.value.createdAt));
    const latestSuccess = group.find(entry => entry.value.succeeded)?.path;
    for (const { path, value } of group.slice(keepPerGroup)) {
      if (path === latestSuccess) continue;
      if (Date.parse(value.createdAt) >= now - days * 86400_000) continue;
      const current = await ownership(path);
      if (dirname(resolve(path)) !== root || current?.owner !== owner || current.kind !== kind || current.createdAt !== value.createdAt || !current.complete && processAlive(current.pid) || await inUse(path)) continue;
      try { await rm(path, { recursive: true, force: true }); removed.push(path); }
      catch { /* Retry a busy artifact on the next pass. */ }
    }
  }
  return removed;
}
