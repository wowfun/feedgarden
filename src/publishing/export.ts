import { join, resolve } from 'node:path';
import { generateDirectory } from '../content/index.js';
import { FdgError } from '../contracts/errors.js';
import type { Target } from '../contracts/publishing.js';
import { assertExportDirectory, type InstanceContext } from '../instance/index.js';
import { ensureSafe } from '../platform/tree.js';
import type { Storage } from '../storage/index.js';
import { checkout } from './checkout.js';

export async function exportTarget(config: InstanceContext, store: Storage, target?: Target, options: { output?: string; format?: Target['format']; rebuild?: boolean; signal?: AbortSignal } = {}) {
  if (target && (options.output || options.format)) throw new FdgError('BAD_INPUT', '--target cannot be combined with --output or --format');
  // generateDirectory performs the regular-file walk before writing anything.
  const current = target ? await checkout(config, target, options.signal, { scanPrefix: false }) : undefined;
  const format = target?.format ?? options.format ?? 'markdown';
  const output = current?.prefix ?? resolve(options.output ?? join(config.paths.dataDir, 'exports', 'manual'));
  assertExportDirectory(config.paths, output);
  const topics = current && target?.auxiliaryFiles.includes('config/topics.json')
    ? await ensureSafe(current.root, 'config/topics.json') : join(output, 'topics.json');
  return generateDirectory(config, store, output, format, topics, options);
}
