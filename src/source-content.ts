import { load } from 'cheerio';
import type { Item, Media } from './types.js';
import { hash, safeUrl, errorText, nowIso } from './util.js';
import { Http } from './http.js';
import { Store } from './store.js';
import { productHuntPage, parseProductHuntRepository, repositoryUrl } from './producthunt.js';
import { enrichHackerNews } from './hackernews.js';

// Only recent enriched items receive periodic refreshes; changed items and
// explicit --refresh remain eligible regardless of age.
export function enrichmentInterval(item: Item): number {
  if (item.source === 'hackernews' && /^\d+$/.test(item.id)) return 3600_000;
  if (item.source === 'producthunt' && productHuntPage(item.url)) return 6 * 3600_000;
  const hosts = item.source === 'openai' ? ['openai.com'] : item.source === 'anthropic' ? ['www.anthropic.com', 'anthropic.com'] : [];
  return hosts.includes(new URL(item.url).hostname) ? 6 * 3600_000 : 0;
}

export function mediaForUrl(type: Media['type'], value: string, title: string, base: string): Media | undefined {
  try {
    const url = safeUrl(value, base);
    if (url.length > 2048 || type === 'image' && /(?:logo|icon|avatar|sprite|tracking|pixel)/i.test(url + ' ' + title)) return undefined;
    return { id: hash([type, url]), type, url, title: title.replace(/\s+/g, ' ').trim().slice(0, 240) };
  } catch { return undefined; }
}

export function extractMedia(html: string, base: string): Media[] {
  const $ = load(html), candidates = new Map<string, Media>();
  $('script,style,nav,footer,aside,form,[aria-hidden="true"]').remove();
  function add(type: Media['type'], value: string | undefined, title: string): void {
    if (!value || candidates.size >= 6) return;
    const candidate = mediaForUrl(type, value, title, base);
    if (candidate && !candidates.has(candidate.url)) candidates.set(candidate.url, candidate);
  }
  $('img').each((_i, element) => {
    const image = $(element);
    const width = Number(image.attr('width')), height = Number(image.attr('height'));
    if (width > 0 && width < 120 || height > 0 && height < 80) return;
    add('image', image.attr('src') ?? image.attr('data-src'), image.closest('figure').find('figcaption').text() || image.attr('alt') || '');
  });
  $('video,video source,iframe').each((_i, element) => {
    const node = $(element), url = node.attr('src');
    if (element.tagName === 'iframe' && !/(?:youtube(?:-nocookie)?\.com\/embed\/|player\.vimeo\.com\/video\/)/i.test(url ?? '')) return;
    add('video', url, node.attr('title') || node.closest('figure').find('figcaption').text() || '');
  });
  $('a[href]').each((_i, element) => {
    const link = $(element), url = link.attr('href')!;
    if (/(?:youtu\.be\/[^/?]+|youtube\.com\/(?:watch\?|shorts\/)|vimeo\.com\/\d+|\.(?:mp4|webm|m3u8)(?:[?#]|$))/i.test(url)) add('video', url, link.text());
  });
  return [...candidates.values()];
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

function saveEnrichmentResponses(item: Item, store: Store, http: Http, start: number, channel: string): void {
  for (const response of http.raw.splice(start)) {
    http.signal?.throwIfAborted();
    store.saveRaw(item.source, item.stream, channel, response);
  }
}

async function enrichProductHunt(item: Item, store: Store, http: Http, refresh: boolean): Promise<Item> {
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
    const row = store.db.prepare('SELECT accepted FROM feed_summaries WHERE source=? AND id=?').get(item.source, item.id) as { accepted: string } | undefined;
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
export async function enrichItem(item: Item, store: Store, http: Http, refresh = false): Promise<Item> {
  if (item.source === 'hackernews') {
    const start = http.raw.length;
    try { return await enrichHackerNews(item, store, http, refresh, extractMedia); }
    finally { saveEnrichmentResponses(item, store, http, start, 'hn-enrichment'); }
  }
  if (item.source === 'producthunt') return enrichProductHunt(item, store, http, refresh);
  const allowed = item.source === 'openai' ? ['openai.com'] : item.source === 'anthropic' ? ['www.anthropic.com', 'anthropic.com'] : [];
  if (!allowed.includes(new URL(item.url).hostname)) return item;
  const feedHash = hash(item.text), cache = store.cache(item.url), rawStart = http.raw.length;
  let raw = cache, failure: string | undefined;
  try {
    if (refresh || !raw || Date.now() - Date.parse(raw.fetchedAt) > 6 * 3600_000) raw = await http.page(item.url);
  } catch (error) { failure = errorText(error); }
  finally {
    saveEnrichmentResponses(item, store, http, rawStart, 'article');
  }
  http.signal?.throwIfAborted();
  const article = raw && store.extracted('official/v1/' + item.url, raw.body, () => parseArticle(raw!.body, item.url) ?? null);
  if (article && article.text.length > item.text.length) return { ...item, text: article.text, media: [...new Map([...article.media, ...(item.media ?? [])].map(candidate => [candidate.url, candidate])).values()].slice(0, 6), metadata: { ...item.metadata, enrichment: 'article', feedTextHash: feedHash, articleFetchedAt: raw!.fetchedAt, ...(failure ? { articleError: failure } : {}) } };
  // A transient fetch failure must not downgrade previously accepted full text.
  const previous = store.db.prepare('SELECT accepted FROM feed_summaries WHERE source=? AND id=?').get(item.source, item.id) as { accepted: string } | undefined;
  const accepted = previous && (JSON.parse(previous.accepted) as { item: Item }).item;
  if (accepted?.metadata?.feedTextHash === feedHash) return { ...item, text: accepted.text, media: accepted.media, metadata: { ...item.metadata, ...accepted.metadata, ...(failure ? { articleError: failure } : {}) } };
  return { ...item, metadata: { ...item.metadata, enrichment: 'feed', ...(failure ? { articleError: failure } : {}) } };
}
