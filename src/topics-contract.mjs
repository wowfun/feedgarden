// @ts-check
import { z } from 'zod';
/** @typedef {import('./agent.js').SummaryInput} SummaryInput */
const slug = z.string().regex(/^[a-z0-9][a-z0-9_-]*$/);
export const topicSchema = z.object({ id: slug, name: z.object({ en: z.string().trim().min(1).max(100), 'zh-CN': z.string().trim().min(1).max(100) }).strict(), description: z.string().trim().min(1).max(400), aliases: z.array(z.string().trim().min(1).max(100)).default([]), deprecated: z.boolean().default(false), hidden: z.boolean().default(false), replacedBy: slug.optional() }).strict();
export const registrySchema = z.object({ version: z.literal(1), topics: z.array(topicSchema) }).strict();
/** @param {string} value */
export const normalizedName = value => value.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/[\s_-]+/g, ' ');
/** @param {unknown} value */
export function validateRegistry(value) {
  const registry = registrySchema.parse(value);
  /** @type {Map<string, import('zod').infer<typeof topicSchema>>} */
  const ids = new Map();
  /** @type {Map<string, string>} */
  const names = new Map();
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
    if (!topic.deprecated || !target || target.deprecated || target.hidden || topic.replacedBy === topic.id) throw new Error('Topic replacement must target an active, visible topic: ' + topic.id);
  }
  return registry;
}
const translation = z.object({ title: z.string().trim().min(1).max(240), summary: z.string().max(4000) }).strict();
const mediaSchema = z.object({ id: slug, type: z.enum(['image', 'video', 'audio', 'pdf']), url: z.url().max(2048).refine(value => { const url = new URL(value); return /^https?:$/.test(url.protocol) && !url.username && !url.password; }), title: z.string().max(240) }).strict();
const discussionSchema = z.object({ commentIds: z.array(z.string().regex(/^\d+$/)).min(1).max(6), en: z.string().trim().min(1).max(2000), 'zh-CN': z.string().trim().min(1).max(2000) }).strict();
export const outputSchema = z.object({ contractVersion: z.literal(2), items: z.array(z.object({ source: slug, id: z.string(), topics: z.array(slug).min(1).max(3), media: z.array(slug).max(3).optional(), discussion: discussionSchema.optional(), en: translation, 'zh-CN': translation }).strict()), newTopics: z.array(topicSchema) }).strict();
/** @param {unknown} value @param {SummaryInput} input */
function parseArtifact(value, input) {
  const output = outputSchema.parse(value);
  if (input.contractVersion !== 2 || output.items.length !== input.items.length || output.items.some((copy, i) => copy.id !== input.items[i]?.id || copy.source !== input.items[i]?.source)) throw new Error('Agent output identity/order differs from the fixed input');
  const registry = validateRegistry({ version: 1, topics: [...input.topics.topics, ...output.newTopics] });
  if (output.newTopics.some(topic => topic.deprecated || topic.hidden || topic.replacedBy)) throw new Error('Agents may only append active, visible topics');
  const active = new Set(registry.topics.filter(topic => !topic.deprecated && !topic.hidden).map(topic => topic.id));
  for (const [i, copy] of output.items.entries()) {
    const supplied = input.items[i];
    if (!supplied) throw new Error('Agent output identity/order differs from the fixed input');
    if (new Set(copy.topics).size !== copy.topics.length || copy.topics.some(id => !active.has(id))) throw new Error('Unknown, duplicate, hidden or deprecated item topics');
    if (!supplied.text && (copy.en.summary || copy['zh-CN'].summary)) throw new Error('Title-only input must have empty summaries');
    if (supplied.articleQuote && (copy.en.summary || copy['zh-CN'].summary)) throw new Error('Quoted short originals must have empty main summaries');
    if (supplied.source === 'hackernews') {
      if (supplied.title.length > 20 && (copy.en.title.length < 4 || copy['zh-CN'].title.length < 4)) throw new Error('HN titles must be informative headlines, not placeholders');
      if (supplied.text.length > 600 && !supplied.articleQuote && (copy.en.summary.trim().length < 120 || copy['zh-CN'].summary.trim().length < 60)) throw new Error('Substantial HN originals require informative bilingual summaries, not placeholders');
    }
    const comments = supplied.discussion?.comments ?? [], ids = new Set(comments.map(comment => comment.id));
    if (comments.length && !copy.discussion) throw new Error('Supplied HN comments require a bilingual discussion synopsis');
    if (copy.discussion && (supplied.source !== 'hackernews' || !comments.length || new Set(copy.discussion.commentIds).size !== copy.discussion.commentIds.length || copy.discussion.commentIds.some(id => !ids.has(id)))) throw new Error('Unknown, duplicate or unavailable discussion comment');
    const candidates = z.array(mediaSchema).max(6).parse(supplied.media ?? []);
    const media = copy.media ?? [];
    if (new Set(candidates.map(candidate => candidate.id)).size !== candidates.length) throw new Error('Duplicate input media IDs');
    if (new Set(media).size !== media.length || media.some(id => !candidates.some(candidate => candidate.id === id))) throw new Error('Unknown or duplicate selected media');
  }
  return { output, registry };
}

export class ArtifactError extends Error {}
/** @param {unknown} value @param {SummaryInput} input */
export function validateArtifact(value, input) {
  try { return parseArtifact(value, input); }
  catch (error) { throw new ArtifactError(error instanceof Error ? error.message : String(error)); }
}
