import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { processCommand } from '../platform/process/command.js';
import { run, validationEnvironment } from '../platform/process/execute.js';
import { assertSiteBundle, readSiteBundle, siteBundleFiles } from './bundle.js';

export async function buildSite(root = process.cwd()): Promise<string> {
  const project = process.cwd();
  const bundle = await readSiteBundle(project);
  if (resolve(root) !== resolve(project)) assertSiteBundle(bundle, await readSiteBundle(root));
  const env = { ...validationEnvironment(), BUNDLE_GEMFILE: join(project, 'Gemfile'), BUNDLE_APP_CONFIG: join(project, '.bundle'), BUNDLE_FROZEN: 'true' };
  try {
    try { const [program, args] = processCommand('bundle', ['check'], env); execFileSync(program, args, { cwd: project, env, stdio: 'ignore' }); }
    catch { await run('bundle', ['install'], project, env); }
    await run('bundle', ['exec', 'jekyll-obsidian', 'build'], resolve(root), env);
  } finally {
    const after = await readSiteBundle(project);
    if (siteBundleFiles.some(file => after[file] !== bundle[file])) throw new Error('Site build changed the frozen Gemfile or Gemfile.lock');
  }
  return join(resolve(root), '.jekyll-obsidian-cache/site');
}
