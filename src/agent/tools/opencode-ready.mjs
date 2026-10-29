import { rename, writeFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';

// OpenCode starts configured MCP servers asynchronously. Inspect its final tool
// registry, rather than treating a successful ACP handshake as tool readiness.
export default {
  id: 'feedgarden-acp-readiness',
  setup({ tool, options }) {
    const controller = new AbortController();
    const pending = (async () => {
      while (!controller.signal.aborted) {
        const registered = await tool.list();
        if (['feedgarden_input', 'feedgarden_result'].every(id => registered.some(entry => entry.id === id && entry.options?.codemode === false))) {
          await writeFile(options.marker + '.pending', JSON.stringify({ token: options.token }), { mode: 0o600 });
          await rename(options.marker + '.pending', options.marker);
          return;
        }
        await setTimeout(50, undefined, { signal: controller.signal });
      }
    })();
    // Parent timeout/cancellation owns the process tree; cleanup also drains the
    // observer when OpenCode disposes the plugin normally.
    pending.catch(() => { });
    return async () => { controller.abort(); await pending.catch(() => { }); };
  },
};
