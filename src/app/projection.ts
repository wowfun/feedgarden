import { relative, resolve } from 'node:path';
import { writeSite } from '../content/index.js';
import type { InstanceContext } from '../instance/index.js';
import { exportTarget, targetWorktree } from '../publishing/index.js';
import type { Storage } from '../storage/index.js';

export function projectionTarget(config: InstanceContext) {
  return config.targets.find(target => relative(config.feed.directory, resolve(targetWorktree(config, target), target.managedPrefix)) === '');
}

/** Explicit configs may point core rendering at a public target. Use the same
 * incremental writer there, so shortcuts cannot replay private archives over it. */
export async function writeProjection(config: InstanceContext, store: Storage, signal?: AbortSignal, rebuild = false) {
  const target = projectionTarget(config);
  return target ? exportTarget(config, store, target, { signal, rebuild }) : writeSite(config, store, signal, rebuild);
}
