import { join } from 'node:path';
import { applyTopics, mergeTopics } from '../content/index.js';
import { FdgError } from '../contracts/errors.js';
import type { Target } from '../contracts/publishing.js';
import { type Registry } from '../contracts/registry.js';
import type { InstanceContext } from '../instance/index.js';
import { atomicWrite } from '../platform/files.js';
import { checkout, owned } from './checkout.js';
export async function reconcileTargetTopics(
  config: InstanceContext,
  target: Target,
  expectedHead: string,
  next: Registry,
  signal?: AbortSignal,
) {
  const current = await checkout(config, target, signal);
  try {
    owned(config, target, current.manifest, current.files);
    if (current.head !== expectedHead)
      throw new FdgError('REMOTE_CHANGED', 'Remote base does not match target head');
    const body = current.files['@/config/topics.json'] ?? current.files['topics.json'];
    const remote = body ? (JSON.parse(body.toString()) as Registry) : { version: 1 as const, topics: [] };
    const merged = mergeTopics(remote, next, remote);
    await applyTopics(config.feed.topics, merged, undefined, signal);
    await atomicWrite(
      join(config.paths.targets, target.id, 'baseline.json'),
      JSON.stringify({ commit: current.head, manifest: current.manifest, topics: remote }),
    );
  } finally { await current.dispose(); }
}
