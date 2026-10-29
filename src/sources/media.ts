import { load } from 'cheerio';
import type { Media } from '../contracts/items.js';
import { hash } from '../platform/hash.js';
import { embedKind } from '../platform/media.js';
import { safeUrl } from '../platform/url.js';
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
  $('audio,audio source,video,video source,iframe,object[type="application/pdf"],embed[type="application/pdf"]').each((_i, element) => {
    const node = $(element), url = node.attr('src') ?? node.attr('data');
    if (element.tagName === 'iframe') {
      try {
        const frame = new URL(url!, base);
        if (!(['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com'].includes(frame.hostname) && frame.pathname.startsWith('/embed/') || frame.hostname === 'player.vimeo.com' && frame.pathname.startsWith('/video/') || frame.hostname === 'player.bilibili.com' && frame.pathname === '/player.html')) return;
      } catch { return; }
    }
    const type = element.tagName === 'audio' || node.parents('audio').length ? 'audio' : ['object', 'embed'].includes(element.tagName) ? 'pdf' : 'video';
    add(type, url, node.attr('title') || node.closest('figure').find('figcaption').text() || '');
  });
  $('a[href]').each((_i, element) => {
    const link = $(element), url = link.attr('href')!;
    try {
      const kind = embedKind(safeUrl(url, base));
      if (kind === 'video' || kind === 'audio' || kind === 'pdf') add(kind, url, link.text());
    } catch { /* Unsupported source links remain prose. */ }
  });
  return [...candidates.values()];
}

