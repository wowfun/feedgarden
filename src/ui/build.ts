import { randomUUID } from 'node:crypto';
import { cp, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { InstanceContext } from '../instance/index.js';
import { resource } from '../platform/resources.js';

import { parse, stringify } from 'yaml';
import { FdgError } from '../contracts/errors.js';
import type { Target } from '../contracts/publishing.js';
import { atomicWrite } from '../platform/files.js';
import { run, validationEnvironment } from '../platform/process/execute.js';
import { completeArtifact, markArtifact, pruneArtifacts } from '../platform/retention.js';
export async function buildTarget(
  config: InstanceContext,
  target: Target,
  content: string,
  signal?: AbortSignal,
): Promise<string> {
  if (target.format !== 'jekyll') throw new FdgError('BAD_INPUT', 'UI requires a Jekyll target');
  const root = join(config.paths.cache, 'ui', target.id + '-' + randomUUID());
  await mkdir(join(root, '.github'), { recursive: true });
  await markArtifact(root, 'ui', config.instanceId, target.id);
  let succeeded = false;
  try {
    await cp(content, join(root, 'content'), { recursive: true, errorOnExist: true });
    for (const file of ['Gemfile', 'Gemfile.lock']) await cp(resource('ui', file), join(root, file));
    // Only schema-validated presentation fields can override the bundled template.
    const template = parse(await readFile(resource('ui', 'jekyll-obsidian.yml'), 'utf8'));
    const { features, ...presentation } = target.ui ?? {};
    Object.assign(template, presentation);
    Object.assign(template.website.features, features);
    await atomicWrite(join(root, '.github', 'jekyll-obsidian.yml'), stringify(template, { version: '1.1' }));
    const env = {
      ...validationEnvironment(),
      BUNDLE_GEMFILE: join(root, 'Gemfile'),
      BUNDLE_APP_CONFIG: join(root, '.bundle'),
      BUNDLE_PATH: join(config.paths.cache, 'gems'),
      BUNDLE_FROZEN: 'true',
    };
    try { await run('bundle', ['check'], root, env, signal); }
    catch { signal?.throwIfAborted(); await run('bundle', ['install'], root, env, signal); }
    await run('bundle', ['exec', 'jekyll-obsidian', 'build'], root, env, signal);
    succeeded = true;
    return join(root, '.jekyll-obsidian-cache', 'site');
  } finally {
    await completeArtifact(root, succeeded);
    await pruneArtifacts(join(config.paths.cache, 'ui'), 'ui', config.instanceId, 2, 7);
  }
}
