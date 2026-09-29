import { readFile } from 'node:fs/promises';
import type { Config, Source } from './config.js';
import { generateBatch, type AgentResult } from './agent.js';
import { reportKey } from './period.js';
import { select } from './selection.js';
import { Store } from './store.js';
import type { Copy, Item, Period } from './types.js';
import { atomicWrite, errorText, hash, nowIso } from './util.js';

export function batches(items: Item[], maxItems: number, maxChars: number, maxItemChars: number): Item[][] {
  const result: Item[][] = []; let batch: Item[] = []; let size = 0;
  for (const item of items) {
    const candidate = { ...item, text: item.text.slice(0, maxItemChars) };
    const length = JSON.stringify(candidate).length;
    if (length > maxChars) throw new Error(`Item ${item.id} exceeds the Agent input budget`);
    if (batch.length && (batch.length >= maxItems || size + length > maxChars)) { result.push(batch); batch = []; size = 0; }
    batch.push(candidate); size += length;
  }
  if (batch.length) result.push(batch);
  return result;
}
export type Generator = (config: Config['agent'], items: Item[], repair?: string) => Promise<AgentResult>;
export async function generateReport(config: Config, source: Source, period: Period, store: Store, rebuild = false, generator: Generator = generateBatch, at = nowIso()): Promise<string> {
  const key = reportKey(period), previous = store.report(key);
  if (!rebuild && previous?.state === 'sealed') return 'unchanged';
  if (!rebuild && previous?.state === 'ready' && at < period.seal) return 'unchanged';
  const snapshot = !rebuild && previous && (previous.state === 'pending' || previous.state === 'failed') ? previous.snapshot : select(source, period, store, config.reports.maxItems, at, !rebuild ? previous?.snapshot : undefined);
  if (!snapshot.items.length) return 'empty';
  const agentConfig = { ...config.agent, ...source.agent, ...source.reportAgent?.[period.frequency] };
  const skillHash = hash(await readFile('.agents/skills/feedgarden-report/SKILL.md', 'utf8'));
  const cacheKey = (item: Item) => hash({ id: item.id, title: item.title, text: item.text.slice(0, agentConfig.maxItemChars), author: item.author, model: agentConfig.model, effort: agentConfig.effort, skillHash });
  if (!previous || !['ready', 'sealed'].includes(previous.state)) store.saveReport(key, snapshot, [], 'pending');
  try {
    const missing = snapshot.items.filter(item => !store.copy(cacheKey(item)));
    for (const batch of batches(missing, agentConfig.maxBatchItems, agentConfig.maxInputChars, agentConfig.maxItemChars)) {
      let repair: string | undefined;
      for (let attempt = 0; attempt < 2; attempt++) {
        const call = store.startCall(key, agentConfig.model, agentConfig.maxDailyCalls);
        try {
          const result = await generator(agentConfig, batch, repair);
          await atomicWrite(`${config.storage.directory}/agent-artifacts/${call}.json`, JSON.stringify({ report: key, model: agentConfig.model, effort: agentConfig.effort, skillHash, inputHash: hash(batch), ...result }, null, 2));
          for (const copy of result.copies) store.saveCopy(cacheKey(batch.find(item => item.id === copy.id)!), copy);
          store.finishCall(call, 'succeeded', result.usage); break;
        } catch (error) {
          repair = errorText(error); store.finishCall(call, 'failed', { error: repair });
          if (repair.includes('MANUAL_ACTION:') || attempt === 1) throw error;
        }
      }
    }
    const copies: Copy[] = snapshot.items.map(item => {
      const copy = store.copy(cacheKey(item)); if (!copy) throw new Error('Missing validated bilingual copy'); return copy;
    });
    // A recovered frozen task can predate sealing. Publish its valid artifact
    // first, then let the queued final evaluation admit later collected items.
    const recoveredBeforeSeal = !rebuild && previous && ['pending', 'failed'].includes(previous.state) && snapshot.createdAt < period.seal;
    store.saveReport(key, snapshot, copies, at >= period.seal && !recoveredBeforeSeal ? 'sealed' : 'ready');
    return 'generated';
  } catch (error) {
    if (previous && ['ready', 'sealed'].includes(previous.state)) {
      store.db.prepare('UPDATE reports SET error=? WHERE key=?').run(errorText(error), key);
    } else store.saveReport(key, snapshot, [], 'failed', errorText(error));
    throw error;
  }
}
