// @ts-check
import { fixedArtifactTools } from './artifacts.mjs';

export const name = 'feedgarden-report';
export const inject = ['tools'];

// Paths come only from the trusted launch configuration, never from model arguments.
/**
 * @param {{tools: {guard:(callback:(execution:{name:string})=>string|undefined)=>void,register:(tool:any)=>void}, provide: (name: string, value: unknown) => void}} ctx
 * @param {{directory: string, task?: import('../../contracts/agent.js').ReportTask}} config
 */
export async function apply(ctx, config) {
  const fixed = await fixedArtifactTools(config);
  const allowed = new Set(['feedgarden_input', 'feedgarden_result']);
  ctx.tools.guard(exec => allowed.has(exec.name) ? undefined : 'Feedgarden permits only its fixed input and output tools.');
  /** @type {{schema:object,render:(args:unknown,value:unknown)=>{type:string,text:string}[]}} */
  const output = { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: String(value) }] };
  ctx.tools.register({
    name: 'feedgarden_input', description: 'Read the trusted Feedgarden task skill and its fixed source data. Call this first.',
    parameters: { type: 'object', properties: {}, additionalProperties: false }, output,
    execute: async () => fixed.input(),
  });
  ctx.tools.register({
    name: 'feedgarden_result', description: 'Write the complete structured task artifact to the fixed result.json path. No other files can be written.',
    parameters: fixed.schema, output,
    execute: fixed.result,
  });
  ctx.provide('feedgardenReport', { ready: true });
}
