import { readFile, writeFile, rename, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { validateArtifact } from './topics-contract.mjs';

export const name = 'feedgarden-report';
export const inject = ['tools'];

// Paths come only from the trusted launch configuration, never from model arguments.
export async function apply(ctx, config) {
  const input = await readFile(join(config.directory, 'input.json'), 'utf8');
  const skill = await readFile(join(config.directory, 'SKILL.md'), 'utf8');
  const allowed = new Set(['feedgarden_input', 'feedgarden_result']);
  ctx.tools.guard(exec => allowed.has(exec.name) ? undefined : 'Feedgarden permits only its fixed input and output tools.');
  const result = join(config.directory, 'result.json');
  const output = { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] };
  ctx.tools.register({
    name: 'feedgarden_input', description: 'Read the trusted Feedgarden report skill and this task’s fixed source data. Call this first.',
    parameters: { type: 'object', properties: {}, additionalProperties: false }, output,
    execute: async () => JSON.stringify({ skill, input: JSON.parse(input) }),
  });
  ctx.tools.register({
    name: 'feedgarden_result', description: 'Write the complete bilingual JSON artifact to the fixed result.json path. No other files can be written.',
    parameters: { type: 'object', properties: { json: { type: 'string', description: 'The complete JSON object with the items array.' } }, required: ['json'], additionalProperties: false }, output,
    execute: async ({ json }) => {
      if (typeof json !== 'string' || Buffer.byteLength(json) > 256_000) throw new Error('Report artifact exceeds the byte limit');
      // Validate before acknowledging success so the model can repair its own
      // invalid draft within the same bounded turn. The client validates again.
      validateArtifact(JSON.parse(json), JSON.parse(input));
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
