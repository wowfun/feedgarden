
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { Item } from '../contracts/items.js';
import { array, date, plain, text, type ParseContext } from './channels/parsers.js';

import { errorText } from '../platform/errors.js';
import { hash } from '../platform/hash.js';
import { Http } from '../platform/http/client.js';
import { nowIso } from '../platform/time.js';
import { safeUrl } from '../platform/url.js';
import { type Storage } from '../storage/index.js';
import { mediaForUrl } from './media.js';





const FEED = 'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-podcasts.json';
const transcriptFeeds = new WeakMap<Http, Map<string, string | undefined>>();

export function parsePodcastFeed(body: string, context: ParseContext, name: string, notes: string[] = []): Item[] {
  if (/<!DOCTYPE/i.test(body) || XMLValidator.validate(body) !== true) throw new Error('Invalid podcast XML');
  const document = new XMLParser({
    ignoreAttributes: false, attributeNamePrefix: '@', parseTagValue: false,
    processEntities: { enabled: true, maxTotalExpansions: 250_000, maxExpandedLength: 12_000_000 }
  }).parse(body);
  if (!document.rss?.channel) throw new Error('Podcast response is not RSS');
  const rows = array(document.rss.channel.item), result: Item[] = [];
  let failures = 0;
  for (const row of rows) {
    try {
      const title = plain(text(row.title ?? row['itunes:title']));
      const enclosure = array(row.enclosure).find((e: any) => String(e?.['@type']).startsWith('audio/')) as any;
      const audio = enclosure?.['@url'];
      const link = array(row.link).map(text).find(Boolean);
      const url = safeUrl(link || audio);
      const guid = text(row.guid) || url;
      if (!title) throw new Error('Episode has no title');
      const publishedAt = date(text(row.pubDate ?? row['dc:date']), context.timezone);
      const transcript = array(row['podcast:transcript']).find((t: any) => ['text/vtt', 'text/plain'].includes(String(t?.['@type']))) as any;
      const media = audio ? mediaForUrl('audio', audio, name + ': ' + title, url) : undefined;
      result.push({
        ...context, id: context.stream + ':' + guid, title, url,
        author: plain(text(row['itunes:author'] ?? document.rss.channel['itunes:author'])) || name,
        text: plain(text(row['content:encoded'] ?? row.description ?? row['itunes:summary'])),
        publishedAt: publishedAt ?? context.observedAt, basis: publishedAt ? 'published' : 'observed', metrics: {},
        media: media ? [media] : [], metadata: {
          podcastName: name, podcastGuid: guid,
          ...(transcript?.['@url'] ? { transcriptUrl: safeUrl(transcript['@url']), transcriptType: String(transcript['@type']) } : {})
        }
      });
    } catch { failures++; }
  }
  if (failures && !result.length) throw new Error('All podcast episodes failed validation');
  if (failures) notes.push(`${failures} malformed podcast episodes skipped.`);
  return result;
}

export function transcriptText(body: string, vtt = false): string {
  if (/<(?:html|!doctype)/i.test(body)) throw new Error('Transcript endpoint returned HTML');
  if (!vtt && !body.trimStart().startsWith('WEBVTT')) return body.normalize('NFKC').replace(/\r\n?/g, '\n').trim();
  if (!body.trimStart().startsWith('WEBVTT')) throw new Error('Invalid WebVTT transcript');
  const parts: string[] = [];
  for (const block of body.replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
    const lines = block.split('\n'), timing = lines.findIndex(line => line.includes('-->'));
    if (timing < 0) continue;
    const spoken = plain(lines.slice(timing + 1).join(' ').replace(/<v\s+([^>]+)>/g, '$1: '));
    if (spoken && parts.at(-1) !== spoken) parts.push(spoken);
  }
  if (!parts.length) throw new Error('Empty WebVTT transcript');
  return parts.join('\n\n').normalize('NFKC');
}

export async function enrichPodcast(item: Item, store: Storage, http: Http, refresh = false): Promise<Item> {
  const existing = store.sources.transcript(item.source, item.id) as { body: string; hash: string; url: string; updated_at: string } | undefined;
  let snapshot = existing, failure: string | undefined;
  if (refresh || !existing || Date.now() - Date.parse(existing.updated_at) > 6 * 3600_000) {
    const start = http.raw.length;
    let body: string | undefined, url: string | undefined;
    try {
      if (typeof item.metadata?.transcriptUrl === 'string') {
        try {
          const raw = await http.page(item.metadata.transcriptUrl, 1500, true);
          body = transcriptText(raw.body, item.metadata.transcriptType === 'text/vtt'); url = item.metadata.transcriptUrl;
        } catch (e) { http.signal?.throwIfAborted(); failure = errorText(e); }
      }
      if (!body) {
        const raw = await http.shared(FEED);
        let index = transcriptFeeds.get(http);
        if (!index) {
          const feed = JSON.parse(raw.body);
          if (!Array.isArray(feed.podcasts)) throw new Error('Invalid follow-builders podcast feed');
          index = new Map();
          for (const episode of feed.podcasts) {
            if (typeof episode?.name !== 'string' || typeof episode?.guid !== 'string') continue;
            const key = JSON.stringify([episode.name, episode.guid]);
            if (!index.has(key)) index.set(key, typeof episode.transcript === 'string' ? episode.transcript : undefined);
          }
          transcriptFeeds.set(http, index);
        }
        const transcript = index.get(JSON.stringify([item.metadata?.podcastName, item.metadata?.podcastGuid]));
        if (transcript?.trim()) { body = transcriptText(transcript); url = FEED; }
      }
      if (body && url) {
        snapshot = { body, hash: hash(body), url, updated_at: nowIso() };
        store.assertLease();
        store.sources.saveTranscript(item.source, item.id, body, snapshot.hash, url, snapshot.updated_at);
      }
    } catch (e) { http.signal?.throwIfAborted(); failure = errorText(e); }
    finally { for (const raw of http.raw.splice(start)) store.saveRaw(item.source, item.stream, new URL(raw.url).pathname === '/robots.txt' ? 'robots' : 'podcast-transcript', raw); }
  }
  return {
    ...item, metadata: {
      ...item.metadata, summaryBasis: snapshot ? 'transcript' : 'shownotes',
      ...(snapshot ? { transcriptHash: snapshot.hash } : {}), ...(failure ? { transcriptError: failure } : {})
    }
  };
}

