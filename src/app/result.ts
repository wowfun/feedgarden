import type { budgetReport } from '../agent/index.js';
import type { collect, rankItems, relate, summarize } from '../content/index.js';
import type { adoptTarget, exportTarget, publish } from '../publishing/index.js';
import type { RunScope } from '../runs/index.js';
import type { setupTwitter } from '../sources/index.js';
import type { fetchClippings } from '../ui/index.js';
export interface OperationResult {
  collections?: Awaited<ReturnType<typeof collect>>; explicitItems?: number; rank?: Awaited<ReturnType<typeof rankItems>>;
  summary?: Awaited<ReturnType<typeof summarize>>; relations?: Awaited<ReturnType<typeof relate>>;
  export?: Awaited<ReturnType<typeof exportTarget>>; topics?: { applied: boolean }; archiveBackup?: string;
  database?: string[]; pendingArtifacts?: string; adoption?: Awaited<ReturnType<typeof adoptTarget>>;
  backend?: { installed: boolean; directory: string; version: string; receipt: string }; channel?: Awaited<ReturnType<typeof setupTwitter>>;
  clippings?: Awaited<ReturnType<typeof fetchClippings>>; site?: string;
  targets?: (Awaited<ReturnType<typeof publish>> | { targetId: string; state: 'failed' })[];
  skipped?: unknown[]; window?: RunScope['window'] | null; requested?: RunScope['requested'] | null; windowClipped?: boolean;
  budgets?: ReturnType<typeof budgetReport>; retryAt?: string;
}
