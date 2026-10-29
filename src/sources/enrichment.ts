import { load } from 'cheerio';
import type { Item, Media } from '../contracts/items.js';
import { errorText } from '../platform/errors.js';
import { hash } from '../platform/hash.js';
import { Http } from '../platform/http/client.js';
import { nowIso } from '../platform/time.js';
import { type Storage } from '../storage/index.js';
import { enrichHackerNews } from './hackernews.js';
import { extractMedia } from './media.js';
import { enrichPodcast } from './podcasts.js';
import { parseProductHuntRepository, productHuntPage, repositoryUrl } from './producthunt.js';

const officialArticleHosts = new Map([
  ['openai', ['openai.com']],
  ['anthropic', ['www.anthropic.com', 'anthropic.com']],
]);
function isOfficialArticle(item: Item): boolean {
  return officialArticleHosts.get(item.source)?.includes(new URL(item.url).hostname) ?? false;
}

// Only recent enriched items receive periodic refreshes; changed items and
// explicit --refresh remain eligible regardless of age.
export function enrichmentInterval(item: Item): number {
  if (item.source === 'podcast') return 6 * 3600_000;
  if (item.source === 'hackernews' && /^\d+$/.test(item.id)) return 3600_000;
  if (item.source === 'producthunt' && productHuntPage(item.url)) return 6 * 3600_000;
  return isOfficialArticle(item) ? 6 * 3600_000 : 0;
}

export function parseArticle(html: string, url: string): { text: string; media: Media[] } | undefined {
  const $ = load(html);
  $('script,style,nav,footer,aside,form,[aria-hidden="true"],[data-testid="related-content"]').remove();
  const root = $('article').first().length ? $('article').first() : $('main').first();
  if (!root.length || !root.find('p').length) return undefined;
  const text = root.find('h1,h2,h3,p,li').toArray().filter(element => !$(element).parents('li').length)
    .map(element => $(element).text().replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n').slice(0, 100000);
  return text.length >= 200 ? { text, media: extractMedia(root.html() ?? '', url) } : undefined;
}

function saveEnrichmentResponses(item: Item, store: Storage, http: Http, start: number, channel: string): void {
  for (const response of http.raw.splice(start)) {
    http.signal?.throwIfAborted();
    store.saveRaw(item.source, item.stream, new URL(response.url).pathname === '/robots.txt' ? 'robots' : channel, response);
  }
}

async function enrichProductHunt(item: Item, store: Storage, http: Http, refresh: boolean): Promise<Item> {
  if (!productHuntPage(item.url)) return item;
  let raw = store.cache(item.url), failure: string | undefined;
  let attemptedAt: string | undefined;
  const start = http.raw.length;
  try {
    if (refresh || !raw || Date.now() - Date.parse(raw.fetchedAt) > 6 * 3600_000) { attemptedAt = nowIso(); raw = await http.page(item.url); }
  } catch (error) { failure = errorText(error); }
  finally { saveEnrichmentResponses(item, store, http, start, 'repository'); }
  http.signal?.throwIfAborted();
  const result = raw && store.extracted('producthunt/v1/' + item.url, raw.body, () => parseProductHuntRepository(raw!.body, item.url));
  const { repoUrl: _oldRepo, ...rest } = item;
  const metadata: NonNullable<Item['metadata']> = { ...item.metadata, ...(attemptedAt ? { repositoryLastAttemptAt: attemptedAt } : {}) };
  if (!result?.matched && !failure) failure = 'Product Hunt repository data unavailable';
  if (failure) {
    const row = store.jobs.accepted(item.source, item.id) as { accepted: string } | undefined;
    const previous = row && (JSON.parse(row.accepted) as { item: Item }).item;
    // A failed refresh retains only evidence belonging to the same product route.
    const retained = previous?.url === item.url ? repositoryUrl(previous.repoUrl) : undefined;
    const repoUrl = retained ?? repositoryUrl(item.repoUrl);
    return { ...rest, ...(repoUrl ? { repoUrl } : {}), metadata: { ...metadata, ...(retained ? { repositorySourceUrl: item.url, repositoryCheckedAt: previous!.metadata?.repositoryCheckedAt ?? null } : {}), repositoryError: failure } };
  }
  const { repositoryError: _oldError, ...successful } = metadata;
  return { ...rest, ...(result?.repoUrl ? { repoUrl: result.repoUrl } : {}), metadata: { ...successful, repositorySourceUrl: item.url, repositoryCheckedAt: raw!.fetchedAt } };
}

// Enrichment follows official article origins, Product Hunt product pages, and
// HN's submitted public article URL and fixed comment API. Prose links aren't crawled.
export async function enrichItem(item: Item, store: Storage, http: Http, refresh = false): Promise<Item> {
  if (item.source === 'podcast') return enrichPodcast(item, store, http, refresh);
  if (item.source === 'hackernews') {
    const start = http.raw.length;
    try { return await enrichHackerNews(item, store, http, refresh, extractMedia); }
    finally { saveEnrichmentResponses(item, store, http, start, 'hn-enrichment'); }
  }
  if (item.source === 'producthunt') return enrichProductHunt(item, store, http, refresh);
  if (!isOfficialArticle(item)) return item;
  const feedHash = hash(item.text), cache = store.cache(item.url), rawStart = http.raw.length;
  let raw = cache, failure: string | undefined;
  try {
    if (refresh || !raw || Date.now() - Date.parse(raw.fetchedAt) > 6 * 3600_000) raw = await http.page(item.url);
  } catch (error) { failure = errorText(error); }
  finally {
    saveEnrichmentResponses(item, store, http, rawStart, 'article');
  }
  http.signal?.throwIfAborted();
  const article = raw && store.extracted('official/v2/' + item.url, raw.body, () => parseArticle(raw!.body, item.url) ?? null);
  if (article && article.text.length > item.text.length) return { ...item, text: article.text, media: [...new Map([...article.media, ...(item.media ?? [])].map(candidate => [candidate.url, candidate])).values()].slice(0, 6), metadata: { ...item.metadata, enrichment: 'article', feedTextHash: feedHash, articleFetchedAt: raw!.fetchedAt, ...(failure ? { articleError: failure } : {}) } };
  // A transient fetch failure must not downgrade previously accepted full text.
  const previous = store.jobs.accepted(item.source, item.id) as { accepted: string } | undefined;
  const accepted = previous && (JSON.parse(previous.accepted) as { item: Item }).item;
  if (accepted?.metadata?.feedTextHash === feedHash) return { ...item, text: accepted.text, media: accepted.media, metadata: { ...item.metadata, ...accepted.metadata, ...(failure ? { articleError: failure } : {}) } };
  return { ...item, metadata: { ...item.metadata, enrichment: 'feed', ...(failure ? { articleError: failure } : {}) } };
}
