import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import { loadTopics, parseFrontmatter } from '../content/index.js';
import { FdgError } from '../contracts/errors.js';
import type { Target } from '../contracts/publishing.js';
import type { InstanceContext } from '../instance/index.js';
import { buildTarget } from '../ui/index.js';
import { treeFiles } from '../platform/tree.js';

/** Content validity is independent of source configuration, identity and storage. */
export async function validateSnapshot(config: InstanceContext, target: Target, root: string, signal?: AbortSignal) {
  const content = join(root, target.managedPrefix);
  for await (const path of treeFiles(content)) {
    signal?.throwIfAborted();
    if (!/\.(json|ya?ml|md)$/.test(path)) continue;
    try {
      const body = await readFile(join(content, path));
      if (path.endsWith('.json')) JSON.parse(body.toString());
      if (/\.ya?ml$/.test(path)) parse(body.toString());
      if (path.endsWith('.md')) {
        const front = parseFrontmatter(body.toString());
        if (!front) continue;
        const { fields } = front;
        if (fields.publish !== undefined && typeof fields.publish !== 'boolean') throw new Error('publish must be boolean');
        if (fields.publish === true) {
          if (typeof fields.title !== 'string' || !fields.title.trim()) throw new Error('Published content requires a title');
          if (fields.content_type === 'post' && !Number.isFinite(Date.parse(String(fields.date)))) throw new Error('Post requires a valid date');
        }
        if (fields.tags !== undefined && (!Array.isArray(fields.tags) || fields.tags.some((tag: unknown) => typeof tag !== 'string'))) throw new Error('tags must be strings');
      }
    } catch (error) { throw new FdgError('CONTENT_INVALID', target.managedPrefix + '/' + path + ': ' + String(error)); }
  }
  for (const path of [target.managedPrefix + '/topics.json', ...target.auxiliaryFiles.filter(path => path.endsWith('/topics.json'))]) {
    try {
      if (existsSync(join(root, path))) await loadTopics(join(root, path));
    } catch (error) { throw new FdgError('CONTENT_INVALID', path + ': ' + String(error)); }
  }
  if (target.format === 'jekyll') await buildTarget(config, target, content, signal);
}
