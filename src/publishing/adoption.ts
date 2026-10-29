import { randomUUID } from 'node:crypto';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { applyTopics, loadTopics, mergeTopics, scanArchives } from '../content/index.js';
import { FdgError } from '../contracts/errors.js';
import type { Target } from '../contracts/publishing.js';
import { type Registry } from '../contracts/registry.js';
import type { InstanceContext } from '../instance/index.js';
import { atomicWrite } from '../platform/files.js';
import { git } from '../platform/git.js';
import { hash } from '../platform/hash.js';
import type { Storage } from '../storage/index.js';
import { checkout } from './checkout.js';
import type { Entry, Manifest } from './targets.js';
import { ownerFile } from './targets.js';
import { commit, confirmPush } from './transport.js';
export async function adoptTarget(
  config: InstanceContext,
  store: Storage,
  target: Target,
  expectedHead: string,
  takeover = false,
  signal?: AbortSignal,
) {
  if (!/^[a-f0-9]{40,64}$/.test(expectedHead))
    throw new FdgError('BAD_INPUT', '--expected-head requires the inspected full SHA');
  const current = await checkout(config, target, signal);
  try {
    if (current.head !== expectedHead) throw new FdgError('REMOTE_CHANGED', 'Expected target head changed');
    if (current.manifest && current.manifest.instanceId !== config.instanceId && !takeover)
      throw new FdgError('TARGET_ADOPTION_REQUIRED', 'Foreign owner requires --takeover');
    const durable = join(config.paths.targets, target.id),
      entries: Record<string, Entry> = {};
    const scan = await scanArchives({ ...config, feed: { ...config.feed, directory: current.prefix } });
    const identities = new Map(scan.posts.map((post) => [post.path, { source: post.source, id: post.id }]));
    const reservations: { source: string; id: string; day: string; number: number }[] = [];
    try {
      for (const [path, body] of Object.entries(current.files)) {
        const canonical = path.replace(/^_translations\/zh-CN\//, ''),
          native = identities.get(canonical) ?? current.manifest?.entries[path]?.identity;
        entries[path] = { hash: hash(body), opaque: !native, ...(native ? { identity: native } : {}) };
        const match =
          /^(?:_translations\/zh-CN\/)?([a-z0-9_-]+)\/(\d{4}-\d{2})\/(\d{2})\/item-([1-9]\d*)\.(?:md|json)$/.exec(
            path,
          );
        if (match) {
          const [, source, month, day, number] = match,
            identity =
              entries[path]!.identity?.id ??
              'archive:' + source + '/' + month + '/' + day + '/item-' + number + '.md';
          const row = store.archives.reservedId(source!, month + '-' + day, Number(number));
          if (row && row.id !== identity)
            throw new FdgError('PATH_CONFLICT', 'Existing local reservation conflicts: ' + path);
          const reserved = store.archives.reservedNumber(source!, identity, month + '-' + day);
          if (reserved && reserved.number !== Number(number))
            throw new FdgError('PATH_CONFLICT', 'Local identity already has another path: ' + path);
          reservations.push({ source: source!, id: identity, day: month + '-' + day, number: Number(number) });
        }
        const destination = path.startsWith('@/')
          ? join(durable, 'adopted-aux', path.slice(2))
          : join(durable, 'adopted', path);
        await mkdir(dirname(destination), { recursive: true });
        await copyFile(
          path.startsWith('@/') ? join(current.root, path.slice(2)) : join(current.prefix, path),
          destination,
        );
      }
      store.assertLease();
      store.adoptArchives({
        reservations,
        posts: (function*() { for (const ref of scan.posts) yield scan.post(ref.path)!; })(),
        files: (function*(): IterableIterator<[string, Buffer]> { for (const path of scan.files) if (path !== ownerFile) yield [path, scan.file(path)!]; })(),
      });
    } finally {
      await scan.dispose();
    }
    const remoteTopics = current.files['@/config/topics.json'] ?? current.files['topics.json'];
    if (remoteTopics) {
      const remote = JSON.parse(remoteTopics.toString()) as Registry;
      await applyTopics(
        config.feed.topics,
        mergeTopics({ version: 1, topics: [] }, await loadTopics(config.feed.topics), remote),
      );
    }
    const manifest: Manifest = {
      version: 1,
      instanceId: config.instanceId,
      targetId: target.id,
      generation: randomUUID(),
      namespace: current.manifest?.namespace ?? randomUUID(),
      entries,
    };
    store.assertLease();
    await atomicWrite(join(current.prefix, ownerFile), JSON.stringify(manifest, null, 2));
    await git(['add', '--', target.managedPrefix + '/' + ownerFile], current.root, signal);
    const sha = await commit(current.root, 'Adopt Feedgarden managed content', signal);
    store.assertLease();
    signal?.throwIfAborted();
    await confirmPush(current.root, target, current.head, sha, git, signal);
    await atomicWrite(
      join(durable, 'baseline.json'),
      JSON.stringify({
        commit: sha,
        manifest,
        topics: remoteTopics ? JSON.parse(remoteTopics.toString()) : null,
      }),
    );
    return {
      targetId: target.id,
      commit: sha,
      adoptedFiles: Object.keys(entries).length,
      generation: manifest.generation,
    };
  } finally { await current.dispose(); }
}
