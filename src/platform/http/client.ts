import robotsModule from 'robots-parser';
import { EnvHttpProxyAgent } from 'undici';
import { FdgError } from '../../contracts/errors.js';
import type { RawResponse } from '../../contracts/items.js';
import { errorText } from '../errors.js';
import { nowIso, sleep } from '../time.js';
import type { ResponseCache } from './contracts.js';
import { curlFetch, publicCurlFetch } from './curl.js';
import { resolvePublicTarget, type PublicResolver } from './destination.js';
import { publicDispatcher } from './dispatcher.js';
// This CommonJS package's declaration wraps its callable export in `default`.
const robotsParser = robotsModule as unknown as typeof robotsModule.default;

const dispatcher = new EnvHttpProxyAgent();
const networkFetch: typeof fetch = (url, init) => fetch(url, { dispatcher, ...init } as RequestInit);
const MAX_RESPONSE_BYTES = 12_000_000;
const MAX_COOLDOWN_SECONDS = 86400;

function rateLimitRetryAt(host: string, headers: Record<string, string>): string {
  const now = Date.now(), retry = headers['retry-after'];
  let seconds = retry ? /^\d+$/.test(retry) ? Number(retry) : (Date.parse(retry) - now) / 1000 : NaN;
  if (!Number.isFinite(seconds)) {
    const value = headers['x-ratelimit-reset'];
    const reset = value?.trim() ? Number(value) : NaN;
    // Reddit reports a duration; GitHub and many other APIs report epoch
    // seconds. For unknown hosts, distinguish contemporary epochs from delays.
    // Millisecond epochs are outside this header's supported units. Reject
    // them rather than silently turning malformed input into a 24-hour stall.
    seconds = reset < 0 || reset >= 100_000_000_000 ? NaN : host === 'api.github.com' || reset >= 1_000_000_000 ? reset - now / 1000 : reset;
  }
  const delay = Math.min(MAX_COOLDOWN_SECONDS, Math.max(1, Number.isFinite(seconds) ? seconds : 1800));
  return new Date(now + delay * 1000).toISOString();
}

async function boundedText(response: Response): Promise<string> {
  if (Number(response.headers.get('content-length')) > MAX_RESPONSE_BYTES) {
    await response.body?.cancel();
    throw new HttpError('Response exceeds 12 MB limit');
  }
  if (!response.body) return '';
  const reader = response.body.getReader(), decoder = new TextDecoder(), parts: string[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new HttpError('Response exceeds 12 MB limit');
      }
      parts.push(decoder.decode(value, { stream: true }));
    }
    parts.push(decoder.decode());
    return parts.join('');
  } finally { reader.releaseLock(); }
}

