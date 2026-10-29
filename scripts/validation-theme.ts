import { createHash } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { join,resolve } from 'node:path';
import { run } from '../src/platform/process/execute.js';
import { buildSite,readSiteBundle,siteBundleFiles,siteBundleIdentity } from '../src/ui/index.js';
import { installLocalTheme } from './local-theme.js';

// Both modes build disposable content copies. Published validation always uses
// the repository's frozen bundle, never a theme checkout or a local gem home.
export async function validationTheme(root: string, gem?: string) {
  if (gem) {
    const path = resolve(gem), { env, executable } = await installLocalTheme(path, join(root, 'gems'));
    return {
      identity: { kind: 'local-gem', path, sha256: createHash('sha256').update(await readFile(path)).digest('hex') },
      build: async (host: string) => { await run('ruby', [executable, 'build'], host, env); return join(host, '.jekyll-obsidian-cache/site'); },
    };
  }
  const bundle = await readSiteBundle(process.cwd());
  return {
    identity: { kind: 'published', ...siteBundleIdentity(bundle) },
    build: async (host: string) => {
      for (const file of siteBundleFiles) await writeFile(join(host, file), bundle[file]);
      return buildSite(host);
    },
  };
}
