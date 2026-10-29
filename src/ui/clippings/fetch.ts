import { randomUUID } from 'node:crypto';
import { link, lstat, mkdir, mkdtemp, open, readFile, readdir, rename, rm } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { z } from 'zod';
import type { InstanceContext } from '../../instance/index.js';

import { authoredDirectory } from '../../content/index.js';
import { errorText } from '../../platform/errors.js';
import { downloadImage, imageType, type DownloadOptions } from '../../platform/http/images.js';
import { runnerLock } from '../../platform/lock.js';
import { clippingImages } from './images.js';

const assetSchema = z.object({
  originalUrl: z.string(), finalUrl: z.string(), path: z.string(), mediaType: z.string(),
}).strict().refine(asset => /^assets\/[a-f0-9]{64}\.(?:png|jpg|gif|webp|avif|apng|bmp)$/.test(asset.path), 'Invalid asset path');
const manifestSchema = z.object({ version: z.literal(1), images: z.record(z.string(), assetSchema) }).strict();
type Asset = z.infer<typeof assetSchema>;
type Manifest = z.infer<typeof manifestSchema>;
export interface FetchClippingsOptions extends DownloadOptions {
  paths?: string[]; all?: boolean; dryRun?: boolean; runnerOwned?: boolean;
}
export interface ClippingResult { path: string; status: 'updated' | 'unchanged' | 'dry-run' | 'failed'; urls: string[]; error?: string }
const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === 'ENOENT';

