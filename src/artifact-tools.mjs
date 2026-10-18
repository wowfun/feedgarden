// @ts-check
import { readFile, writeFile, rename, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { validateArtifact, outputSchema } from './topics-contract.mjs';
import { taskSchemas, validateTask } from './task-contract.mjs';

/** @param {{directory: string, task?: keyof typeof taskSchemas}} config */
export async function fixedArtifactTools(config) {
  if (config.task && !Object.hasOwn(taskSchemas, config.task)) throw new Error('Unknown trusted task');
  const input = await readFile(join(config.directory, 'input.json'), 'utf8');
  /** @type {import('./agent.js').SummaryInput} */
  const fixedInput = JSON.parse(input);
  const skill = await readFile(join(config.directory, 'SKILL.md'), 'utf8');
  const result = join(config.directory, 'result.json');
  return {
    input: () => JSON.stringify({ skill, input: fixedInput }),
    schema: (config.task ? taskSchemas[config.task] : outputSchema).toJSONSchema(),
    /** @param {unknown} artifact */
    result: async artifact => {
      const json = JSON.stringify(artifact);
      if (!json || Buffer.byteLength(json) > 256_000) throw new Error('Report artifact exceeds the byte limit');
      // Validate before acknowledging success so the model can repair its own
      // invalid draft within the same bounded turn. The client validates again.
      if (config.task) validateTask(config.task, artifact, fixedInput);
      else validateArtifact(artifact, fixedInput);
      const previous = await lstat(result).catch(error => { if (error.code === 'ENOENT') return undefined; throw error; });
      if (previous && !previous.isFile()) throw new Error('Output must be a regular file');
      const temporary = join(config.directory, 'result.pending');
      await writeFile(temporary, json, { mode: 0o600, flag: 'wx' });
      await rename(temporary, result);
      return 'Validated and saved result.json. The report is complete.';
    },
  };
}
