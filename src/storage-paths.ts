import { join, resolve } from 'node:path';
import type { Config } from './config.js';

export const defaultStorageRoot = '.local/feedgarden';

export interface StoragePaths {
  root: string;
  database: string;
  state: string;
  runner: string;
  contentJournal: string;
  topicRemoteBase: string;
  publishConflict: string;
  workspaces: string;
  agents: string;
  backups: string;
  archiveBackups: string;
  twitterEnvironment: string;
  twitterSource: string;
  scheduler: string;
  runnerEnvironment: string;
  validation: string;
}

/** Resolve locations only. Callers create the directories they actually need. */
export function storagePaths(storage: Config['storage'], cwd = process.cwd()): StoragePaths {
  const root = resolve(cwd, storage.root);
  const state = join(root, 'state'), workspaces = join(root, 'workspaces');
  const backups = join(root, 'backups'), scheduler = join(root, 'scheduler');
  return {
    root, database: join(root, 'data', 'feedgarden.sqlite'), state,
    runner: join(state, 'runner'), contentJournal: join(state, 'content-journal.json'),
    topicRemoteBase: join(state, 'topic-remote-base.json'), publishConflict: join(state, 'publish-conflict.json'),
    workspaces, agents: join(workspaces, 'agents'), backups, archiveBackups: join(backups, 'archives'),
    twitterEnvironment: join(root, 'tools', 'twitter-cli'), twitterSource: join(root, 'tools', 'twitter-cli-source'),
    scheduler, runnerEnvironment: join(scheduler, 'runner.env'), validation: join(root, 'validation'),
  };
}

/** Internal execution settings; runtimeDirectory is never a user config field. */
export type AgentRuntimeConfig = Config['agent'] & { runtimeDirectory: string };
export function agentRuntime(config: Pick<Config, 'storage' | 'agent'>): AgentRuntimeConfig {
  return { ...config.agent, runtimeDirectory: storagePaths(config.storage).agents };
}
