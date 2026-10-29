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
    throw new FdgError('REMOTE_CHANGED', 'Remote advanced; fetch and recompute the target diff');
  try {
    await transport(['push', 'origin', 'HEAD:refs/heads/' + target.branch], root, signal);
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
        'Push result could not be confirmed; preserve the receipt and inspect remote head',
      );
    }
    throw error;
  }
}
export async function commit(root: string, message: string, signal?: AbortSignal): Promise<string> {
  await git(
    [
      '-c',
      'user.name=Feedgarden',
      '-c',
      'user.email=feedgarden@localhost',
      'commit',
      '--quiet',
      '-m',
      message,
    ],
    root,
    signal,
  );
  return git(['rev-parse', 'HEAD'], root, signal);
}
