import { z } from 'zod';

const translation = z.object({ title: z.string().min(1).max(240), summary: z.string().max(600) }).strict();
export const outputSchema = z.object({ items: z.array(z.object({ id: z.string(), en: translation, 'zh-CN': translation }).strict()) }).strict();

/** @param {unknown} value @param {Array<{id: string, text: string}>} items */
export function validateCopies(value, items) {
  const output = outputSchema.parse(value).items;
  if (output.length !== items.length || output.some((copy, index) => copy.id !== items[index]?.id)) throw new Error('Agent output IDs or order differ from the fixed input');
  for (let index = 0; index < items.length; index++) {
    if (!items[index].text && (output[index].en.summary || output[index]['zh-CN'].summary)) throw new Error('Title-only input must have empty summaries');
  }
  return output;
}
