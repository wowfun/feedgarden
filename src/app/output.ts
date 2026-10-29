import { redact, type issue } from '../contracts/errors.js';
import type { InstanceContext } from '../instance/index.js';
import { packageVersion } from '../platform/resources.js';
export interface CommandResult { command: string; config?: InstanceContext; runId: string | null; state: string; result: unknown; issues: ReturnType<typeof issue>[]; nextActions: unknown[] }
export function serializeResult({ command, config, runId, state, result, issues, nextActions }: CommandResult, text = false): string {
  const envelope = { schemaVersion: 1, packageVersion, command, instance: config ? { instanceId: config.instanceId, ...config.paths } : null, runId, state, result, issues, nextActions };
  return redact(JSON.stringify(envelope, text ? null : undefined, text ? 2 : undefined)) + '\n';
}
