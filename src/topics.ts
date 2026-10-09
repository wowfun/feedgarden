import { readFile } from 'node:fs/promises';
import { validateRegistry, normalizedName } from './topics-contract.mjs';
import { atomicWrite, hash } from './util.js';
export type Topic = { id: string; name: { en: string; 'zh-CN': string }; description: string; aliases: string[]; deprecated: boolean; replacedBy?: string };
export type Registry = { version: 1; topics: Topic[] };
export async function loadTopics(path: string): Promise<Registry> { return validateRegistry(JSON.parse(await readFile(path, 'utf8'))) as Registry; }
export function assertTopicUpdate(previous: Registry, next: Registry): Registry {
  const valid = validateRegistry(next) as Registry;
  for (const old of previous.topics) {
    const current = valid.topics.find(topic => topic.id === old.id);
    if (!current) throw new Error('Topic IDs cannot be removed: ' + old.id);
    // Retain old labels as aliases so saved links and future classifications remain recognizable.
    const retained = new Set([current.name.en, current.name['zh-CN'], ...current.aliases].map(normalizedName));
    for (const label of [old.name.en, old.name['zh-CN'], ...old.aliases]) if (!retained.has(normalizedName(label))) throw new Error('Retain previous topic labels as aliases: ' + old.id);
  }
  return valid;
}
export async function applyTopics(path: string, next: Registry, expectedHash?: string): Promise<void> {
  const previous = await loadTopics(path);
  if (expectedHash && hash(previous) !== expectedHash) throw new Error('Topic registry changed while a task was running');
  await atomicWrite(path, JSON.stringify(assertTopicUpdate(previous, next), null, 2) + '\n');
}
export const resolveTopic = (registry: Registry, id: string): string => {
  const topic = registry.topics.find(topic => topic.id === id);
  if (!topic) throw new Error('Unknown stored topic: ' + id);
  return topic.replacedBy ?? topic.id;
};
export function mergeTopics(base: Registry, local: Registry, remote: Registry): Registry {
  const ids = new Set([...base.topics, ...local.topics, ...remote.topics].map(topic => topic.id));
  const topics: Topic[] = [], conflicts: string[] = [];
  for (const id of ids) {
    const b = base.topics.find(t => t.id === id), l = local.topics.find(t => t.id === id), r = remote.topics.find(t => t.id === id);
    if (b && (!l || !r)) { conflicts.push(id); continue; }
    const hb = hash(b ?? null), hl = hash(l ?? null), hr = hash(r ?? null);
    if (hl !== hb && hr !== hb && hl !== hr) { conflicts.push(id); continue; }
    const next = hl === hb ? r : l;
    if (next) topics.push(next);
  }
  if (conflicts.length) throw new Error('Topic merge conflicts: ' + conflicts.join(', '));
  return assertTopicUpdate(base, { version: 1, topics });
}
