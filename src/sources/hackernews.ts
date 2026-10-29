import { Readability } from '@mozilla/readability';
import { load } from 'cheerio';
import { createRequire } from 'node:module';
import type { Comment, Discussion, Item, Media, RawResponse } from '../contracts/items.js';
import { mapLimit } from '../platform/concurrency.js';
import { errorText } from '../platform/errors.js';
import { hash } from '../platform/hash.js';
import { Http } from '../platform/http/client.js';
import { type Storage } from '../storage/index.js';

const API = 'https://hacker-news.firebaseio.com/v0/item/';
const require = createRequire(import.meta.url);
const flatten = (html: string): string => {
  const $ = load(html); $('script,style,nav,footer,aside,form').remove();
  $('br').replaceWith(' ');
  $('p,li,h1,h2,h3,div,pre,blockquote').prepend(' ').append(' ');
  return $.text().replace(/\s+/g, ' ').trim();
};

export function readHnArticle(html: string, url: string): { text: string; content: string } | undefined {
  if (html.length > 2_000_000) return undefined;
  // Load the DOM only when extracting an article. Keeping this CJS dependency
  // out of the concurrent ESM graph also avoids mixed parse5-version linking.
  const { JSDOM } = require('jsdom') as typeof import('jsdom');
  const dom = new JSDOM(html, { url });
  try {
    for (const node of dom.window.document.querySelectorAll('script,style,nav,footer,aside,form,[aria-hidden="true"],.comments,#comments,.cookie-banner')) node.remove();
    const article = new Readability(dom.window.document, { charThreshold: 80, maxElemsToParse: 20000 }).parse();
    if (!article?.content) return undefined;
    const text = flatten(article.content).slice(0, 100000);
    if (text.length < 40 || text.length < 400 && /^(?:sign in|subscribe to|access denied|enable javascript|verify you are human)/i.test(text)) return undefined;
    return { text, content: article.content };
  } catch { return undefined; }
  finally { dom.window.close(); }
}

export function articleQuote(text: string): string | undefined {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized || normalized.length > 600) return undefined;
  // An excerpt remains verbatim, with at most 25 words and 240 characters.
  const excerpt = normalized.match(/^(?:\S+\s+){0,24}\S+/)?.[0] ?? '';
  if (excerpt.length <= 240) return excerpt;
  const prefix = [...excerpt].slice(0, 120).join('');
  return prefix.includes(' ') ? prefix.slice(0, prefix.lastIndexOf(' ')) : prefix;
}

