import type { InstanceContext } from '../instance/index.js';

import type { Item } from '../contracts/items.js';
import { runnerLock } from '../platform/lock.js';
import { nowIso } from '../platform/time.js';
import { openInstance } from '../storage/index.js';
export async function saveItems(config: InstanceContext, items: Item[]) {
  const release = await runnerLock(config.paths.maintenance, new AbortController());
  try { const store = openInstance(config); try { return store.inbox.save(items, nowIso()); } finally { store.close(); } } finally { await release(); }
}
