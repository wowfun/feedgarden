import { FdgError } from '../contracts/errors.js';
import type { Target } from '../contracts/publishing.js';
import type { InstanceContext } from '../instance/index.js';

export function targetFor(config: InstanceContext, id?: string): Target {
  const target = id ? config.targets.find(t => t.id === id) : config.targets.length === 1 ? config.targets[0] : undefined;
  if (!target) throw new FdgError('BAD_INPUT', config.targets.length ? 'Select --target ID' : 'No publication targets configured');
  return target;
}
