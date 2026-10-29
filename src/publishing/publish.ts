import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { applyTopics, loadTopics, mergeTopics } from '../content/index.js';
import { FdgError } from '../contracts/errors.js';
import type { Target } from '../contracts/publishing.js';
import { type Registry } from '../contracts/registry.js';
import type { InstanceContext } from '../instance/index.js';
import { atomicWrite } from '../platform/files.js';
import { git } from '../platform/git.js';
import { hash } from '../platform/hash.js';
import { pinArtifact } from '../platform/retention.js';
import type { Storage } from '../storage/index.js';
import { checkout, owned } from './checkout.js';
import { targetDiff } from './diff.js';
import { exportTarget } from './export.js';
import { ensureSafe } from './filesystem.js';
import type { Manifest } from './targets.js';
import { assertManagedPaths, ownerFile } from './targets.js';
import { commit, confirmPush } from './transport.js';
export async function publish(
  config: InstanceContext,
  store: Storage,
  target: Target,
  options: { dryRun?: boolean; signal?: AbortSignal } = {},
) {
  const current = await checkout(config, target, options.signal);
  try {
    owned(config, target, current.manifest, current.files);
    const durable = join(config.paths.targets, target.id),
      baselineFile = join(durable, 'baseline.json');
    const pendingFile = join(durable, 'pending-push.json');
    if (!options.dryRun && existsSync(pendingFile)) {
      const pending = JSON.parse(await readFile(pendingFile, 'utf8'));
      let confirmed = current.head === pending.commit;
      if (!confirmed && current.head)
        try {
          await git(['merge-base', '--is-ancestor', pending.commit, 'HEAD'], current.root, options.signal);
          confirmed = true;
        } catch { }
      if (confirmed) {
        store.assertLease();
        await atomicWrite(
          baselineFile,
          JSON.stringify({ commit: pending.commit, manifest: pending.manifest, topics: pending.topics }),
        );
        for (const change of pending.changes ?? [])
          if (change.action === 'delete')
            store.maintenance.clearDeletion(target.id, change.path);
        await atomicWrite(
          join(durable, 'receipt.json'),
          JSON.stringify({ commit: pending.commit, confirmedAt: new Date().toISOString(), recovered: true }),
        );
        await rm(pendingFile);
        if (typeof pending.checkout === 'string' && dirname(resolve(pending.checkout)) === resolve(config.paths.cache, 'publish'))
          await pinArtifact(pending.checkout, false, config.instanceId);
      }
    }
    const baseline = existsSync(baselineFile) ? JSON.parse(await readFile(baselineFile, 'utf8')) : undefined;
    if (baseline?.manifest.generation && baseline.manifest.generation !== current.manifest?.generation)
      throw new FdgError('TARGET_ADOPTION_REQUIRED', 'Target ownership generation changed');
    const topicKey = target.auxiliaryFiles.includes('config/topics.json')
      ? '@/config/topics.json'
      : 'topics.json';
    for (const [path, entry] of Object.entries(current.manifest?.entries ?? {})) {
      if (!current.files[path])
        throw new FdgError('REMOTE_CHANGED', 'Remote managed file was removed: ' + path);
      if (path !== topicKey && hash(current.files[path]) !== entry.hash)
        throw new FdgError('REMOTE_CHANGED', 'Remote managed file changed: ' + path);
    }
    if (current.files[topicKey]) {
      const remote = JSON.parse(current.files[topicKey]!.toString()) as Registry;
      if (baseline?.topics) {
        const merged = mergeTopics(baseline.topics, await loadTopics(config.feed.topics), remote);
        if (!options.dryRun) await applyTopics(config.feed.topics, merged);
        else if (hash(merged) !== hash(await loadTopics(config.feed.topics)))
          throw new FdgError(
            'TOPICS_MERGE_REQUIRED',
            'Remote topics need reconciliation before preview; use topics apply with --remote-base',
          );
      }
    }
    const exported = await exportTarget(config, store, target, { signal: options.signal });
    const { entries, changes } = targetDiff(current.files, current.manifest, exported.entries, topicKey);
    for (const path of target.auxiliaryFiles) {
      if (path !== 'config/topics.json')
        throw new FdgError('CONFIG_INVALID', 'Only config/topics.json is a supported auxiliary generated file');
      const key = '@/' + path,
        body = await readFile(config.feed.topics);
      if (current.files[key] && !current.manifest?.entries[key])
        throw new FdgError('PATH_CONFLICT', 'Unowned auxiliary file occupies target: ' + path);
      entries[key] = { hash: hash(body) };
      if (!current.files[key] || hash(current.files[key]) !== entries[key]!.hash)
        changes.push({ path: key, action: current.files[key] ? 'update' : 'add' });
    }
    for (const row of store.maintenance.deletions(target.id)) {
      if (!entries[row.path])
        throw new FdgError('PATH_CONFLICT', 'Deletion does not belong to the target manifest');
      changes.push({ path: row.path, action: 'delete' });
      delete entries[row.path];
    }
    if (options.dryRun) return { targetId: target.id, head: current.head ?? null, changes, dryRun: true };
    options.signal?.throwIfAborted();
    store.assertLease();
    for (const change of changes) {
      const path = change.path,
        full = await ensureSafe(
          current.root,
          path.startsWith('@/') ? path.slice(2) : target.managedPrefix + '/' + path,
        );
      if (change.action === 'delete') await rm(full);
      else {
        await mkdir(dirname(full), { recursive: true });
        await copyFile(path.startsWith('@/') ? config.feed.topics : join(exported.output, path), full);
      }
    }
    const manifest: Manifest = {
      version: 1,
      instanceId: config.instanceId,
      targetId: target.id,
      generation: current.manifest?.generation ?? randomUUID(),
      namespace: current.manifest?.namespace ?? randomUUID(),
      entries,
    };
    await atomicWrite(join(current.prefix, ownerFile), JSON.stringify(manifest, null, 2));
    await git(['add', '--', target.managedPrefix, ...target.auxiliaryFiles], current.root, options.signal);
    const changed = await git(['diff', '--cached', '--name-only'], current.root, options.signal);
    assertManagedPaths(changed.split('\n').filter(Boolean), target.managedPrefix, target.auxiliaryFiles);
    if (!changed) return { targetId: target.id, commit: current.head, changes: [], confirmed: true };
    if (target.format === 'jekyll') {
      const { buildTarget } = await import('../ui/index.js');
      await buildTarget(config, target, exported.output, options.signal);
    }
    options.signal?.throwIfAborted();
    store.assertLease();
    const sha = await commit(current.root, 'Update Feedgarden content', options.signal);
    await pinArtifact(current.root);
    await atomicWrite(
      pendingFile,
      JSON.stringify({
        commit: sha,
        expectedHead: current.head,
        manifest,
        checkout: current.root,
        changes,
        topics: await loadTopics(config.feed.topics),
      }),
    );
    store.assertLease();
    options.signal?.throwIfAborted();
    await confirmPush(current.root, target, current.head, sha, git, options.signal);
    await atomicWrite(
      baselineFile,
      JSON.stringify({ commit: sha, manifest, topics: await loadTopics(config.feed.topics) }),
    );
    await atomicWrite(
      join(durable, 'receipt.json'),
      JSON.stringify({ commit: sha, confirmedAt: new Date().toISOString(), changes }),
    );
    for (const change of changes)
      if (change.action === 'delete')
        store.maintenance.clearDeletion(target.id, change.path);
    await rm(pendingFile);
    await pinArtifact(current.root, false);
    return { targetId: target.id, commit: sha, changes, confirmed: true };
  } finally { await current.dispose(); }
}
