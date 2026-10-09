import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DateTime } from 'luxon';
import { load } from 'cheerio';
import type { Source, Stream, Channel } from '../config.js';
import type { Collection, Item } from '../types.js';
import { Http } from '../http.js';
import { Store } from '../store.js';
import { hash, mapLimit, safeUrl } from '../util.js';
import { array, date, parseFeed, parseFollowBuilders, parseProductHunt, parseTrending, plain, text, xml, type ParseContext } from './parsers.js';

const exec = promisify(execFile);
export interface ChannelContext { source: Source; stream: Stream; channel: Channel; store: Store; http: Http; now: string; since: string; restartRange?: boolean }
export type Adapter = (context: ChannelContext) => Promise<Collection>;
function base(c: ChannelContext): ParseContext { return { source: c.source.id, stream: c.stream.id, channel: c.channel.id, observedAt: c.now, timezone: c.source.timezone }; }
function collected(c: ChannelContext, items: Item[], notes: string[] = [], cursor?: string): Collection {
  return { items, raw: c.http.raw, cursor, coverage: { status: notes.length ? 'partial' : 'complete', from: c.since, to: c.now, notes } };
}
async function feed(c: ChannelContext): Promise<Collection> {
  const raw = await c.http.get(c.channel.url!, c.source.id === 'reddit' ? 60000 : c.source.id === 'arxiv' ? 3100 : 0, c.channel.transport);
  const items = parseFeed(raw.body, base(c));
  const notes = items.length ? ['Recent feed window; completeness before the oldest returned item is unknown.'] : [];
  if (c.source.id === 'hackernews') notes.push('Hacker News front-page RSS; score and comment counts are unavailable.');
  if (c.source.id === 'producthunt') notes.push('New-product feed, not a dated leaderboard.');
  return collected(c, items, notes);
}
async function hn(c: ChannelContext): Promise<Collection> {
  const url = 'https://hacker-news.firebaseio.com/v0';
  const raw = await c.http.get(`${url}/topstories.json`); const ids: unknown = JSON.parse(raw.body);
  if (!Array.isArray(ids) || ids.some(id => typeof id !== 'number')) throw new Error('Invalid HN topstories response');
  const failures: string[] = [];
  const items = await mapLimit(ids.slice(0, c.channel.limit) as number[], 8, async id => {
    try {
      const raw = await c.http.get(`${url}/item/${id}.json`); const row = JSON.parse(raw.body);
      if (!row || row.deleted || row.dead || row.type !== 'story') return undefined;
      if (!row.title || !Number.isFinite(row.time)) throw new Error('Malformed HN story');
      return { ...base(c), id: String(id), title: plain(row.title), url: safeUrl(row.url ?? `https://news.ycombinator.com/item?id=${id}`),
        publishedAt: new Date(row.time * 1000).toISOString(), author: row.by, text: plain(row.text ?? ''),
        metrics: { score: row.score ?? null, comments: row.descendants ?? null, rank: ids.indexOf(id) + 1 }, basis: 'published',
        metadata: { discussionUrl: `https://news.ycombinator.com/item?id=${id}` } } satisfies Item;
    } catch { failures.push(String(id)); return undefined; }
  });
  if (failures.length === ids.length && ids.length) throw new Error('All HN item requests failed');
  return collected(c, items.filter((item): item is NonNullable<typeof item> => !!item), [
    ...(ids.length > c.channel.limit ? [`Candidate snapshot truncated to ${c.channel.limit} items.`] : []),
    ...(failures.length ? [`${failures.length} HN item requests failed.`] : []),
  ]);
}
async function trending(c: ChannelContext): Promise<Collection> { return collected(c, parseTrending((await c.http.page(c.channel.url!)).body, base(c))); }
async function githubSearch(c: ChannelContext): Promise<Collection> {
  const from = DateTime.fromISO(c.now).minus({ days: 1 }).toISODate();
  const query = encodeURIComponent(`pushed:>=${from} stars:>50 archived:false`);
  const body = JSON.parse((await c.http.get(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=50`)).body);
  if (!Array.isArray(body.items)) throw new Error('Invalid GitHub search response');
  return collected(c, body.items.map((row: any, index: number): Item => ({ ...base(c), id: String(row.full_name).toLowerCase(), title: row.full_name, url: safeUrl(row.html_url), text: row.description ?? '', publishedAt: c.now, basis: 'observed', metrics: { stars: row.stargazers_count, rank: index + 1 } })), ['Repository discovery by recent push and total stars; not GitHub Trending.']);
}
async function followBuilders(c: ChannelContext): Promise<Collection> {
  const { generatedAt: generated, items } = parseFollowBuilders((await c.http.shared(c.channel.url!)).body, base(c));
  const result = collected(c, items, ['Third-party daily sample: up to 3 posts per account; replies and complete threads are not covered. Missing accounts do not imply no activity.']);
  if (Date.parse(c.now) - Date.parse(generated) > 36 * 3600_000) result.coverage.status = 'stale';
  return result;
}
async function xCli(c: ChannelContext): Promise<Collection> {
  const auth = process.env[c.channel.authTokenEnv], csrf = process.env[c.channel.csrfTokenEnv];
  if (!auth || !csrf) throw new Error('X explicit cookies unavailable; use limited feed fallback');
  const executable = resolve('.local/twitter-cli/bin/twitter');
  const marker = resolve('.local/twitter-cli/feedgarden-env-only.json');
  if (!existsSync(executable) || !existsSync(marker)) throw new Error('X CLI is not installed with the verified env-only authentication patch');
  const manifest = JSON.parse(readFileSync(marker, 'utf8'));
  if (hash(readFileSync(resolve(manifest.authFile), 'utf8')) !== manifest.authHash) throw new Error('X CLI authentication patch integrity check failed');
  const run = async (limit: number) => {
    const result = await exec(executable, ['user-posts', c.stream.id, '--max', String(limit), '--json'], { timeout: 90000, maxBuffer: 8_000_000,
      env: { PATH: process.env.PATH, LANG: 'C.UTF-8', HOME: process.env.HOME, TWITTER_AUTH_TOKEN: auth, TWITTER_CT0: csrf, TWITTER_PROXY: process.env.TWITTER_PROXY, FEEDGARDEN_AUTH_ENV_ONLY: '1' }, cwd: resolve('.local/twitter-cli') });
    c.http.raw.push({ url: `cli:twitter/user-posts/${c.stream.id}`, status: 200, body: result.stdout, fetchedAt: c.now, headers: {} });
    const parsed = JSON.parse(result.stdout); if (!parsed.ok || !Array.isArray(parsed.data)) throw new Error('Invalid X CLI output');
    return parsed.data as any[];
  };
  let rows = await run(100);
  const boundary = c.store.channel(c.source.id, c.stream.id, c.channel.id)?.cursor;
  if (boundary && !rows.some(row => String(row.id) === boundary) && rows.length >= 100) rows = await run(200);
  const items: Item[] = rows.map(row => {
    const publishedAt = date(row.createdAtISO ?? row.createdAt, c.source.timezone);
    if (!/^\d+$/.test(String(row.id)) || !publishedAt || typeof row.text !== 'string') throw new Error('Invalid X timeline item');
    return { ...base(c), id: String(row.id), title: plain(row.text).slice(0, 180), text: plain(row.text) + (row.quotedTweet?.text ? ' Quoting @' + row.quotedTweet.author?.screenName + ': ' + plain(row.quotedTweet.text) : ''), author: row.author?.screenName ?? c.stream.id,
      url: safeUrl(row.url ?? `https://x.com/${c.stream.id}/status/${row.id}`), publishedAt, basis: 'published',
      metrics: { score: row.metrics?.likes ?? null, comments: row.metrics?.replies ?? null }, kind: row.isRetweet ? 'repost' : row.quotedTweet ? 'quote' : 'original',
    };
  });
  const notes = boundary && !items.some(item => item.id === boundary) ? ['The current timeline did not overlap the previous boundary; a collection gap may exist.'] : [];
  if (!boundary && items.length >= 100) notes.push('Initial timeline is bounded to 100 posts; earlier history is unknown.');
  notes.push('The timeline endpoint does not guarantee complete author threads.');
  const newest = items.map(item => item.id).sort((a, b) => BigInt(a) > BigInt(b) ? -1 : 1)[0];
  return collected(c, items, notes, newest ?? boundary ?? undefined);
}
async function arxiv(c: ChannelContext): Promise<Collection> {
  const checkpoint = c.restartRange ? undefined : c.store.channel(c.source.id, c.stream.id, c.channel.id)?.cursor;
  const range: { from: string; to: string; offset: number } = checkpoint ? JSON.parse(checkpoint) : { from: c.since, to: c.now, offset: 0 };
  const from = DateTime.fromISO(range.from).toUTC().toFormat('yyyyLLddHHmm');
  const to = DateTime.fromISO(range.to).toUTC().toFormat('yyyyLLddHHmm');
  const query = encodeURIComponent(`cat:${c.stream.id} AND submittedDate:[${from} TO ${to}]`);
  let start = range.offset; const items: Item[] = []; let total = 0;
  const notes: string[] = [];
  do {
    try {
      const size = Math.min(200, c.channel.limit - items.length);
      const raw = await c.http.get(`https://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=ascending&start=${start}&max_results=${size}`, 3100);
      const parsed = xml(raw.body); if (!parsed.feed) throw new Error('Invalid arXiv API response');
      total = Number(text(parsed.feed.totalResults));
      if (!Number.isSafeInteger(total) || total < 0) throw new Error('Invalid arXiv result count');
      const page = parseFeed(raw.body, base(c));
      if (!page.length && start < total) throw new Error('arXiv pagination ended before the advertised result count');
      items.push(...page); start += page.length;
      if (!page.length) break;
    } catch (error) {
      if (!items.length) throw error;
      notes.push('Pagination interrupted; the next run resumes at the first uncommitted page.'); break;
    }
  } while (start < total && items.length < c.channel.limit);
  if (start < total) notes.push(`Retrieved ${start} of ${total} matching papers; the remaining range will resume on the next run.`);
  const result = collected(c, items, notes, notes.length ? JSON.stringify({ ...range, offset: start }) : '');
  result.coverage.from = range.from; result.coverage.to = range.to;
  return result;
}
async function productHunt(c: ChannelContext): Promise<Collection> {
  const from = DateTime.fromISO(c.since).setZone(c.source.timezone).startOf('day');
  const to = DateTime.fromISO(c.now).setZone(c.source.timezone).minus({ days: 1 }).startOf('day');
  const items: Item[] = [];
  for (let day = from; day <= to; day = day.plus({ days: 1 })) {
    const url = `https://www.producthunt.com/leaderboard/daily/${day.year}/${day.month}/${day.day}`;
    const page = parseProductHunt((await c.http.page(url)).body, base(c), day.toISODate()!);
    items.push(...page.map(item => ({ ...item, publishedAt: day.toUTC().toISO()! })));
  }
  return collected(c, items);
}
async function officialPages(c: ChannelContext): Promise<Collection> {
  const origin = new URL(c.channel.url!).origin;
  const urls = new Set<string>();
  const first = await c.http.page(c.channel.url!);
  if (c.channel.kind === 'sitemap') {
    const document = xml(first.body);
    const children = array<any>(document.sitemapindex?.sitemap).map(row => text(row.loc)).filter(url => new URL(url).origin === origin);
    const documents = [document];
    for (const child of children.slice(0, 12)) documents.push(xml((await c.http.page(child)).body));
    for (const document of documents) for (const entry of array<any>(document.urlset?.url)) {
      const url = text(entry.loc);
      if (new URL(url).origin !== origin) continue;
      const path = new URL(url).pathname;
      if (c.source.id === 'anthropic' ? path.startsWith(`/${c.stream.id}/`) : /^\/(index|news|research)\//.test(path)) urls.add(url);
    }
  } else {
    const $ = load(first.body);
    $('a[href]').each((_index, element) => {
      const href = $(element).attr('href'); if (!href) return;
      const url = new URL(href, origin); if (url.origin === origin && url.pathname.startsWith(`/${c.stream.id}/`)) urls.add(url.href);
    });
  }
  if (!urls.size) throw new Error('Official list/sitemap contained no recognizable article links');
  const items: Item[] = []; let failures = 0;
  // URLs already stored retain their original publication date; sitemap lastmod is never used as publication time.
  const known = new Set(c.store.items(c.source.id).map(item => item.url));
  for (const url of [...urls].filter(url => !known.has(url)).slice(0, 50)) {
    try {
      const raw = await c.http.page(url); const $ = load(raw.body);
      const objects: any[] = [];
      $('script[type="application/ld+json"]').each((_i, element) => { try { objects.push(JSON.parse($(element).text())); } catch {} });
      const entities = objects.flatMap(object => array<any>(object['@graph'] ?? object));
      const article = entities.find(object => /Article|BlogPosting|NewsArticle/.test(text(object['@type'])));
      const published = date(article?.datePublished ?? $('meta[property="article:published_time"]').attr('content') ?? $('time[datetime]').first().attr('datetime'), c.source.timezone);
      const title = plain(article?.headline ?? $('h1').first().text());
      if (!title) { failures++; continue; }
      $('script,style,nav,footer,header').remove();
      items.push({ ...base(c), id: safeUrl(url), title, url: safeUrl(url), publishedAt: published ?? c.now, basis: published ? 'published' : 'observed', metrics: {},
        text: plain($('article').first().text() || $('main').first().text()).slice(0, 100000),
      });
    } catch { failures++; }
  }
  return collected(c, items, [...(failures ? [`${failures} official pages were inaccessible or lacked a verifiable publication date.`] : []), ...(urls.size > 50 ? ['Discovery budget is 50 previously unseen detail pages per run.'] : [])]);
}
export const adapters: Record<Channel['kind'], Adapter> = { 'hn-api': hn, feed, sitemap: officialPages, 'anthropic-html': officialPages, 'github-trending': trending, 'github-search': githubSearch, 'x-cli': xCli, 'follow-builders': followBuilders, 'arxiv-api': arxiv, 'ph-html': productHunt };
