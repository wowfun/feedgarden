import { z } from 'zod';
const slug = z.string().regex(/^[a-z0-9][a-z0-9_-]*$/);
export const topicSchema = z.object({ id: slug, name: z.object({ en: z.string().trim().min(1).max(100), 'zh-CN': z.string().trim().min(1).max(100) }).strict(), description: z.string().trim().min(1).max(400), aliases: z.array(z.string().trim().min(1).max(100)).default([]), deprecated: z.boolean().default(false), replacedBy: slug.optional() }).strict();
export const registrySchema = z.object({ version: z.literal(1), topics: z.array(topicSchema) }).strict();
export const normalizedName = value => value.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/[\s_-]+/g, ' ');
export function validateRegistry(value) {
  const registry = registrySchema.parse(value), ids = new Map(), names = new Map();
  for (const topic of registry.topics) {
    if (ids.has(topic.id)) throw new Error('Duplicate topic ID: ' + topic.id);
    ids.set(topic.id, topic);
    for (const value of [topic.id, topic.name.en, topic.name['zh-CN'], ...topic.aliases]) {
      const name = normalizedName(value), previous = names.get(name);
      if (previous && previous !== topic.id) throw new Error('Duplicate topic name/alias: ' + value + ' (' + previous + ', ' + topic.id + ')');
      names.set(name, topic.id);
    }
  }
  for (const topic of registry.topics) if (topic.replacedBy) {
    const target = ids.get(topic.replacedBy);
    if (!topic.deprecated || !target || target.deprecated || topic.replacedBy === topic.id) throw new Error('Topic replacement must target an active topic: ' + topic.id);
  }
  return registry;
}
const translation = z.object({ title: z.string().trim().min(1).max(240), summary: z.string().max(600) }).strict();
export const outputSchema = z.object({ contractVersion: z.literal(2), items: z.array(z.object({ source: slug, id: z.string(), topics: z.array(slug).min(1).max(3), en: translation, 'zh-CN': translation }).strict()), newTopics: z.array(topicSchema) }).strict();
function parseArtifact(value, input) {
  const output = outputSchema.parse(value);
  if (input.contractVersion !== 2 || output.items.length !== input.items.length || output.items.some((copy, i) => copy.id !== input.items[i]?.id || copy.source !== input.items[i]?.source)) throw new Error('Agent output identity/order differs from the fixed input');
  const registry = validateRegistry({ version: 1, topics: [...input.topics.topics, ...output.newTopics] });
  if (output.newTopics.some(topic => topic.deprecated || topic.replacedBy)) throw new Error('Agents may only append active topics');
  const active = new Set(registry.topics.filter(topic => !topic.deprecated).map(topic => topic.id));
  for (let i = 0; i < input.items.length; i++) {
    const copy = output.items[i];
    if (new Set(copy.topics).size !== copy.topics.length || copy.topics.some(id => !active.has(id))) throw new Error('Unknown, duplicate or deprecated item topics');
    if (!input.items[i].text && (copy.en.summary || copy['zh-CN'].summary)) throw new Error('Title-only input must have empty summaries');
  }
  return { output, registry };
}

export class ArtifactError extends Error {}
export function validateArtifact(value, input) {
  try { return parseArtifact(value, input); }
  catch (error) { throw new ArtifactError(error instanceof Error ? error.message : String(error)); }
}