function childIds(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter(id => Number.isSafeInteger(id) && id > 0).map(String))] : [];
}
export async function enrichHackerNews(item: Item, store: Storage, http: Http, refresh: boolean, extractMedia: (html: string, url: string) => Media[]): Promise<Item> {
  if (!/^\d+$/.test(item.id)) return item;
  const feedHash = hash(item.text), previousRow = store.jobs.accepted(item.source, item.id) as { accepted: string } | undefined;
  const previous = previousRow && (JSON.parse(previousRow.accepted) as { item: Item }).item;
  const retained = previous?.url === item.url && previous.metadata?.hnFeedTextHash === feedHash ? previous : undefined;
  const metadata: NonNullable<Item['metadata']> = { ...item.metadata, hnFeedTextHash: feedHash };
  for (const key of ['hnArticleError', 'hnDiscussionError']) delete metadata[key];
  async function cached(url: string, ttl: number, page = false): Promise<RawResponse> {
    http.signal?.throwIfAborted();
    const response = store.cache(url);
    if (!refresh && response && Date.now() - Date.parse(response.fetchedAt) < ttl) return response;
    return page ? http.page(url, 1500, true) : http.get(url);
  }
  const [original, discussion] = await Promise.all([
    (async () => {
      const url = new URL(item.url);
      if (url.hostname === 'news.ycombinator.com') return { text: item.text };
      try {
        if (/\.(pdf|png|jpe?g|gif|mp4|webm)(?:$|[?#])/i.test(url.pathname)) throw new Error('Original is not an HTML/text article');
        const raw = await cached(item.url, 6 * 3600_000, true), type = raw.headers['content-type'] ?? '';
        if (type && !/(?:text\/html|application\/xhtml\+xml|text\/plain)/i.test(type)) throw new Error('Original is not an HTML/text article');
        const base = raw.resolvedUrl ?? item.url;
        const article = store.extracted('hackernews/v2/' + base, type + '\n' + raw.body, () => {
          const parsed = /text\/plain/i.test(type) ? { text: raw.body.replace(/\s+/g, ' ').trim().slice(0, 100000), content: '' } : readHnArticle(raw.body, base);
          return parsed ? { text: parsed.text, media: extractMedia(parsed.content, base) } : null;
        });
        if (!article?.text) throw new Error('Original article body unavailable');
        metadata.hnArticleFetchedAt = raw.fetchedAt;
        return article;
      } catch (error) {
        http.signal?.throwIfAborted(); metadata.hnArticleError = errorText(error);
        if (retained?.metadata?.hnArticleFetchedAt) metadata.hnArticleFetchedAt = retained.metadata.hnArticleFetchedAt;
        return { text: retained?.text ?? item.text, media: retained?.media };
      }
    })(),
    (async (): Promise<{ discussion?: Discussion; text?: string }> => {
      try {
        const raw = await cached(API + item.id + '.json', 3600_000), story = JSON.parse(raw.body);
        if (story?.deleted || story?.dead) return { discussion: { url: 'https://news.ycombinator.com/item?id=' + item.id, comments: [], totalComments: null, partial: false } };
        if (!story || String(story.id) !== item.id || story.type !== 'story') throw new Error('HN story unavailable');
        const topIds = childIds(story.kids), failed: string[] = [];
        async function comment(id: string, parent: string): Promise<{ comment: Comment; children: string[] } | undefined> {
          try {
            const row = JSON.parse((await cached(API + id + '.json', 3600_000)).body);
            if (!row || row.type !== 'comment' || String(row.id) !== id || String(row.parent) !== parent || row.deleted || row.dead || typeof row.text !== 'string') return undefined;
            const text = flatten(row.text).slice(0, 3000);
            return text ? { comment: { id, parent, author: typeof row.by === 'string' ? row.by.slice(0, 100) : '', text }, children: childIds(row.kids) } : undefined;
          } catch (error) { http.signal?.throwIfAborted(); failed.push(id); return undefined; }
        }
        const roots = (await mapLimit(topIds.slice(0, 8), 4, id => comment(id, item.id))).filter(row => !!row).slice(0, 6);
        const replies = new Map<string, Comment>();
        await mapLimit(roots.filter(row => row.children.length).slice(0, 4), 4, async row => {
          const reply = await comment(row.children[0]!, row.comment.id);
          if (reply) replies.set(row.comment.id, reply.comment);
        });
        const comments = roots.flatMap(row => [row.comment, ...(replies.has(row.comment.id) ? [replies.get(row.comment.id)!] : [])]);
        const totalComments = Number.isSafeInteger(story.descendants) && story.descendants >= 0 ? story.descendants : null;
        metadata.hnDiscussionFetchedAt = raw.fetchedAt;
        if (failed.length) metadata.hnDiscussionError = 'Some sampled HN comments unavailable: ' + failed.join(', ');
        if (!comments.length && failed.length && retained?.discussion) return { discussion: retained.discussion };
        return { discussion: { url: 'https://news.ycombinator.com/item?id=' + item.id, comments, totalComments, partial: failed.length > 0 || topIds.length > 8 || totalComments != null && totalComments > comments.length }, ...(typeof story.text === 'string' && new URL(item.url).hostname === 'news.ycombinator.com' ? { text: flatten(story.text) } : {}) };
      } catch (error) {
        http.signal?.throwIfAborted(); metadata.hnDiscussionError = errorText(error);
        if (retained?.metadata?.hnDiscussionFetchedAt) metadata.hnDiscussionFetchedAt = retained.metadata.hnDiscussionFetchedAt;
        return { discussion: retained?.discussion };
      }
    })(),
  ]);
  http.signal?.throwIfAborted();
  const text = (new URL(item.url).hostname === 'news.ycombinator.com' ? discussion.text : undefined) || original.text || item.text;
  const quote = articleQuote(text);
  const { articleQuote: _oldQuote, discussion: _oldDiscussion, ...rest } = item;
  const media = 'media' in original && original.media ? [...new Map([...original.media, ...(item.media ?? [])].map(candidate => [candidate.url, candidate])).values()].slice(0, 6) : item.media;
  return { ...rest, text, ...(quote ? { articleQuote: quote } : {}), ...(discussion.discussion ? { discussion: discussion.discussion } : {}), ...(media ? { media } : {}), metadata };
}
