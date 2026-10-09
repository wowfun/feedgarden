import { load } from 'cheerio';
import type { Item, Media } from './types.js';
import { hash, safeUrl, errorText } from './util.js';
import { Http } from './http.js';
import { Store } from './store.js';

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

// Only the official sources have a bounded, known origin. Other feeds retain
// their supplied body/media; discovery links do not trigger arbitrary crawling.
export async function enrichItem(item: Item, store: Store, http: Http, refresh = false): Promise<Item> {
  const allowed = item.source === 'openai' ? ['openai.com'] : item.source === 'anthropic' ? ['www.anthropic.com', 'anthropic.com'] : [];
  if (!allowed.includes(new URL(item.url).hostname)) return item;
  const feedHash = hash(item.text), cache = store.cache(item.url), rawStart = http.raw.length;
  let raw = cache, failure: string | undefined;
  try {
    if (refresh || !raw || Date.now() - Date.parse(raw.fetchedAt) > 6 * 3600_000) raw = await http.page(item.url);
  } catch (error) { failure = errorText(error); }
  finally {
    const insert = store.db.prepare('INSERT INTO raw_responses(source,stream,channel,fetched_at,url,status,headers,body,hash) VALUES (?,?,?,?,?,?,?,?,?)');
    for (const response of http.raw.slice(rawStart)) insert.run(item.source, item.stream, 'article', response.fetchedAt, response.url, response.status, JSON.stringify(response.headers), response.body, hash(response.body));
  }
  const article = raw && parseArticle(raw.body, item.url);
  if (article && article.text.length > item.text.length) return { ...item, text: article.text, media: [...new Map([...article.media, ...(item.media ?? [])].map(candidate => [candidate.url, candidate])).values()].slice(0, 6), metadata: { ...item.metadata, enrichment: 'article', feedTextHash: feedHash, articleFetchedAt: raw!.fetchedAt, ...(failure ? { articleError: failure } : {}) } };
  // A transient fetch failure must not downgrade previously accepted full text.
  const previous = store.db.prepare('SELECT accepted FROM feed_summaries WHERE source=? AND id=?').get(item.source, item.id) as { accepted: string } | undefined;
  const accepted = previous && (JSON.parse(previous.accepted) as { item: Item }).item;
  if (accepted?.metadata?.feedTextHash === feedHash) return { ...item, text: accepted.text, media: accepted.media, metadata: { ...item.metadata, ...accepted.metadata, ...(failure ? { articleError: failure } : {}) } };
  return { ...item, metadata: { ...item.metadata, enrichment: 'feed', ...(failure ? { articleError: failure } : {}) } };
}
