import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const siteBundleFiles = ['Gemfile', 'Gemfile.lock'] as const;
export type SiteBundle = Record<typeof siteBundleFiles[number], string>;
const normalized = (value: string) => value.replaceAll('\r\n', '\n');

export function parseSiteBundle(gemfile: string, lockfile: string): SiteBundle {
  if (!gemfile.trim() || !/^    jekyll-obsidian-site \([^\r\n)]+\)$/m.test(normalized(lockfile))) {
    throw new Error('Site bundle requires Gemfile and Gemfile.lock with jekyll-obsidian-site');
  }
  return { Gemfile: gemfile, 'Gemfile.lock': lockfile };
}

export async function readSiteBundle(root: string): Promise<SiteBundle> {
  const [gemfile, lockfile] = await Promise.all(siteBundleFiles.map(file => readFile(join(root, file), 'utf8')));
  return parseSiteBundle(gemfile!, lockfile!);
}

export function assertSiteBundle(expected: SiteBundle, actual: SiteBundle): void {
  if (siteBundleFiles.some(file => normalized(expected[file]) !== normalized(actual[file]))) {
    throw new Error('MANUAL_ACTION: Site bundle differs from the local trusted bundle; review and integrate Gemfile and Gemfile.lock before publishing');
  }
}

export function siteBundleIdentity(bundle: SiteBundle): { version: string; sha256: string } {
  const version = /^    jekyll-obsidian-site \(([^\r\n)]+)\)$/m.exec(normalized(bundle['Gemfile.lock']))?.[1];
  if (!version) throw new Error('Site bundle must lock jekyll-obsidian-site');
  return { version, sha256: createHash('sha256').update(JSON.stringify(siteBundleFiles.map(file => normalized(bundle[file])))).digest('hex') };
}
