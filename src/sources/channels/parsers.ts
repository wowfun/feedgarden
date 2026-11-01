import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';
import { DateTime } from 'luxon';
import type { Item, RankingWindow } from '../../contracts/items.js';
import { redditRanking } from '../../contracts/scoring.js';
import { iso } from '../../contracts/time.js';
import { safeUrl } from '../../platform/url.js';
import { htmlFragment, normalizeText, readableText, selectedText } from '../html.js';
import { extractMedia, mediaForUrl } from '../media.js';
import { productHuntObjects } from '../producthunt.js';

export const array = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
export const plain = (value: unknown): string => readableText(htmlFragment(String(value ?? '')));
export function text(value: any): string { return typeof value === 'object' && value ? String(value['#text'] ?? '') : String(value ?? ''); }
export function date(value: unknown, timezone = 'Asia/Shanghai'): string | undefined {
  const input = String(value ?? '').trim();
  if (!input) return undefined;
  for (const parsed of [DateTime.fromISO(input, { zone: timezone }), DateTime.fromRFC2822(input, { zone: timezone }), DateTime.fromSQL(input, { zone: timezone })]) {
    if (parsed.isValid) return iso(parsed.toUTC());
  }
  return undefined;
}
const xmlOptions = {
  ignoreAttributes: false, attributeNamePrefix: '@', removeNSPrefix: true, parseTagValue: false,
  processEntities: { enabled: true, maxTotalExpansions: 250_000, maxExpandedLength: 12_000_000 },
};
export function xml(body: string): any {
  if (/<!DOCTYPE/i.test(body)) throw new Error('DTD declarations are not accepted in feeds');
  if (XMLValidator.validate(body) !== true) throw new Error('Invalid XML response');
  return new XMLParser({
    ...xmlOptions,
    // Preserve mixed text/element order until XHTML constructs are decoded.
    stopNodes: ['..title[type=xhtml]', '..summary[type=xhtml]', '..content[type=xhtml]'],
  }).parse(body);
}
function atomTextConstruct(value: any): { kind: 'text' | 'html'; value: string } {
  const type = String(value?.['@type'] ?? 'text').split(';', 1)[0]!.trim().toLowerCase();
  let content = text(value);
  if (type === 'xhtml') {
    // An ordered XML round-trip removes namespace prefixes without treating
    // escaped markup or CDATA text as HTML elements.
    const nodes = new XMLParser({ ...xmlOptions, preserveOrder: true, trimValues: false }).parse(content);
    content = new XMLBuilder({ preserveOrder: true, ignoreAttributes: false, attributeNamePrefix: '@', suppressEmptyNode: true }).build(nodes);
  }
  return { kind: ['html', 'text/html', 'xhtml'].includes(type) ? 'html' : 'text', value: content };
}
export interface ParseContext { source: string; stream: string; channel: string; observedAt: string; timezone?: string }
function parseEntries<T>(entries: any[], convert: (entry: any, index: number) => T[], label: string, notes?: string[]): T[] {
  let failed = 0;
  const items = entries.flatMap((entry, index) => {
    try { return convert(entry, index); }
    catch (error) { if (!notes) throw error; failed++; return []; }
  });
  if (failed && !items.length) throw new Error(`All ${label} entries failed validation`);
  if (failed) notes!.push(`${failed} malformed ${label} entries were skipped.`);
  return items;
}
export function parseFollowBuilders(body: string, context: ParseContext): { generatedAt: string; items: Item[] } {
  const feed = JSON.parse(body);
  const generatedAt = date(feed.generatedAt);
  if (!generatedAt || !Array.isArray(feed.x)) throw new Error('Invalid follow-builders feed: expected generatedAt and x accounts');
  const account = feed.x.find((row: any) => String(row.handle).replace(/^@/, '').toLowerCase() === context.stream.toLowerCase());
  if (account && !Array.isArray(account.tweets)) throw new Error('Invalid follow-builders account timeline');
  const items: Item[] = (account?.tweets ?? []).map((row: any) => {
    if (!/^\d+$/.test(String(row.id)) || typeof row.text !== 'string') throw new Error('Invalid sampled X post');
    return {
      ...context, id: String(row.id), title: normalizeText(row.text).slice(0, 180), text: normalizeText(row.text),
      url: safeUrl(row.url ?? `https://x.com/${context.stream}/status/${row.id}`), author: context.stream,
      publishedAt: date(row.createdAt, context.timezone) ?? context.observedAt, basis: date(row.createdAt, context.timezone) ? 'published' : 'observed', metrics: { score: row.likes ?? null, comments: row.replies ?? null },
      kind: row.isQuote ? 'quote' : 'original', metadata: { feedGeneratedAt: generatedAt },
    } satisfies Item;
  });
  return { generatedAt, items };
}
export function parseFeed(body: string, context: ParseContext, notes?: string[], redditWindow?: RankingWindow): Item[] {
  return parseFeedDocument(xml(body), context, notes, redditWindow);
}
export function parseFeedDocument(document: any, context: ParseContext, notes?: string[], redditWindow?: RankingWindow): Item[] {
  if (!document.rss?.channel && !document.feed && !document.RDF) throw new Error('Response is not an RSS or Atom feed');
  const entries: any[] = array(document.feed?.entry ?? document.rss?.channel?.item ?? document.RDF?.item);
  const announcementDate = context.source === 'arxiv' && !document.feed;
  // Callers with a page-offset checkpoint keep strict parsing. Snapshot feeds
  // may supply notes to retain valid entries and report degraded coverage.
  return parseEntries<Item>(entries, (entry, index) => {
    if (context.source === 'arxiv' && entry.announce_type && text(entry.announce_type) !== 'new') return [];
    const links: any[] = array(entry.link);
    const link = links.find(link => typeof link === 'string' || !link['@rel'] || link['@rel'] === 'alternate');
    const rawUrl = typeof link === 'string' ? link : link?.['@href'];
    const titleValue = document.feed ? atomTextConstruct(entry.title) : { kind: 'text', value: text(entry.title) };
    const title = titleValue.kind === 'html' ? plain(titleValue.value) : normalizeText(titleValue.value);
    if (!rawUrl || !title) throw new Error('Feed entry has no title or link');
    const url = safeUrl(rawUrl);
    let id = text(entry.id ?? entry.guid) || url;
    if (context.source === 'arxiv') id = url.match(/(?:abs|pdf)\/([^?#]+)/)?.[1]?.replace(/v\d+$/, '') ?? id;
    if (context.source === 'hackernews') id = text(entry.comments).match(/[?&]id=(\d+)/)?.[1] ?? id;
    if (context.source === 'reddit') {
      const postId = new URL(url).pathname.match(/\/comments\/([a-z0-9]+)(?:\/|$)/i)?.[1];
      if (postId) id = 't3_' + postId.toLowerCase();
    }
    const published = date(text(entry.published ?? entry.pubDate ?? entry.date), context.timezone);
    const summaryValue = [entry.encoded, entry.content, entry.summary, entry.description].find(value => text(value)) ?? '';
    // content:encoded is HTML even in Atom. Other Atom fields obey their text
    // construct type; compare the selected value before flattening XML objects.
    const summaryConstruct = document.feed && summaryValue !== entry.encoded
      ? atomTextConstruct(summaryValue) : { kind: 'html', value: text(summaryValue) };
    const rawSummary = summaryConstruct.value;
    // Reddit's source contract extracts only div.md from its HTML payload,
    // including feeds that omit Atom's content type and include boilerplate.
    const summaryIsText = context.source !== 'reddit' && summaryConstruct.kind === 'text';
    let summary: string;
    if (summaryIsText) summary = normalizeText(rawSummary);
    else if (context.source === 'reddit') summary = Array.from(htmlFragment(rawSummary).querySelectorAll('div.md'), readableText).join(' ');
    else summary = plain(rawSummary);
    const media = summaryIsText ? [] : extractMedia(rawSummary, url);
    for (const enclosure of [...array(entry.enclosure), ...array(entry.content), ...array(entry.thumbnail)]) {
      if (typeof enclosure !== 'object' || !enclosure?.['@url']) continue;
      const kind = String(enclosure['@type'] ?? enclosure['@medium'] ?? '');
      const type = kind.startsWith('image') ? 'image' : kind.startsWith('video') ? 'video' : kind.startsWith('audio') ? 'audio' : kind === 'application/pdf' ? 'pdf' : undefined;
      if (!type) continue;
      const candidate = mediaForUrl(type, enclosure['@url'], text(enclosure.title), url);
      if (candidate && !media.some(existing => existing.url === candidate.url) && media.length < 6) media.push(candidate);
    }
    return [{
      ...context, id, title, url, publishedAt: published ?? context.observedAt,
      text: summary, author: normalizeText(text(entry.author?.name ?? entry.creator ?? entry.author)),
      media,
      metrics: { rank: index + 1 }, basis: published ? context.source === 'arxiv' && !announcementDate ? 'submitted' : 'published' : 'observed',
      ...(context.source === 'reddit' && redditWindow ? { ranking: redditRanking(index + 1, entries.length, context.observedAt, redditWindow) } : {}),
      metadata: { missingPublicationDate: !published, ...(announcementDate ? { announcementDate: true } : {}), ...(entry.announce_type ? { announceType: text(entry.announce_type) } : {}) },
    } satisfies Item];
  }, 'feed', notes);
}
export function parseXTimeline(rows: any[], context: ParseContext, notes: string[]): Item[] {
  return parseEntries<Item>(rows, row => {
    const publishedAt = date(row.createdAtISO ?? row.createdAt, context.timezone);
    if (!/^\d+$/.test(String(row.id)) || !publishedAt || typeof row.text !== 'string') throw new Error('Invalid X timeline item');
    const body = normalizeText(row.text);
    return [{
      ...context, id: String(row.id), title: body.slice(0, 180), text: body + (row.quotedTweet?.text ? ' Quoting @' + row.quotedTweet.author?.screenName + ': ' + normalizeText(row.quotedTweet.text) : ''), author: row.author?.screenName ?? context.stream,
      url: safeUrl(row.url ?? `https://x.com/${context.stream}/status/${row.id}`), publishedAt, basis: 'published',
      metrics: { score: row.metrics?.likes ?? null, comments: row.metrics?.replies ?? null }, kind: row.isRetweet ? 'repost' : row.quotedTweet ? 'quote' : 'original',
    }];
  }, 'X timeline', notes);
}
export function parseTrending(body: string, context: ParseContext): Item[] {
  const articles = htmlFragment(body).querySelectorAll('article.Box-row');
  if (!articles.length) throw new Error('GitHub Trending layout unavailable');
  return [...articles].map((row, index) => {
    const href = row.querySelector('h2 a')?.getAttribute('href')?.trim();
    if (!href || !/^\/[\w.-]+\/[\w.-]+$/.test(href)) throw new Error('Invalid Trending repository');
    const stars = Number(selectedText(row, 'a[href$="/stargazers"]').replace(/[^0-9]/g, ''));
    const windowText = selectedText(row, '.float-sm-right').trim();
    return {
      ...context, id: href.slice(1).toLowerCase(), title: href.slice(1), url: safeUrl(href, 'https://github.com'),
      text: selectedText(row, 'p').trim(), publishedAt: context.observedAt, basis: 'observed',
      metrics: { rank: index + 1, stars: Number.isFinite(stars) ? stars : null, starsWindow: Number(windowText.replace(/[^0-9]/g, '')) || null },
      metadata: { windowLabel: windowText, language: selectedText(row, '[itemprop="programmingLanguage"]').trim() },
    };
  });
}
export function parseProductHunt(body: string, context: ParseContext, dateKey: string): Item[] {
  const candidates = htmlFragment(body).querySelectorAll('section:has(> [data-test="vote-button"]), [data-test="post-item"], [data-test^="post-item-"]');
  if (!candidates.length) throw new Error('Product Hunt leaderboard layout unavailable');
  const posts = new Map<string, Set<string>>();
  for (const node of productHuntObjects(body)) {
    if (node.__typename === 'Post' && /^\d+$/.test(String(node.id)) && DateTime.fromISO(String(node.featuredAt)).setZone(context.timezone ?? 'Asia/Shanghai').toISODate() === dateKey) {
      for (const [prefix, slug] of [['products', node.product?.slug], ['posts', node.slug]]) {
        if (typeof slug !== 'string' || !/^[\w-]+$/.test(slug)) continue;
        const path = '/' + prefix + '/' + slug, ids = posts.get(path) ?? new Set<string>();
        ids.add(String(node.id)); posts.set(path, ids);
      }
    }
  }
  return [...candidates].flatMap((row, index) => {
    const anchor = row.querySelector('a[href^="/posts/"], a[href^="/products/"]');
    const href = anchor?.getAttribute('href'); const title = anchor?.textContent?.trim();
    if (!href || !title) return [];
    const legacyId = href.split('?')[0]!, ids = posts.get(legacyId), nativePostId = ids?.size === 1 ? [...ids][0] : undefined;
    const voteText = row.querySelector('[data-test="vote-button"], [data-test="vote-button-count"]')?.textContent ?? '';
    const next = anchor!.parentElement?.nextElementSibling;
    return [{
      ...context, id: nativePostId ? 'tag:www.producthunt.com,2005:Post/' + nativePostId : legacyId, title: title.replace(/^\d+\.\s*/, ''), url: safeUrl(href, 'https://www.producthunt.com'),
      text: selectedText(row, '[data-test="post-tagline"]').trim() || (next?.matches('span') ? next.textContent?.trim() ?? '' : ''), publishedAt: date(dateKey, context.timezone)!, basis: 'leaderboard' as const,
      metrics: { rank: index + 1, votes: /^\s*[\d,]+\s*$/.test(voteText) ? Number(voteText.replace(/,/g, '')) : null }, metadata: { leaderboardDate: dateKey, ...(nativePostId ? { nativePostId, legacyId } : {}) }
    }];
  });
}
