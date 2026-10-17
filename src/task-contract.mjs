import { z } from 'zod';
import { ArtifactError } from './topics-contract.mjs';

export const taskSchemas = {
  transcript: z.object({ taskId: z.string(), inputIds: z.array(z.string()), facts: z.string().min(1).max(1500) }).strict(),
  relations: z.object({ pairs: z.array(z.object({ id: z.string(), verdict: z.enum(['same-event', 'direct-followup', 'unrelated', 'uncertain']), reason: z.string().max(600), evidence: z.tuple([z.string().max(800), z.string().max(800)]) }).strict()) }).strict(),
};

/** @param {'transcript'|'relations'} task @param {unknown} value @param {any} input */
export function validateTask(task, value, input) {
  const parsed = taskSchemas[task].safeParse(value);
  if (!parsed.success) throw new ArtifactError(parsed.error.message);
  const output = parsed.data;
  if (task === 'transcript') {
    if (output.facts.length > input.maxChars) throw new ArtifactError('Facts exceed the requested character budget');
    if (output.taskId !== input.taskId || JSON.stringify(output.inputIds) !== JSON.stringify(input.parts.map(p => p.id))) throw new ArtifactError('Transcript task and ordered input IDs must match exactly');
  } else {
    if (output.pairs.length !== input.pairs.length) throw new ArtifactError('Return every supplied pair exactly once, in order');
    output.pairs.forEach((pair, i) => {
      const fixed = input.pairs[i];
      if (pair.id !== fixed.id) throw new ArtifactError('Pair identity or order changed');
      if (['same-event', 'direct-followup'].includes(pair.verdict)) {
        if (!pair.reason.trim() || pair.evidence.some((quote, side) => !quote.trim() || !fixed.texts[side].includes(quote))) throw new ArtifactError('Positive relations require exact evidence from BOTH supplied texts');
      }
    });
  }
  return output;
}
