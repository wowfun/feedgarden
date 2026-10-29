import type { ReadStorage } from '../storage/index.js';
import type { InstanceContext } from '../instance/index.js';


export function budgetReport(config: InstanceContext, store: Pick<ReadStorage, 'models'>) {
  const day = new Date().toISOString().slice(0, 10),
    configured = new Map<string, { backend: string; account: string; model: string; limit: number }>();
  for (const policy of [
    config.agent,
    ...config.sources.filter((s) => s.enabled).map((s) => ({ ...config.agent, ...s.agent })),
  ]) {
    for (const route of [policy, ...policy.candidates.map((candidate) => ({ ...policy, ...candidate }))]) {
      const model = route.model ?? 'inherited',
        key = JSON.stringify([route.backend, route.account, model]);
      const prior = configured.get(key);
      configured.set(key, {
        backend: route.backend,
        account: route.account,
        model,
        limit: Math.min(prior?.limit ?? Infinity, route.maxDailyCalls),
      });
    }
  }
  const usage = store.models.dailyUsage(day);
  const models = [...configured].map(([key, route]) => {
    const used = usage
      .filter((row) => row.model === key || row.model === route.model)
      .reduce((count, row) => count + Number(row.used), 0);
    return {
      ...route,
      used,
      remaining: route.model === 'inherited' ? null : Math.max(0, route.limit - used),
    };
  });
  const unconfigured = usage.filter(
    (row) => !configured.has(row.model) && !models.some((model) => model.model === row.model),
  );
  return {
    day,
    resetAt: new Date(Date.parse(day + 'T00:00:00Z') + 86400000).toISOString(),
    models,
    unconfigured,
    configuredTotal: models.reduce((n, model) => n + model.limit, 0),
    globalLimit: null,
  };
}
