import { FdgError } from '../contracts/errors.js';
import type { Target } from '../contracts/publishing.js';
import { git, type GitTransport } from '../platform/git.js';

export async function remoteHead(
  root: string,
  target: Target,
  transport: GitTransport = git,
  signal?: AbortSignal,
): Promise<string | undefined> {
  const line = (
    await transport(['ls-remote', '--heads', 'origin', 'refs/heads/' + target.branch], root, signal)
  )
    .split('\n')
    .find(Boolean);
  return line?.split(/\s/)[0];
}
export async function confirmPush(
  root: string,
  target: Target,
  expected: string | undefined,
  commit: string,
  transport: GitTransport = git,
  signal?: AbortSignal,
): Promise<void> {
  if ((await remoteHead(root, target, transport, signal)) !== expected)
    throw new FdgError('REMOTE_CHANGED', 'Remote advanced; publish again to fetch and merge its changes');
  try {
    await transport(['push', 'origin', commit + ':refs/heads/' + target.branch], root, signal);
  } catch (error) {
    try {
      signal?.throwIfAborted();
      const actual = await remoteHead(root, target, transport, signal);
      if (actual === commit) return;
      if (actual) {
        await transport(['fetch', '--no-tags', 'origin', target.branch], root, signal);
        try {
          await transport(['merge-base', '--is-ancestor', commit, 'FETCH_HEAD'], root, signal);
          return;
        } catch { }
      }
    } catch {
      throw new FdgError(
        'PUSH_UNCONFIRMED',
        'Push result could not be confirmed; local commits are retained. Inspect the remote or publish again',
      );
    }
    throw error;
  }
}
