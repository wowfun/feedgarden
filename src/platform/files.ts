import { randomUUID } from 'node:crypto';
import { mkdir, open, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function atomicWrite(path: string, content: string, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const file = await open(temporary, 'w', 0o600);
    try { await file.writeFile(content); await file.sync(); } finally { await file.close(); }
    signal?.throwIfAborted();
    await rename(temporary, path);
    // Node cannot open directory handles for fsync on Windows (EPERM). The file
    // itself is flushed before rename; directory-entry crash durability is POSIX-only.
    if (process.platform === 'win32') return;
    const directory = await open(dirname(path), 'r');
    try { await directory.sync(); } finally { await directory.close(); }
  } finally { await rm(temporary, { force: true }); }
}
