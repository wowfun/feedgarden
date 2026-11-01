import type { Media } from '../contracts/items.js';
import { hash } from '../platform/hash.js';
import { embedKind } from '../platform/media.js';
import { safeUrl } from '../platform/url.js';
import { htmlFragment } from './html.js';
export function mediaForUrl(type: Media['type'], value: string, title: string, base: string): Media | undefined {
  try {
    const url = safeUrl(value, base);
    if (url.length > 2048 || type === 'image' && /(?:logo|icon|avatar|sprite|tracking|pixel)/i.test(url + ' ' + title)) return undefined;
    return { id: hash([type, url]), type, url, title: title.replace(/\s+/g, ' ').trim().slice(0, 240) };
  } catch { return undefined; }
}

export function extractMedia(html: string, base: string): Media[] {
  const document = htmlFragment(html), candidates = new Map<string, Media>();
  for (const node of document.querySelectorAll('script,style,nav,footer,aside,form,[aria-hidden="true"]')) node.remove();
  function add(type: Media['type'], value: string | undefined, title: string): void {
    if (!value || candidates.size >= 6) return;
    const candidate = mediaForUrl(type, value, title, base);
    if (candidate && !candidates.has(candidate.url)) candidates.set(candidate.url, candidate);
  }
  for (const image of document.querySelectorAll('img')) {
    const width = Number(image.getAttribute('width')), height = Number(image.getAttribute('height'));
    if (width > 0 && width < 120 || height > 0 && height < 80) continue;
    add('image', image.getAttribute('src') ?? image.getAttribute('data-src') ?? undefined, image.closest('figure')?.querySelector('figcaption')?.textContent || image.getAttribute('alt') || '');
  }
  for (const node of document.querySelectorAll('audio,audio source,video,video source,iframe,object[type="application/pdf"],embed[type="application/pdf"]')) {
    const url = node.getAttribute('src') ?? node.getAttribute('data') ?? undefined;
    if (node.localName === 'iframe') {
      try {
        const frame = new URL(url!, base);
        if (!(['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com'].includes(frame.hostname) && frame.pathname.startsWith('/embed/') || frame.hostname === 'player.vimeo.com' && frame.pathname.startsWith('/video/') || frame.hostname === 'player.bilibili.com' && frame.pathname === '/player.html')) continue;
      } catch { continue; }
    }
    const type = node.closest('audio') ? 'audio' : ['object', 'embed'].includes(node.localName) ? 'pdf' : 'video';
    add(type, url, node.getAttribute('title') || node.closest('figure')?.querySelector('figcaption')?.textContent || '');
  }
  for (const link of document.querySelectorAll('a[href]')) {
    const url = link.getAttribute('href')!;
    try {
      const kind = embedKind(safeUrl(url, base));
      if (kind === 'video' || kind === 'audio' || kind === 'pdf') add(kind, url, link.textContent ?? '');
    } catch { /* Unsupported source links remain prose. */ }
  }
  return [...candidates.values()];
}

