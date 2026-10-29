import assert from 'node:assert/strict';
import { mkdtemp,rm,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { assertSiteBundle,parseSiteBundle,readSiteBundle,siteBundleIdentity } from '../../src/ui/index.js';

const gemfile = 'source "https://rubygems.org"\ngem "jekyll-obsidian-site", "= 0.3.0"\n';
const lockfile = 'GEM\n  remote: https://rubygems.org/\n  specs:\n    jekyll-obsidian-site (0.3.0)\n';

test('site bundle compares full dependency contents while accepting checkout line endings', () => {
  const trusted = parseSiteBundle(gemfile, lockfile);
  const windows = parseSiteBundle(gemfile.replaceAll('\n', '\r\n'), lockfile.replaceAll('\n', '\r\n'));
  assert.doesNotThrow(() => assertSiteBundle(trusted, windows));
  assert.deepEqual(siteBundleIdentity(trusted), siteBundleIdentity(windows));
  assert.equal(siteBundleIdentity(trusted).version, '0.3.0');
  for (const candidate of [parseSiteBundle(gemfile + 'eval(File.read("remote.rb"))\n', lockfile), parseSiteBundle(gemfile, lockfile.replace('0.3.0', '0.3.1'))]) {
    assert.throws(() => assertSiteBundle(trusted, candidate), /Site bundle differs/);
    assert.notEqual(siteBundleIdentity(trusted).sha256, siteBundleIdentity(candidate).sha256);
  }
  assert.throws(() => parseSiteBundle(gemfile, ''), /requires Gemfile and Gemfile.lock/);
});

test('a partial dependency checkout cannot supply a site bundle', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feedgarden-bundle-'));
  try {
    await writeFile(join(root, 'Gemfile'), gemfile);
    await assert.rejects(readSiteBundle(root), /Gemfile.lock/);
    await writeFile(join(root, 'Gemfile.lock'), lockfile);
    assert.deepEqual(await readSiteBundle(root), parseSiteBundle(gemfile, lockfile));
  } finally { await rm(root, { recursive: true, force: true }); }
});
