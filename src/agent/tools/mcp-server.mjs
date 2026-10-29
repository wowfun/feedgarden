import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { taskSchemas } from '../../contracts/tasks.mjs';
import { fixedArtifactTools } from './artifacts.mjs';

const [directory, task] = process.argv.slice(2);
if (!directory || (task && !Object.hasOwn(taskSchemas, task))) throw new Error('Invalid trusted Feedgarden task configuration');
const tools = await fixedArtifactTools({ directory, task });
const server = new Server({ name: 'feedgarden', version: '0.1.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: 'input', description: 'Read the trusted Feedgarden skill and fixed source data. Call this first.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
    { name: 'result', description: 'Validate and save the complete structured artifact to the fixed result.json path. Supply the structured fields directly.', inputSchema: tools.schema },
  ]
}));
server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
  try {
    if (params.name !== 'input' && params.name !== 'result') throw new Error('Unknown fixed tool');
    if (params.name === 'input' && Object.keys(params.arguments ?? {}).length) throw new Error('The input tool accepts no arguments');
    const text = params.name === 'input' ? tools.input() : await tools.result(params.arguments);
    return { content: [{ type: 'text', text }] };
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }] };
  }
});
await server.connect(new StdioServerTransport());