export class HttpError extends Error {
  constructor(message: string, readonly status = 0, readonly retryAt?: string) { super(message); }
}
export function sourceRetryAt(error: unknown): string | undefined {
  if (error instanceof HttpError || (error instanceof FdgError && error.code === 'SOURCE_RATE_LIMITED')) return error.retryAt;
  return undefined;
}
export class Http {
  readonly raw: RawResponse[] = [];
  private readonly hostNext = new Map<string, number>();
  private readonly hostRequests = new Map<string, Promise<void>>();
  private readonly hostSpacing = new Map<string, number>();
  private readonly hostCooldown = new Map<string, HttpError>();
  private readonly sharedResponses = new Map<string, RawResponse>();
  private readonly robots = new Map<string, ReturnType<typeof robotsParser>>();
  constructor(private readonly store: ResponseCache, private readonly fetcher: typeof fetch = networkFetch, readonly signal?: AbortSignal, private readonly publicResolver?: PublicResolver) { }
  private async pageDelay(url: string, publicOnly: boolean): Promise<number> {
    const origin = new URL(url).origin, robotsUrl = origin + '/robots.txt';
    let rules = this.robots.get(origin);
    if (!rules) {
      let body = '';
      try { body = (await this.get(robotsUrl, 0, 'fetch', publicOnly)).body; }
      catch (error) { if (!(error instanceof HttpError && error.status === 404)) throw error; }
      rules = robotsParser(robotsUrl, body); this.robots.set(origin, rules);
    }
    if (rules.isAllowed(url, 'Feedgarden') === false) throw new HttpError('robots.txt disallows ' + new URL(url).pathname, 403);
    return (rules.getCrawlDelay('Feedgarden') ?? 0) * 1000;
  }
  async page(url: string, spacingMs = 1500, publicOnly = false): Promise<RawResponse> {
    return this.get(url, Math.max(spacingMs, await this.pageDelay(url, publicOnly)), 'fetch', publicOnly);
  }
  async shared(url: string): Promise<RawResponse> {
    const existing = this.sharedResponses.get(url);
    if (existing) { this.raw.push(existing); return existing; }
    const response = await this.get(url); this.sharedResponses.set(url, response); return response;
  }
  private async withHost<T>(host: string, spacingMs: number, signal: AbortSignal | undefined, request: () => Promise<T>): Promise<T> {
    // Unpaced API calls may overlap. The first paced request waits for all
    // outstanding bodies, then permanently enables pacing for this host.
    // Later calls inherit the largest requested gap, measured from body EOF.
    const previous = this.hostRequests.get(host) ?? Promise.resolve();
    if (spacingMs > 0) this.hostSpacing.set(host, Math.max(spacingMs, this.hostSpacing.get(host) ?? 0));
    const serialize = this.hostSpacing.has(host);
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    // Keep the predecessor in the tail even if this waiter aborts: later work
    // must not overtake a body that is still being read.
    const queued = serialize ? previous.then(() => held) : Promise.all([previous, held]).then(() => { });
    this.hostRequests.set(host, queued);
    let started = false;
    try {
      signal?.throwIfAborted();
      if (serialize) await new Promise<void>((resolve, reject) => {
        const abort = () => reject(signal!.reason);
        signal?.addEventListener('abort', abort, { once: true });
        previous.then(() => { signal?.removeEventListener('abort', abort); resolve(); });
      });
      signal?.throwIfAborted();
      const wait = (this.hostNext.get(host) ?? 0) - Date.now();
      if (wait > 0) await sleep(wait, signal);
      signal?.throwIfAborted();
      const cooldown = this.hostCooldown.get(host);
      if (cooldown?.retryAt && Date.parse(cooldown.retryAt) > Date.now()) throw cooldown;
      if (this.store.transport) {
        const wait = this.store.transport.reserve(host, this.hostSpacing.get(host) ?? 0);
        if (wait > 0) await sleep(wait, signal);
      }
      started = true;
      return await request();
    } finally {
      if (started && serialize) this.hostNext.set(host, Date.now() + this.hostSpacing.get(host)!);
      release();
      void queued.then(() => { if (this.hostRequests.get(host) === queued) this.hostRequests.delete(host); });
    }
  }
  private async publicFetch(url: string, init: RequestInit, spacingMs: number, transport: 'fetch' | 'curl'): Promise<{ response: Response; url: string; body: string }> {
    const respectRobots = this.robots.has(new URL(url).origin) && new URL(url).pathname !== '/robots.txt';
    for (let redirects = 0; ; redirects++) {
      init.signal?.throwIfAborted();
      let target;
      try { target = await resolvePublicTarget(url, this.publicResolver); url = target.url; } catch (error) { throw new HttpError(errorText(error)); }
      init.signal?.throwIfAborted();
      const delay = redirects && respectRobots ? Math.max(spacingMs, await this.pageDelay(url, true)) : spacingMs;
      const page = await this.withHost(new URL(url).host, delay, this.signal, async () => {
        const useCurl = transport === 'curl' && this.fetcher === networkFetch;
        const dispatcher = useCurl ? undefined : publicDispatcher(target), headers = new Headers(init.headers);
        headers.set('Host', new URL(url).host);
        try {
          const request = { ...init, headers, dispatcher, redirect: 'manual' as const, signal: AbortSignal.any([AbortSignal.timeout(25000), ...(this.signal ? [this.signal] : [])]) };
          const response = useCurl ? await publicCurlFetch(target, request) : await this.fetcher(url, request);
          if ([301, 302, 303, 307, 308].includes(response.status)) { await response.body?.cancel(); return { response, url, body: '' }; }
          return { response, url, body: await boundedText(response) };
        } finally { await dispatcher?.destroy(); }
      });
      const { response } = page;
      if (![301, 302, 303, 307, 308].includes(response.status)) return page;
      if (redirects >= 3 || !response.headers.get('location')) throw new HttpError('Article redirect limit or missing target');
      url = new URL(response.headers.get('location')!, url).href;
      // Conditional validators belong to the original URL, not its redirect target.
      const headers = new Headers(init.headers); headers.delete('If-None-Match'); headers.delete('If-Modified-Since');
      init = { ...init, headers };
    }
  }
  async get(url: string, spacingMs = 0, transport: 'fetch' | 'curl' = 'fetch', publicOnly = false): Promise<RawResponse> {
    this.signal?.throwIfAborted();
    const host = new URL(url).host;
    const cachedHeaders = this.store.cacheHeaders(url);
    const checkCooldown = () => {
      const error = this.hostCooldown.get(host);
      if (error?.retryAt && Date.parse(error.retryAt) > Date.now()) throw error;
      this.hostCooldown.delete(host);
    };
    for (let attempt = 0; attempt < 3; attempt++) {
      checkCooldown();
      try {
        const init = {
          headers: {
            'User-Agent': 'Feedgarden/0.1 (+https://sinputer.top/feedgarden/)',
            ...(cachedHeaders?.etag ? { 'If-None-Match': cachedHeaders.etag } : {}),
            ...(cachedHeaders?.['last-modified'] ? { 'If-Modified-Since': cachedHeaders['last-modified'] } : {}),
          }, signal: this.signal
        };
        const page = publicOnly ? await this.publicFetch(url, init, spacingMs, transport) : await this.withHost(host, spacingMs, this.signal, async () => {
          const response = await (transport === 'curl' && this.fetcher === networkFetch ? curlFetch : this.fetcher)(url, { ...init, signal: AbortSignal.any([AbortSignal.timeout(25000), ...(this.signal ? [this.signal] : [])]) });
          return { response, url, body: await boundedText(response) };
        });
        const { response } = page;
        const headers: Record<string, string> = {};
        for (const key of ['etag', 'last-modified', 'content-type', 'retry-after', 'x-ratelimit-remaining', 'x-ratelimit-reset']) {
          const value = response.headers.get(key); if (value) headers[key] = value;
        }
        const cached = response.status === 304 ? this.store.cache(url) : undefined;
        const body = cached ? cached.body : page.body;
        if (Buffer.byteLength(body) > MAX_RESPONSE_BYTES) throw new HttpError('Response exceeds 12 MB limit');
        const raw = { url, ...(publicOnly ? { resolvedUrl: page.url } : {}), status: response.status, body, headers: response.status === 304 ? { ...cached?.headers, ...headers } : headers, fetchedAt: nowIso() };
        this.raw.push(raw);
        if (response.status === 429 || (response.status === 403 && headers['x-ratelimit-remaining'] !== undefined && Number(headers['x-ratelimit-remaining']) === 0)) {
          const retryAt = rateLimitRetryAt(host, headers);
          const error = new HttpError(`Rate limited by ${host}`, response.status, retryAt);
          this.hostCooldown.set(host, error);
          if (this.store.transport) this.store.transport.cooldown(host, retryAt);
          throw error;
        }
        if (response.status === 304 && !cached) throw new HttpError('304 response without a cached body');
        if (!response.ok && response.status !== 304) throw new HttpError(`HTTP ${response.status} from ${host}`, response.status);
        if (/just a moment|checking your browser|enable javascript and cookies to continue|verify you are human/i.test(body.slice(0, 8000))) throw new HttpError(`Challenge page from ${host}`, 403);
        this.store.saveCache(raw);
        return raw;
      } catch (error) {
        this.signal?.throwIfAborted();
        if (sourceRetryAt(error)) throw error;
        if (error instanceof HttpError && (error.status < 500 || error.retryAt)) throw error;
        if (attempt === 2) throw error;
        await sleep(500 * 2 ** attempt, this.signal);
      }
    }
    throw new Error('Unreachable HTTP attempt');
  }
}