async function checkedPath(root: string, path: string): Promise<void> {
  const part = relative(root, path);
  if (part === '..' || part.startsWith('..' + sep) || isAbsolute(part)) throw new Error('Paths must stay inside configured clippings: ' + path);
  let current = root;
  for (const segment of ['', ...part.split(sep).filter(Boolean)]) {
    current = join(current, segment);
    const info = await lstat(current);
    if (info.isSymbolicLink()) throw new Error('Clippings paths must not contain symbolic links: ' + current);
  }
}
async function selectedFiles(root: string, options: FetchClippingsOptions): Promise<string[]> {
  const selected = new Set<string>();
  // Non-Markdown attachments beside notes are intentionally not traversed.
  async function scan(path: string): Promise<void> {
    await checkedPath(root, path);
    const info = await lstat(path);
    if (info.isDirectory()) {
      for (const item of (await readdir(path, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
        if (relative(root, path) === '' && (process.platform === 'win32' ? item.name.toLowerCase() : item.name) === 'assets') continue;
        if (item.isDirectory() || /\.md$/i.test(item.name)) await scan(join(path, item.name));
        else if (item.isSymbolicLink()) throw new Error('Clippings paths must not contain symbolic links: ' + join(path, item.name));
      }
    } else if (info.isFile() && /\.md$/i.test(path)) selected.add(path);
    else throw new Error('Expected a Markdown file or directory: ' + path);
  }
  const paths = options.all ? [root] : (options.paths ?? []).map(path => resolve(path));
  for (const path of paths) {
    const first = relative(root, path).split(sep)[0]!;
    if (!options.all && (process.platform === 'win32' ? first.toLowerCase() : first) === 'assets') throw new Error('Clippings assets cannot be selected as notes: ' + path);
    await scan(path);
  }
  if (!options.all && !selected.size) throw new Error('No Markdown files selected by explicit paths: ' + paths.join(', '));
  return [...selected].sort();
}

async function atomicBytes(path: string, bytes: Buffer, signal: AbortSignal, beforeRename?: () => Promise<void>): Promise<void> {
  const temporary = join(dirname(path), `.${randomUUID()}.tmp`);
  const file = await open(temporary, 'wx', 0o600);
  try {
    try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
    signal.throwIfAborted();
    await beforeRename?.();
    signal.throwIfAborted();
    await rename(temporary, path);
    if (process.platform !== 'win32') {
      const directory = await open(dirname(path), 'r');
      try { await directory.sync(); } finally { await directory.close(); }
    }
  } finally { await rm(temporary, { force: true }); }
}
async function validAsset(root: string, asset: Asset, max: number): Promise<boolean> {
  try {
    const path = join(root, asset.path);
    await checkedPath(root, path);
    const info = await lstat(path);
    if (!info.isFile() || info.size > max) return false;
    const bytes = await readFile(path), type = imageType(bytes);
    return type.mediaType === asset.mediaType && asset.path.endsWith('.' + type.extension);
  } catch (error) { if (missing(error)) return false; throw error; }
}

export async function fetchClippings(config: Pick<InstanceContext, 'feed' | 'paths'>, options: FetchClippingsOptions): Promise<ClippingResult[]> {
  const root = resolve(config.feed.directory, authoredDirectory), results: ClippingResult[] = [];
  const cancellation = new AbortController();
  const signal = options.signal ? AbortSignal.any([cancellation.signal, options.signal]) : cancellation.signal;
  const release = options.dryRun || options.runnerOwned ? undefined : await runnerLock(config.paths.runner, cancellation);
  let staging: string | undefined;
  try {
    if (!options.dryRun) {
      const journal = await lstat(config.paths.contentJournal).catch(error => { if (!missing(error)) throw error; });
      if (journal) throw new Error('Content recovery is pending; run fdg export before fetching clipping images');
    }
    const files = await selectedFiles(root, options);
    const manifestPath = join(root, 'assets/manifest.json');
    let manifest: Manifest = { version: 1, images: {} }, manifestDirty = false;
    if (!options.dryRun) {
      const exists = await lstat(manifestPath).catch(error => { if (!missing(error)) throw error; });
      if (exists) {
        await checkedPath(root, manifestPath);
        manifest = manifestSchema.parse(JSON.parse(await readFile(manifestPath, 'utf8')));
        for (const [url, asset] of Object.entries(manifest.images)) if (url !== asset.originalUrl) throw new Error('Asset manifest URL does not match its key');
      }
    }
    const max = options.maxBytes ?? 32 * 1024 * 1024;
    if (!Number.isSafeInteger(max) || max <= 0) throw new Error('Image byte limit must be a positive safe integer');
    const downloads = new Map<string, Promise<{ asset: Asset; temporary?: string }>>();
    async function obtain(url: string): Promise<{ asset: Asset; temporary?: string }> {
      const previous = Object.hasOwn(manifest.images, url) ? manifest.images[url] : undefined;
      if (previous && await validAsset(root, previous, max)) return { asset: previous };
      const image = await downloadImage(url, { ...options, maxBytes: max, signal });
      signal.throwIfAborted();
      const asset: Asset = { originalUrl: url, finalUrl: image.finalUrl, path: `assets/${image.sha256}.${image.extension}`, mediaType: image.mediaType };
      const temporary = join(staging!, randomUUID());
      const handle = await open(temporary, 'wx', 0o600);
      try { await handle.writeFile(image.bytes); await handle.sync(); } finally { await handle.close(); }
      return { asset, temporary };
    }
    for (const path of files) {
      signal.throwIfAborted();
      let urls: string[] = [];
      try {
        await checkedPath(root, path);
        const original = await readFile(path), identity = await lstat(path);
        const source = original.toString('utf8');
        if (!Buffer.from(source).equals(original)) throw new Error('Clipping must be valid UTF-8');
        const references = clippingImages(source); urls = references.urls;
        if (options.dryRun || !urls.length) { results.push({ path, status: options.dryRun ? 'dry-run' : 'unchanged', urls }); continue; }
        if (!staging) {
          await mkdir(join(root, 'assets'), { recursive: true });
          await checkedPath(root, join(root, 'assets'));
          staging = await mkdtemp(join(root, 'assets/.fetch-'));
        }
        const obtained: Awaited<ReturnType<typeof obtain>>[] = [], errors: string[] = [];
        let next = 0;
        await Promise.all(Array.from({ length: Math.min(3, urls.length) }, async () => {
          while (next < urls.length) {
            const url = urls[next++]!;
            try {
              if (!downloads.has(url)) downloads.set(url, obtain(url).catch(error => { downloads.delete(url); throw error; }));
              obtained.push(await downloads.get(url)!);
            } catch (error) { errors.push(`${url}: ${errorText(error)}`); }
          }
        }));
        if (errors.length) throw new Error(errors.join('\n'));
        const unchanged = async () => {
          await checkedPath(root, path);
          const current = await lstat(path);
          if (!current.isFile() || current.ino !== identity.ino || current.dev !== identity.dev || !(await readFile(path)).equals(original)) throw new Error('Clipping changed while fetching; original edit has been kept');
        };
        await unchanged(); signal.throwIfAborted();
        const local = new Map<string, string>();
        for (const { asset, temporary } of obtained) {
          const destination = join(root, asset.path);
          if (temporary) {
            // Install exclusively: an existing attachment is never overwritten.
            await link(temporary, destination).catch(error => { if (error.code !== 'EEXIST') throw error; });
          }
          if (!await validAsset(root, asset, max)) throw new Error('Existing attachment is corrupt; kept for inspection: ' + destination);
          manifestDirty ||= JSON.stringify(manifest.images[asset.originalUrl]) !== JSON.stringify(asset);
          manifest.images[asset.originalUrl] = asset;
          local.set(asset.originalUrl, relative(dirname(path), destination).split(sep).map(segment => encodeURIComponent(segment)).join('/'));
        }
        if (manifestDirty) { await atomicBytes(manifestPath, Buffer.from(JSON.stringify(manifest, null, 2) + '\n'), signal); manifestDirty = false; }
        await atomicBytes(path, Buffer.from(references.rewrite(local)), signal, unchanged);
        results.push({ path, status: 'updated', urls });
      } catch (error) {
        results.push({ path, status: 'failed', urls, error: errorText(error) });
        signal.throwIfAborted();
      }
    }
    return results;
  } finally {
    // Only the uniquely created staging directory belongs to this invocation.
    if (staging && dirname(staging) === join(root, 'assets') && staging.startsWith(join(root, 'assets/.fetch-'))) await rm(staging, { recursive: true, force: true });
    await release?.();
  }
}
