import type { Target } from '../contracts/publishing.js';
import { gitRecords } from '../platform/git.js';

const previewLimit = 100;

export async function changeSummary(root: string, base: string, tree: string, target: Target, signal?: AbortSignal) {
  const changes: { path: string; action: string }[] = [];
  let changeCount = 0, action: string | undefined;
  await gitRecords(['diff', '--name-status', '--no-renames', '-z', base, tree, '--', target.managedPrefix, ...target.auxiliaryFiles], root, record => {
    if (!action) { action = record; return; }
    if (changeCount < previewLimit) changes.push({ path: record, action: action === 'D' ? 'delete' : action === 'A' ? 'add' : 'update' });
    changeCount++;
    action = undefined;
  }, signal);
  return { changes, changeCount };
}

export async function statusSummary(root: string) {
  const lines: string[] = [];
  let statusCount = 0;
  // Disable rename detection so each NUL record describes exactly one path.
  await gitRecords(['status', '--porcelain=v1', '--no-renames', '--untracked-files=all', '-z'], root, record => {
    if (statusCount < previewLimit) lines.push(record.slice(0, 3) + JSON.stringify(record.slice(3)));
    statusCount++;
  });
  return { status: lines.join('\n'), statusCount };
}
