import { join } from 'node:path';
import type { AgentRuntimeConfig } from '../contracts/agent.js';
import type { Config } from '../contracts/configuration.js';
import { type InstancePaths } from './paths.js';

export function storagePaths(paths: InstancePaths) {
  const root = paths.dataDir, state = paths.stateDir, cache = paths.cacheDir;
  const workspaces = join(root, 'workspaces'), backups = join(root, 'backups'), recovery = join(root, 'recovery');
  return {
    ...paths, root, state, cache, database: join(root, 'feedgarden.sqlite'), transport: join(root, 'transport.sqlite'),
    runner: join(root, 'runner'), maintenance: join(root, 'maintenance'), recovery,
    contentJournal: join(recovery, 'content-journal.json'), topicRemoteBase: join(recovery, 'topic-remote-base.json'),
    publishConflict: join(recovery, 'publish-conflict.json'), workspaces, agents: join(workspaces, 'agents'),
    backups, archiveBackups: join(backups, 'archives'), targets: join(root, 'targets'), runtime: join(root, 'runtime'),
    twitterEnvironment: join(root, 'tools', 'twitter-cli'), twitterSource: join(root, 'tools', 'twitter-cli-source'),
    scheduler: join(state, 'scheduler'), runnerEnvironment: join(root, 'secrets', 'runner.env'), validation: join(state, 'validation'),
  };
}
export type StoragePaths = ReturnType<typeof storagePaths>;
export type InstanceContext = Config & { readonly paths: StoragePaths; readonly executionPolicy: Readonly<{ fallbackEnabled: boolean }> };
export function createInstanceContext(config: Config, paths: InstancePaths, policy: { fallbackEnabled?: boolean } = {}): InstanceContext {
  return Object.freeze({ ...config, paths: Object.freeze(storagePaths(paths)), executionPolicy: Object.freeze({ fallbackEnabled: policy.fallbackEnabled ?? false }) });
}
/** Only persisted configuration participates in run hashes and configuration files. */
export function configuration(context: InstanceContext): Config { const { paths, executionPolicy, ...config } = context; return config; }
export function withExecutionPolicy(context: InstanceContext, policy: { fallbackEnabled: boolean }): InstanceContext { return createInstanceContext(configuration(context), context.paths, policy); }
export function agentRuntime(config: InstanceContext): AgentRuntimeConfig {
  return { ...config.agent, ...(config.agent.backend === 'dsh' && !config.agent.command ? { command: join(config.paths.dataDir, 'tools', 'dsh', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js') } : {}), runtimeDirectory: config.paths.agents, fallbackEnabled: config.executionPolicy.fallbackEnabled };
}
