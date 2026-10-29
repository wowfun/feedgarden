import { DateTime } from 'luxon';
import { collectSources } from '../sources/index.js';
import { importArchives } from './archives.js';
import { reconcileSelection } from './selection/select.js';
export async function collect(...args: Parameters<typeof collectSources>): ReturnType<typeof collectSources> {
  const [config, store, selected, , , , signal] = args;
  signal?.throwIfAborted(); if (args[5] && !DateTime.fromISO(args[5]).isValid) throw new Error('Invalid --since ISO date or timestamp');
  if (selected && !config.sources.some(source => source.enabled && source.id === selected)) throw new Error('Unknown or disabled source: ' + selected);
  await importArchives(config, store, signal);
  const result = await collectSources(...args);
  reconcileSelection(config, store, { source: selected, signal }); return result;
}
