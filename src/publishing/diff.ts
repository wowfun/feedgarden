import { FdgError } from '../contracts/errors.js';
import { hash } from '../platform/hash.js';
import type { Entry, Manifest } from './targets.js';
export function targetDiff(files: Record<string, Buffer>, manifest: Manifest | undefined, exported: Record<string, Entry>, topicKey: string) {
  const entries: Record<string, Entry> = { ...manifest?.entries },
    changes: { path: string; action: string }[] = [];
  for (const [path, entry] of Object.entries(exported)) {
    const old = files[path];
    const identity = manifest?.entries[path]?.identity;
    if (identity && entry.identity && hash(identity) !== hash(entry.identity))
      throw new FdgError('PATH_CONFLICT', 'Export identity differs from remote reservation: ' + path);
    if (
      old &&
      path !== topicKey &&
      manifest?.entries[path] &&
      hash(old) !== manifest.entries[path]!.hash
    )
      throw new FdgError('REMOTE_CHANGED', 'Remote managed file changed: ' + path);
    if (old && !manifest?.entries[path])
      throw new FdgError('PATH_CONFLICT', 'Unowned file occupies export path: ' + path);
    if (old && hash(old) === entry.hash) {
      entries[path] = entry;
      continue;
    }
    entries[path] = entry;
    changes.push({ path, action: old ? 'update' : 'add' });
  }

  return { entries, changes };
}
