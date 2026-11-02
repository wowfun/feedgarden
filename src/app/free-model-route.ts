import { discoverFreeModels, freeModelWindow, useFreeModels } from '../agent/index.js';
import type { ModelRoute } from '../contracts/agent.js';
import { agentRuntime, type InstanceContext } from '../instance/index.js';
import type { RunContext } from '../runs/index.js';
import type { CheckpointStep } from './checkpoint.js';
import type { OperationResult } from './result.js';

export function freeModelRoute(config: InstanceContext, { store, signal }: RunContext, step: CheckpointStep, result: OperationResult, skipped: unknown[]): ModelRoute {
  let route: ReturnType<ModelRoute> | undefined;
  const reported = new Set<string | undefined>();

  async function select() {
    const at = new Date(Date.now()).toISOString();
    const { day } = freeModelWindow(config.timezone, at);
    const selection = await step('free-models', () => discoverFreeModels(config, store, at, signal), day);
    result.freeModels = selection;
    if (!selection.models.length) {
      skipped.push({ reason: 'no_unused_free_models', retryAt: selection.until });
      return;
    }
    return agentRuntime(useFreeModels(config, selection));
  }

  function reportBypass(source?: string) {
    if (reported.has(source)) return;
    reported.add(source);
    const agent = source ? config.sources.find(row => row.id === source)?.agent : config.agent;
    if (agent && (agent.model || agent.effort || agent.candidates?.length))
      skipped.push({ reason: 'configured_routing_bypassed', scope: source ? 'source' : 'instance', source,
        model: agent.model, effort: agent.effort, candidates: agent.candidates?.map(candidate => candidate.model), override: '--no-free-models' });
  }

  return source => {
    reportBypass();
    if (source) reportBypass(source);
    return route ??= select();
  };
}
