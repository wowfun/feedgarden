import { setTimeout } from 'node:timers/promises';

export const nowIso = (): string => new Date().toISOString();
export const sleep = (ms: number, signal?: AbortSignal): Promise<void> => setTimeout(ms, undefined, { signal });
