import { DateTime } from 'luxon';
import type { InstanceContext } from '../instance/index.js';
import { withExecutionPolicy } from '../instance/index.js';
import type { ReadStorage } from '../storage/index.js';
import { FdgError } from '../contracts/errors.js';
import { openCodeModels } from './backends.js';

export interface FreeModelSelection {
  timezone: string; day: string; since: string; until: string;
  models: string[]; skippedUsed: string[];
}
export async function discoverFreeModels(config: InstanceContext, store: Pick<ReadStorage, 'models'>,
  at: string, signal?: AbortSignal, list = openCodeModels): Promise<FreeModelSelection> {
  if (config.agent.backend !== 'opencode') throw new FdgError('BAD_INPUT', '--free-models requires OpenCode');
  const day = DateTime.fromISO(at).setZone(config.timezone).startOf('day');
  const since = day.toUTC().toISO()!, until = day.plus({ days: 1 }).toUTC().toISO()!;
  const catalog = [...new Set((await list(config.agent, config.paths.agents, signal))
    .filter(model => /^[^\s/#]+\/[^\s#]*free$/.test(model)))];
  const used = new Set<string>();
  for (const { model } of store.models.usedBetween(since, until)) {
    let identity: unknown;
    try { identity = JSON.parse(model); } catch { used.add(model); continue; }
    if (Array.isArray(identity) && identity[0] === 'opencode' && typeof identity[2] === 'string') used.add(identity[2]);
  }
  return { timezone: config.timezone, day: day.toISODate()!, since, until,
    models: catalog.filter(model => !used.has(model)), skippedUsed: catalog.filter(model => used.has(model)) };
}

export function useFreeModels(config: InstanceContext, selection: FreeModelSelection): InstanceContext {
  if (!selection.models.length) throw new FdgError('FREE_MODELS_EXHAUSTED', 'No unused free models remain for this instance day', selection.until);
  const model = selection.models[0]!, candidates = selection.models.slice(1).map(model => ({
    model, account: config.agent.account, maxDailyCalls: config.agent.maxDailyCalls,
  }));
  // Selection is an explicit run override; native defaults must not carry an
  // effort or source-specific model into a newly discovered route.
  return withExecutionPolicy({ ...config,
    agent: { ...config.agent, model, effort: undefined, candidates },
    sources: config.sources.map(source => ({ ...source, agent: { model, candidates } })),
  }, { fallbackEnabled: true, freeModelRetrySince: selection.since, freeModelRetryUntil: selection.until });
}
