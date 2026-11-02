import { readFile } from 'node:fs/promises';
import type { Registry } from '../contracts/registry.js';
import { normalizedName, validateRegistry } from '../contracts/topics.mjs';
import { atomicWrite } from '../platform/files.js';
import { hash } from '../platform/hash.js';
export async function loadTopics(path: string): Promise<Registry> { return validateRegistry(JSON.parse(await readFile(path, 'utf8'))) as Registry; }
export function topicTagAliases(registry: Registry): Record<string, string> {
  return Object.fromEntries(registry.topics.flatMap(topic => {
    const target = 'topics/' + (topic.replacedBy ?? topic.id);
    return [[topic.id, target], ...(topic.replacedBy ? [['topics/' + topic.id, target]] : [])];
  }));
}
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
export async function applyTopics(path: string, next: Registry, expectedHash?: string, signal?: AbortSignal): Promise<void> {
  const previous = await loadTopics(path);
  if (expectedHash && hash(previous) !== expectedHash) throw new Error('Topic registry changed while a task was running');
  signal?.throwIfAborted();
  const valid = assertTopicUpdate(previous, next);
  if (hash(previous) === hash(valid)) return;
  await atomicWrite(path, JSON.stringify(valid, null, 2) + '\n', signal);
}
