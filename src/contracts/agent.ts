import type { Config } from './configuration.js';
import type { Item } from './items.js';
import type { Registry } from './registry.js';
import type { taskSchemas } from './tasks.mjs';
import type { validateArtifact } from './topics.mjs';
export type AgentRuntimeConfig = Config['agent'] & { runtimeDirectory: string; fallbackEnabled?: boolean; freeModelRetrySince?: string; freeModelRetryUntil?: string };
export function supportsModelRouting(command: string): boolean {
  return ['process', 'sync', 'relate'].includes(command);
}
/** Resolve a policy route on demand. An empty route defers pending model work. */
export type ModelRoute = (source?: string) => Promise<AgentRuntimeConfig | undefined>;
export type ReportTask = keyof typeof taskSchemas;
export interface SummaryInput { contractVersion: 2; topics: Registry; items: (Pick<Item, 'source' | 'id' | 'title' | 'text' | 'author' | 'media' | 'articleQuote'> & { discussion?: Pick<NonNullable<Item['discussion']>, 'comments'> })[] }
export interface AgentIdentity { backend: AgentRuntimeConfig['backend']; version: string; model: string; effort?: string; configurationHash?: string }
export type ResolvedAgent = AgentRuntimeConfig & { model: string; execution: AgentIdentity };
export type AgentResolver = (config: AgentRuntimeConfig, signal?: AbortSignal) => Promise<ResolvedAgent>;
export interface TaskResult { output: unknown; usage: unknown[]; directory: string; events: unknown[]; execution?: AgentIdentity; omittedNotifications?: { usage: number; events: number } }
export interface AgentResult extends TaskResult { output: ReturnType<typeof validateArtifact>['output'] }
export type AuxiliaryTask = ReportTask;

