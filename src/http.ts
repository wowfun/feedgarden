import { Store } from './store.js';
import type { RawResponse } from './types.js';
import { nowIso, sleep } from './util.js';
import { EnvHttpProxyAgent } from 'undici';
import { curlFetch } from './http-curl.js';
import robotsModule from 'robots-parser';
// This CommonJS package's declaration wraps its callable export in `default`.
const robotsParser = robotsModule as unknown as typeof robotsModule.default;

const dispatcher = new EnvHttpProxyAgent();
const networkFetch: typeof fetch = (url, init) => fetch(url, { ...init, dispatcher } as RequestInit);

export class HttpError extends Error {
  constructor(message: string, readonly status = 0, readonly retryAt?: string) { super(message); }
}
export class Http {
  readonly raw: RawResponse[] = [];
  private readonly hostNext = new Map<string, number>();
  private readonly sharedResponses = new Map<string, RawResponse>();
  private readonly robots = new Map<string, ReturnType<typeof robotsParser>>();
  constructor(private readonly store: Store, private readonly fetcher: typeof fetch = networkFetch) {}
  async page(url: string, spacingMs = 1500): Promise<RawResponse> {
    const origin = new URL(url).origin, robotsUrl = origin + '/robots.txt';
    let rules = this.robots.get(origin);
    if (!rules) {
      let body = '';
      try { body = (await this.get(robotsUrl)).body; }
      catch (error) { if (!(error instanceof HttpError && error.status === 404)) throw error; }
      rules = robotsParser(robotsUrl, body); this.robots.set(origin, rules);
    }
    if (rules.isAllowed(url, 'Feedgarden') === false) throw new HttpError('robots.txt disallows ' + new URL(url).pathname, 403);
    return this.get(url, Math.max(spacingMs, (rules.getCrawlDelay('Feedgarden') ?? 0) * 1000));
  }
  async shared(url: string): Promise<RawResponse> {
    const existing = this.sharedResponses.get(url);
    if (existing) { this.raw.push(existing); return existing; }
    const response = await this.get(url); this.sharedResponses.set(url, response); return response;
  }
  async get(url: string, spacingMs = 0, transport: 'fetch' | 'curl' = 'fetch'): Promise<RawResponse> {
    const host = new URL(url).host;
    const cached = this.store.cache(url);
    for (let attempt = 0; attempt < 3; attempt++) {
      const wait = (this.hostNext.get(host) ?? 0) - Date.now();
      if (wait > 0) await sleep(wait);
      this.hostNext.set(host, Date.now() + spacingMs);
      try {
        const response = await (transport === 'curl' && this.fetcher === networkFetch ? curlFetch : this.fetcher)(url, { signal: AbortSignal.timeout(25000), headers: {
          'User-Agent': 'Feedgarden/0.1 (+https://sinputer.top/feedgarden/)',
          ...(cached?.headers.etag ? { 'If-None-Match': cached.headers.etag } : {}),
          ...(cached?.headers['last-modified'] ? { 'If-Modified-Since': cached.headers['last-modified'] } : {}),
        } });
        const headers: Record<string, string> = {};
        for (const key of ['etag', 'last-modified', 'content-type', 'retry-after', 'x-ratelimit-remaining', 'x-ratelimit-reset']) {
          const value = response.headers.get(key); if (value) headers[key] = value;
        }
        const body = response.status === 304 && cached ? cached.body : await response.text();
        if (body.length > 12_000_000) throw new HttpError('Response exceeds 12 MB limit');
        const raw = { url, status: response.status, body, headers: { ...cached?.headers, ...headers }, fetchedAt: nowIso() };
        this.raw.push(raw);
        if (response.status === 429 || (response.status === 403 && headers['x-ratelimit-remaining'] !== undefined && Number(headers['x-ratelimit-remaining']) === 0)) {
          const retry = headers['retry-after'], reset = Number(headers['x-ratelimit-reset']);
          const seconds = retry ? /^\d+$/.test(retry) ? Number(retry) : (Date.parse(retry) - Date.now()) / 1000
            : reset ? host === 'api.github.com' ? reset - Date.now() / 1000 : reset : 1800;
          const retryAt = new Date(Date.now() + Math.max(1, Number.isFinite(seconds) ? seconds : 1800) * 1000).toISOString();
          throw new HttpError(`Rate limited by ${host}`, response.status, retryAt);
        }
        if (response.status === 304 && !cached) throw new HttpError('304 response without a cached body');
        if (!response.ok && response.status !== 304) throw new HttpError(`HTTP ${response.status} from ${host}`, response.status);
        if (/just a moment|checking your browser|enable javascript and cookies to continue|verify you are human/i.test(body.slice(0, 8000))) throw new HttpError(`Challenge page from ${host}`, 403);
        this.store.saveCache(raw);
        return raw;
      } catch (error) {
        if (error instanceof HttpError && (error.status < 500 || error.retryAt)) throw error;
        if (attempt === 2) throw error;
        await sleep(500 * 2 ** attempt);
      }
    }
    throw new Error('Unreachable HTTP attempt');
  }
}
