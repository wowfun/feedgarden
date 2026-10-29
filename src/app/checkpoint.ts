import type { RunContext } from '../runs/index.js';
export type CheckpointStep = <T>(name: string, operation: () => Promise<T>, revision?: string) => Promise<T>;
export function checkpointStep({ checkpoint, signal, store, saveCheckpoint }: RunContext): CheckpointStep {
  return async<T>(name: string, operation: () => Promise<T>, revision?: string): Promise<T> => {
    const prior = checkpoint[name] as { complete: boolean; value: T; revision?: string } | undefined;
    if (prior?.complete && prior.revision === revision) return prior.value;
    signal.throwIfAborted(); store.assertLease(); const value = await operation();
    const progress = value as { pending?: number; failed?: number; deferred?: boolean; sourceErrors?: unknown[]; jobErrors?: unknown[]; configurationError?: string } | null;
    const complete = Array.isArray(value) ? !value.some(row => ['failed', 'deferred', 'unavailable'].includes(row.status)) : !(progress?.pending || progress?.failed || progress?.deferred || progress?.sourceErrors?.length || progress?.jobErrors?.length || progress?.configurationError);
    saveCheckpoint(name, { value, complete, revision }); return value;
  };
}
