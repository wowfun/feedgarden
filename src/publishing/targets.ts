import { z } from 'zod';
import { FdgError } from '../contracts/errors.js';
import type { Target } from '../contracts/publishing.js';
import type { InstanceContext } from '../instance/index.js';

export interface Entry {
  hash: string;
  identity?: { source: string; id: string };
  opaque?: boolean;
}
export interface Manifest {
  version: 1;
  instanceId: string;
  targetId: string;
  generation: string;
  namespace: string;
  entries: Record<string, Entry>;
}
export const ownerFile = '.feedgarden-owner.json';
export const manifestSchema = z.object({
  version: z.literal(1),
  instanceId: z.uuid(),
  targetId: z.string().min(1),
  generation: z.uuid(),
  namespace: z.uuid(),
  entries: z.record(
    z.string(),
    z.object({
      hash: z.string().regex(/^[a-f0-9]{64}$/),
      identity: z.object({ source: z.string().min(1), id: z.string().min(1) }).optional(),
      opaque: z.boolean().optional(),
    }),
  ),
});
export function validEntry(path: string, target: Target): boolean {
  if (path.startsWith('@/')) return target.auxiliaryFiles.includes(path.slice(2));
  return (
    path !== ownerFile &&
    !path.startsWith('/') &&
    !path.includes('\\') &&
    !path.includes(':') &&
    path.split('/').every((part) => part !== '' && part !== '.' && part !== '..' && part !== '.git')
  );
}
export function assertManagedPaths(
  paths: string[],
  prefix = 'content',
  auxiliary = ['config/topics.json'],
): void {
  for (const path of paths)
    if (path.split('/').includes('..') || (!path.startsWith(prefix + '/') && !auxiliary.includes(path)))
      throw new FdgError('UNSAFE_PATH', 'Change lies outside managed target: ' + path);
}
export function targetFor(config: InstanceContext, id?: string): Target {
  const target = id
    ? config.targets.find((t) => t.id === id)
    : config.targets.length === 1
      ? config.targets[0]
      : undefined;
  if (!target)
    throw new FdgError(
      'BAD_INPUT',
      config.targets.length ? 'Select --target ID' : 'No publication targets configured',
    );
  if (target.repository.startsWith('-') || /^(ext|file):/i.test(target.repository))
    throw new FdgError('CONFIG_INVALID', 'Unsupported repository transport');
  return target;
}
