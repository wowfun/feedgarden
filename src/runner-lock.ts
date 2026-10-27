import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import lockfile from 'proper-lockfile';

// Shared by database runners and disk-only clipping maintenance.
export async function runnerLock(target: string, cancellation: AbortController): Promise<() => Promise<void>> {
  await mkdir(dirname(target), { recursive: true, mode: 0o700 });
  await writeFile(target, '', { flag: 'a', mode: 0o600 });
  let compromised = false;
  const release = await lockfile.lock(target, {
    stale: 120_000, update: 10_000, retries: 0,
    onCompromised(error) { compromised = true; cancellation.abort(error); },
  });
  return async () => {
    try { await release(); }
    catch (error) { if (!compromised || (error as NodeJS.ErrnoException).code !== 'ERELEASED') throw error; }
  };
}
