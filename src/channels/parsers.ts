import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { load } from 'cheerio';
import type { Item } from '../types.js';
import { safeUrl } from '../util.js';

export const array = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
export const plain = (value: unknown): string => load(typeof value === 'string' ? value : String(value ?? ''), {}, false).text().replace(/\s+/g, ' ').trim();
export function text(value: any): string { return typeof value === 'object' && value ? String(value['#text'] ?? '') : String(value ?? ''); }
export function date(value: unknown): string | undefined { const time = Date.parse(String(value ?? '')); return Number.isFinite(time) ? new Date(time).toISOString() : undefined; }
export function xml(body: string): any {
  if (/<!DOCTYPE/i.test(body)) throw new Error('DTD declarations are not accepted in feeds');
  if (XMLValidator.validate(body) !== true) throw new Error('Invalid XML response');
  return new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', removeNSPrefix: true, parseTagValue: false,
    processEntities: { enabled: true, maxTotalExpansions: 250_000, maxExpandedLength: 12_000_000 },
  }).parse(body);
}
export interface ParseContext { source: string; stream: string; channel: string; observedAt: string }
export function parseFollowBuilders(body: string, context: ParseContext): { generatedAt: string; items: Item[] } {
  const feed = JSON.parse(body);
  const generatedAt = date(feed.generatedAt);
  if (!generatedAt || !Array.isArray(feed.x)) throw new Error('Invalid follow-builders feed: expected generatedAt and x accounts');
  const account = feed.x.find((row: any) => String(row.handle).replace(/^@/, '').toLowerCase() === context.stream.toLowerCase());
  if (account && !Array.isArray(account.tweets)) throw new Error('Invalid follow-builders account timeline');
  const items: Item[] = (account?.tweets ?? []).map((row: any) => {
    if (!/^\d+$/.test(String(row.id)) || typeof row.text !== 'string') throw new Error('Invalid sampled X post');
    return { ...context, id: String(row.id), title: plain(row.text).slice(0, 180), text: plain(row.text),
      url: safeUrl(row.url ?? `https://x.com/${context.stream}/status/${row.id}`), author: context.stream,
      publishedAt: date(row.createdAt) ?? generatedAt, basis: 'published', metrics: { score: row.likes ?? null, comments: row.replies ?? null },
      kind: row.isQuote ? 'quote' : 'original', metadata: { feedGeneratedAt: generatedAt },
    } satisfies Item;
  });
  return { generatedAt, items };
}
export function parseFeed(body: string, context: ParseContext): Item[] {
  const document = xml(body);
  if (!document.rss?.channel && !document.feed && !document.RDF) throw new Error('Response is not an RSS or Atom feed');
  const entries: any[] = array(document.feed?.entry ?? document.rss?.channel?.item ?? document.RDF?.item);
  const announcementDate = context.source === 'arxiv' && !document.feed;
  return entries.flatMap((entry, index) => {
    if (context.source === 'arxiv' && entry.announce_type && text(entry.announce_type) !== 'new') return [];
    const links: any[] = array(entry.link);
    const link = links.find(link => typeof link === 'string' || !link['@rel'] || link['@rel'] === 'alternate');
    const rawUrl = typeof link === 'string' ? link : link?.['@href'];
    if (!rawUrl || !entry.title) throw new Error('Feed entry has no title or link');
    const url = safeUrl(rawUrl);
    let id = text(entry.id ?? entry.guid) || url;
    if (context.source === 'arxiv') id = url.match(/(?:abs|pdf)\/([^?#]+)/)?.[1]?.replace(/v\d+$/, '') ?? id;
    if (context.source === 'hackernews') id = text(entry.comments).match(/[?&]id=(\d+)/)?.[1] ?? id;
    const published = date(text(entry.published ?? entry.pubDate ?? entry.date));
    const rawSummary = text(entry.summary ?? entry.description ?? entry.content);
    const summary = context.source === 'reddit' ? plain(load(rawSummary)('div.md').text()) : plain(rawSummary);
    return [{ ...context, id, title: plain(text(entry.title)), url, publishedAt: published ?? context.observedAt,
      text: summary, author: plain(text(entry.author?.name ?? entry.creator ?? entry.author)),
      metrics: { rank: index + 1 }, basis: published ? context.source === 'arxiv' && !announcementDate ? 'submitted' : 'published' : 'observed',
      metadata: { missingPublicationDate: !published, ...(announcementDate ? { announcementDate: true } : {}), ...(entry.announce_type ? { announceType: text(entry.announce_type) } : {}) },
    } satisfies Item];
  });
}
export function parseTrending(body: string, context: ParseContext): Item[] {
  const $ = load(body); const articles = $('article.Box-row');
  if (!articles.length) throw new Error('GitHub Trending layout unavailable');
  return articles.toArray().map((element, index) => {
    const row = $(element); const href = row.find('h2 a').attr('href')?.trim();
    if (!href || !/^\/[\w.-]+\/[\w.-]+$/.test(href)) throw new Error('Invalid Trending repository');
    const stars = Number(row.find('a[href$="/stargazers"]').text().replace(/[^0-9]/g, ''));
    const windowText = row.find('.float-sm-right').text().trim();
    return { ...context, id: href.slice(1).toLowerCase(), title: href.slice(1), url: safeUrl(href, 'https://github.com'),
      text: row.find('p').text().trim(), publishedAt: context.observedAt, basis: 'observed',
      metrics: { rank: index + 1, stars: Number.isFinite(stars) ? stars : null, starsWindow: Number(windowText.replace(/[^0-9]/g, '')) || null },
      metadata: { windowLabel: windowText, language: row.find('[itemprop="programmingLanguage"]').text().trim() },
    };
  });
}
export function parseProductHunt(body: string, context: ParseContext, dateKey: string): Item[] {
  const $ = load(body); const candidates = $('section:has(> [data-test="vote-button"]), [data-test="post-item"], [data-test^="post-item-"]');
  if (!candidates.length) throw new Error('Product Hunt leaderboard layout unavailable');
  return candidates.toArray().flatMap((element, index) => {
    const row = $(element); const anchor = row.find('a[href^="/posts/"], a[href^="/products/"]').first();
    const href = anchor.attr('href'); const title = anchor.text().trim();
    if (!href || !title) return [];
    const voteText = row.find('[data-test="vote-button"], [data-test="vote-button-count"]').first().text();
    return [{ ...context, id: href.split('?')[0]!, title: title.replace(/^\d+\.\s*/, ''), url: safeUrl(href, 'https://www.producthunt.com'),
      text: row.find('[data-test="post-tagline"]').text().trim() || anchor.parent().next('span').text().trim(), publishedAt: context.observedAt, basis: 'leaderboard' as const,
      metrics: { rank: index + 1, votes: /^\s*[\d,]+\s*$/.test(voteText) ? Number(voteText.replace(/,/g, '')) : null }, metadata: { leaderboardDate: dateKey } }];
  });
}
