// @ts-check
import { readFile, writeFile, rename, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { validateArtifact, outputSchema } from './topics-contract.mjs';

export const name = 'feedgarden-report';
export const inject = ['tools'];

// Paths come only from the trusted launch configuration, never from model arguments.
/**
 * @param {{tools: Pick<import('@deepseek-ai/dsh-tools').ToolRuntime, 'guard' | 'register'>, provide: (name: string, value: unknown) => void}} ctx
 * @param {{directory: string}} config
 */
export async function apply(ctx, config) {
  const input = await readFile(join(config.directory, 'input.json'), 'utf8');
  /** @type {import('./agent.js').SummaryInput} */
  const fixedInput = JSON.parse(input);
  const skill = await readFile(join(config.directory, 'SKILL.md'), 'utf8');
  const allowed = new Set(['feedgarden_input', 'feedgarden_result']);
  ctx.tools.guard(exec => allowed.has(exec.name) ? undefined : 'Feedgarden permits only its fixed input and output tools.');
  const result = join(config.directory, 'result.json');
  /** @type {import('@deepseek-ai/dsh-tools').ToolOutputDefinition} */
  const output = { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: String(value) }] };
  ctx.tools.register({
    name: 'feedgarden_input', description: 'Read the trusted Feedgarden report skill and this task’s fixed source data. Call this first.',
    parameters: { type: 'object', properties: {}, additionalProperties: false }, output,
    execute: async () => JSON.stringify({ skill, input: fixedInput }),
  });
  ctx.tools.register({
    name: 'feedgarden_result', description: 'Write the complete bilingual JSON artifact to the fixed result.json path. No other files can be written.',
    parameters: outputSchema.toJSONSchema(), output,
    execute: async artifact => {
      const json = JSON.stringify(artifact);
      if (!json || Buffer.byteLength(json) > 256_000) throw new Error('Report artifact exceeds the byte limit');
      // Validate before acknowledging success so the model can repair its own
      // invalid draft within the same bounded turn. The client validates again.
      validateArtifact(artifact, fixedInput);
      const previous = await lstat(result).catch(error => { if (error.code === 'ENOENT') return undefined; throw error; });
      if (previous && !previous.isFile()) throw new Error('Output must be a regular file');
      const temporary = join(config.directory, 'result.pending');
      await writeFile(temporary, json, { mode: 0o600, flag: 'wx' });
      await rename(temporary, result);
      return 'Validated and saved result.json. The report is complete.';
    },
  });
  ctx.provide('feedgardenReport', { ready: true });
}
