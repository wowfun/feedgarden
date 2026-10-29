import { readFile } from 'node:fs/promises';
import { channelSchema, sourceSchema } from '../contracts/configuration.js';
import { FdgError } from '../contracts/errors.js';
import type { Item } from '../contracts/items.js';
import type { InstanceContext } from '../instance/index.js';
import { hash } from '../platform/hash.js';
import { Http, sourceRetryAt } from '../platform/http/client.js';
import { resource } from '../platform/resources.js';
import { nowIso } from '../platform/time.js';
import { safeUrl } from '../platform/url.js';
import { openDatabase, Transport } from '../storage/index.js';
import { adapters } from './channels/index.js';

export const channels = [
  { id: 'hackernews', actions: ['list'], parameters: ['limit'], dependencies: [] },
  { id: 'openai', actions: ['list'], parameters: ['subscription', 'limit'], dependencies: [] },
  { id: 'anthropic', actions: ['list'], parameters: ['subscription', 'limit'], dependencies: [] },
  { id: 'github', actions: ['list', 'search'], parameters: ['query', 'limit'], dependencies: [] },
  { id: 'reddit', actions: ['list'], parameters: ['subscription', 'limit'], dependencies: [] },
  {
    id: 'x',
    actions: ['list', 'setup'],
    parameters: ['subscription', 'limit'],
    dependencies: ['explicit X credentials', 'pinned twitter-cli'],
  },
  {
    id: 'arxiv',
    actions: ['list', 'search'],
    parameters: ['query', 'subscription', 'limit'],
    dependencies: [],
  },
  { id: 'podcast', actions: ['list'], parameters: ['url', 'subscription', 'limit'], dependencies: [] },
  { id: 'producthunt', actions: ['list'], parameters: ['limit'], dependencies: [] },
  { id: 'rss', actions: ['list'], parameters: ['url', 'limit'], dependencies: [] },
] as const;
export function routeUrl(value: string): { channel: string; id: string } | undefined {
  const url = new URL(value),
    host = url.hostname.toLowerCase(),
    path = url.pathname;
  if (host === 'news.ycombinator.com' && /^\d+$/.test(url.searchParams.get('id') ?? ''))
    return { channel: 'hackernews', id: url.searchParams.get('id')! };
  if (/(^|\.)reddit\.com$/.test(host)) {
    const id = /\/comments\/([a-z0-9]+)/i.exec(path)?.[1];
    if (id) return { channel: 'reddit', id: 't3_' + id.toLowerCase() };
  }
  if (host === 'github.com' && /^\/[^/]+\/[^/]+\/?$/.test(path))
    return { channel: 'github', id: path.replace(/^\/|\/$/g, '').toLowerCase() };
  if (host === 'arxiv.org') {
    const id = /\/(?:abs|pdf)\/([^/?]+)/.exec(path)?.[1];
    if (id) return { channel: 'arxiv', id: id.replace(/(?:v\d+)?(?:\.pdf)?$/, '') };
  }
  if (['x.com', 'twitter.com'].includes(host)) {
    const id = /\/status\/(\d+)/.exec(path)?.[1];
    if (id) return { channel: 'x', id };
  }
  if (['openai.com', 'www.openai.com'].includes(host)) return { channel: 'openai', id: safeUrl(value) };
  if (['anthropic.com', 'www.anthropic.com', 'claude.com'].includes(host))
    return { channel: 'anthropic', id: safeUrl(value) };
  return undefined;
}
export async function channelDescriptions() {
  const sources = await templates();
  const parameters = {
    limit: { type: 'integer', minimum: 1, maximum: 200 },
    query: { type: 'string' },
    url: { type: 'string', format: 'uri' },
    subscription: { type: 'string' },
  };
  return channels.map((channel) => ({
    ...channel,
    parametersSchema: {
      type: 'object',
      properties: Object.fromEntries(channel.parameters.map((name) => [name, parameters[name]])),
      additionalProperties: false,
    },
    subscriptionSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', pattern: '^[a-zA-Z0-9_.-]+$' },
        url: { type: 'string', format: 'uri' },
      },
      required: ['id'],
      additionalProperties: false,
    },
    routes: sources
      .find((s) => s.id === channel.id)
      ?.streams.map((stream) => ({
        subscription: stream.id,
        order: stream.routes.map((r) => ({ kind: r.kind, url: r.url })),
      })) ?? [{ subscription: 'feed', order: [{ kind: 'feed', url: 'Explicit public RSS URL' }] }],
    result: {
      items: 'stable source/id with untrusted evidence',
      coverage: 'current snapshot and available text scope',
    },
    errors: ['BAD_INPUT', 'SOURCE_UNAVAILABLE', 'SOURCE_RATE_LIMITED'],
    check: 'check ' + channel.id,
    urlRouting: 'read uses native identity when a platform URL matches; public article text only',
  }));
}
export async function templates(): Promise<InstanceContext['sources']> {
  return JSON.parse(await readFile(resource('subscriptions.json'), 'utf8')).map((source: unknown) =>
    sourceSchema.parse(source),
  );
}
export async function queryChannel(
  config: InstanceContext,
  id: string,
  action: string,
  options: { query?: string; url?: string; subscription?: string; limit?: number },
  signal?: AbortSignal,
) {
  const definition = channels.find((c) => c.id === id);
  if (!definition || !(definition.actions as readonly string[]).includes(action) || action === 'setup')
    throw new FdgError('BAD_INPUT', 'Unknown channel action');
  for (const [key, value] of Object.entries(options))
    if (value !== undefined && !(definition.parameters as readonly string[]).includes(key))
      throw new FdgError('BAD_INPUT', 'Unsupported parameter for ' + id + ': ' + key);
  if (
    options.limit !== undefined &&
    (!Number.isSafeInteger(options.limit) || options.limit < 1 || options.limit > 200)
  )
    throw new FdgError('BAD_INPUT', 'Query limit must be 1–200');
  let source = config.sources.find((s) => s.id === id) ?? (await templates()).find((s) => s.id === id);
  if (id === 'rss' || (id === 'podcast' && options.url)) {
    if (!options.url) throw new FdgError('BAD_INPUT', '--url is required');
    source = sourceSchema.parse({
      id,
      name: id,
      intervalHours: 1,
      streams: [
        {
          id: hash(safeUrl(options.url)).slice(0, 16),
          routes: [
            {
              id: 'rss',
              kind: id === 'podcast' ? 'podcast-rss' : 'feed',
              url: safeUrl(options.url),
              ...(id === 'podcast' ? { podcastName: 'Podcast' } : {}),
            },
          ],
        },
      ],
    });
  }
  if (!source) throw new FdgError('BAD_INPUT', 'Channel requires a configured subscription');
  let streams = source.streams.filter(
    (s) => s.enabled && (!options.subscription || s.id === options.subscription),
  );
  if (!streams.length) throw new FdgError('BAD_INPUT', 'Unknown subscription');
  if (action === 'search') {
    if (!options.query?.trim()) throw new FdgError('BAD_INPUT', '--query is required');
    const url =
      id === 'github'
        ? 'https://api.github.com/search/repositories?q=' +
        encodeURIComponent(options.query) +
        '&per_page=' +
        String(options.limit ?? 30)
        : 'https://export.arxiv.org/api/query?search_query=' +
        encodeURIComponent(options.query) +
        '&max_results=' +
        String(options.limit ?? 30);
    streams = [
      {
        id: 'search',
        enabled: true,
        routes: [
          channelSchema.parse({ id: 'search', kind: id === 'github' ? 'github-search' : 'feed', url }),
        ],
      },
    ];
  }
  const store = openDatabase(':memory:');
  store.transport = new Transport(config.paths.transport);
  const http = new Http(store, undefined, signal);
  const results: Item[] = [],
    coverage: unknown[] = [],
    failures: unknown[] = [];
  // Force public validation for every caller supplied URL, including feed redirects.
  const original = http.get.bind(http);
  http.get = (url, spacing, transport) => original(url, spacing, transport, true);
  const now = nowIso();
  try {
    for (const stream of streams) {
      let success = false;
      let hardFailure = false;
      const retries: string[] = [];
      for (const channel of stream.routes.filter((c) => c.enabled)) {
        try {
          const collection = await adapters[channel.kind]({
            source,
            stream,
            channel: { ...channel, limit: options.limit ?? 50 },
            store,
            http,
            now,
            since: new Date(Date.now() - 7 * 86400000).toISOString(),
            twitterEnvironment: config.paths.twitterEnvironment,
          });
          results.push(...collection.items);
          coverage.push(collection.coverage);
          success = true;
          break;
        } catch (error) {
          signal?.throwIfAborted();
          const retryAt = sourceRetryAt(error);
          if (retryAt) retries.push(retryAt);
          else hardFailure = true;
          failures.push({ route: channel.id, evidence: { trust: 'untrusted', text: String(error) } });
        }
      }
      if (!success)
        throw new FdgError(
          !hardFailure && retries.length ? 'SOURCE_RATE_LIMITED' : 'SOURCE_UNAVAILABLE',
          'No route returned usable data',
          hardFailure ? undefined : retries.sort()[0],
          { failures },
        );
    }
    const items = [...new Map(results.map((item) => [item.source + '/' + item.id, item])).values()].slice(
      0,
      options.limit ?? 50,
    );
    return {
      items,
      coverage,
      evidence: { trust: 'untrusted', scope: 'Current channel snapshot; history may be incomplete' },
    };
  } finally {
    store.close();
  }
}
export async function readUrl(
  config: InstanceContext,
  url: string,
  signal?: AbortSignal,
): Promise<{ items: Item[]; coverage: unknown }> {
  const { JSDOM } = await import('jsdom'),
    { Readability } = await import('@mozilla/readability');
  url = safeUrl(url);
  const store = openDatabase(':memory:');
  store.transport = new Transport(config.paths.transport);
  try {
    const raw = await new Http(store, undefined, signal).page(url, 1500, true),
      dom = new JSDOM(raw.body, { url: raw.resolvedUrl ?? url });
    try {
      const article = new Readability(dom.window.document).parse(),
        now = nowIso();
      if (!article?.textContent?.trim())
        throw new FdgError('CONTENT_UNAVAILABLE', 'Page has no readable article');
      const published =
        article.publishedTime && Number.isFinite(Date.parse(article.publishedTime))
          ? new Date(article.publishedTime).toISOString()
          : undefined;
      const route = routeUrl(raw.resolvedUrl ?? url);
      return {
        items: [
          {
            source: route?.channel ?? 'web',
            id: route?.id ?? safeUrl(raw.resolvedUrl ?? url),
            stream: 'explicit',
            channel: 'public-http',
            url: safeUrl(raw.resolvedUrl ?? url),
            title: article.title ?? url,
            text: article.textContent.slice(0, 100000),
            publishedAt: published ?? now,
            observedAt: now,
            basis: published ? 'published' : 'observed',
            metrics: {},
          },
        ],
        coverage: {
          status: 'partial',
          notes: ['Readable article text only; no authenticated content or guaranteed comments.'],
        },
      };
    } finally {
      dom.window.close();
    }
  } finally {
    store.close();
  }
}
