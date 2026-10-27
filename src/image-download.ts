import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { resolvePublicTarget, type PublicResolver } from './public-url.js';
import { publicDispatcher } from './public-http.js';

export interface ImageType { extension: string; mediaType: string }
export interface DownloadedImage extends ImageType { bytes: Buffer; sha256: string; finalUrl: string }
export interface DownloadOptions {
  maxBytes?: number; timeoutMs?: number; signal?: AbortSignal;
  fetch?: typeof fetch; resolve?: PublicResolver; retryDelayMs?: number;
}
export function imageType(bytes: Buffer): ImageType {
  let extension: string;
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.toString('ascii', 12, 16) === 'IHDR') {
    extension = 'png';
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = bytes.readUInt32BE(offset), type = bytes.toString('ascii', offset + 4, offset + 8);
      if (offset + 12 + length > bytes.length) break;
      if (type === 'acTL') { extension = 'apng'; break; }
      if (type === 'IDAT') break;
      offset += 12 + length;
    }
  } else if (bytes.length >= 13 && /^(GIF87a|GIF89a)$/.test(bytes.toString('ascii', 0, 6))) extension = 'gif';
  else if (bytes.length >= 10 && bytes.readUInt16BE(0) === 0xffd8 && bytes[2] === 0xff
    && (bytes[3]! >= 0xe0 && bytes[3]! <= 0xef || [0xc0, 0xc1, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf, 0xdb, 0xfe].includes(bytes[3]!))
    && bytes.readUInt16BE(4) >= 2 && 4 + bytes.readUInt16BE(4) <= bytes.length - 2
    && bytes.readUInt16BE(bytes.length - 2) === 0xffd9) extension = 'jpg';
  else if (bytes.length >= 16 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' && ['VP8 ', 'VP8L', 'VP8X'].includes(bytes.toString('ascii', 12, 16))) extension = 'webp';
  else if (bytes.length >= 26 && bytes.toString('ascii', 0, 2) === 'BM' && [12, 40, 52, 56, 64, 108, 124].includes(bytes.readUInt32LE(14))) extension = 'bmp';
  else if (bytes.length >= 16 && bytes.toString('ascii', 4, 8) === 'ftyp') {
    const size = bytes.readUInt32BE(0), brands = [bytes.toString('ascii', 8, 12)];
    for (let offset = 16; offset + 4 <= Math.min(size, bytes.length); offset += 4) brands.push(bytes.toString('ascii', offset, offset + 4));
    if (size < 16 || size > bytes.length || !brands.some(brand => ['avif', 'avis'].includes(brand))) throw new Error('Unsupported image signature (invalid or unsupported ISO media file; only AVIF is supported)');
    extension = 'avif';
  } else throw new Error('Unsupported image signature (SVG and non-image responses are not supported)');
  return { extension, mediaType: 'image/' + (extension === 'jpg' ? 'jpeg' : extension) };
}
class Retryable extends Error {}
const networkCodes = new Set(['ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'ETIMEDOUT', 'EAI_AGAIN', 'ENETUNREACH', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'UND_ERR_SOCKET']);
function transient(error: unknown): boolean {
  const seen = new Set<Error>();
  while (error instanceof Error && !seen.has(error)) {
    if (error instanceof Retryable || error.name === 'TimeoutError' || networkCodes.has((error as NodeJS.ErrnoException).code ?? '')) return true;
    seen.add(error); error = error.cause;
  }
  return false;
}
function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

export async function downloadImage(originalUrl: string, options: DownloadOptions = {}): Promise<DownloadedImage> {
  const max = options.maxBytes ?? 32 * 1024 * 1024;
  for (let attempt = 0; ; attempt++) {
    options.signal?.throwIfAborted();
    try {
      let url = originalUrl;
      for (let redirects = 0; ; redirects++) {
        const timeout = AbortSignal.timeout(options.timeoutMs ?? 30_000);
        const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
        const target = await abortable(resolvePublicTarget(url, options.resolve, { preserveQuery: true }), signal);
        const dispatcher = publicDispatcher(target);
        try {
          const response = await abortable((options.fetch ?? fetch)(target.url, {
            redirect: 'manual', signal, dispatcher,
            headers: { Accept: 'image/avif,image/webp,image/apng,image/*;q=0.9', 'User-Agent': 'Feedgarden-Clippings' },
          } as RequestInit), signal);
          if ([301, 302, 303, 307, 308].includes(response.status)) {
            await response.body?.cancel();
            if (redirects >= 3) throw new Error('Too many image redirects (maximum 3)');
            const location = response.headers.get('location');
            if (!location) throw new Error('Image redirect has no Location');
            url = new URL(location, target.url).href; continue;
          }
          if (!response.ok) {
            await response.body?.cancel();
            const message = `Image request returned HTTP ${response.status}`;
            if ([408, 429, 500, 502, 503, 504].includes(response.status)) throw new Retryable(message);
            throw new Error(message);
          }
          const declared = Number(response.headers.get('content-length'));
          if (declared > max) { await response.body?.cancel(); throw new Error(`Image exceeds ${max} bytes`); }
          if (!response.body) throw new Error('Image response has no body');
          const reader = response.body.getReader(), chunks: Uint8Array[] = [];
          let size = 0;
          try {
            for (;;) {
              const part = await abortable(reader.read(), signal);
              if (part.done) break;
              size += part.value.byteLength;
              if (size > max) throw new Error(`Image exceeds ${max} bytes`);
              chunks.push(part.value);
            }
          } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
          const bytes = Buffer.concat(chunks, size), type = imageType(bytes);
          return { bytes, ...type, sha256: createHash('sha256').update(bytes).digest('hex'), finalUrl: target.url };
        } finally { await dispatcher.destroy(); }
      }
    } catch (error) {
      options.signal?.throwIfAborted();
      if (attempt >= 2 || !transient(error)) throw error;
      await delay((options.retryDelayMs ?? 250) * (attempt + 1), undefined, { signal: options.signal });
    }
  }
}
