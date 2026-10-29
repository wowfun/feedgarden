export type EmbedKind = 'image' | 'audio' | 'video' | 'pdf' | 'post';

const files: Record<string, EmbedKind> = Object.fromEntries([
  ['image', 'apng avif bmp gif jpeg jpg png svg webp'],
  ['audio', '3gp flac m4a mp3 ogg wav'],
  ['video', 'mkv mov mp4 ogv webm'],
  ['pdf', 'pdf'],
].flatMap(([kind, extensions]) => extensions!.split(' ').map(extension => [extension, kind as EmbedKind])));

// Select formats supported by the pinned theme without fetching or guessing
// the content of an ordinary article. Unknown selected videos remain links.
export function embedKind(value: string, image = false): EmbedKind | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || /[\x00-\x20\x7f\\]/.test(value)) return;
    const { hostname: host, pathname: path, searchParams: query } = url;
    const single = (key: string) => {
      const values = query.getAll(key);
      if (values.length > 1) throw new Error('Duplicate provider option');
      return values[0];
    };
    const positive = (key: string) => single(key) === undefined || /^[1-9]\d*$/.test(single(key)!);
    const nonnegative = (key: string) => single(key) === undefined || /^(?:0|[1-9]\d*)$/.test(single(key)!);
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'www.youtube-nocookie.com', 'youtu.be'].includes(host)) {
      if (url.hash) return;
      const id = host === 'youtu.be' ? path.match(/^\/([^/]+)\/?$/)?.[1] : path === '/watch' ? single('v') : path.match(/^\/(?:shorts|live|embed)\/([^/]+)\/?$/)?.[1];
      const start = single('start') ?? single('t');
      const validStart = start === undefined || /^(?:0|[1-9]\d*)$/.test(start) || /^(?=.+)(?:\d+h)?(?:\d+m)?(?:\d+s)?$/.test(start);
      return id && /^[\w-]{11}$/.test(id) && validStart ? 'video' : undefined;
    }
    if (['bilibili.com', 'www.bilibili.com', 'm.bilibili.com', 'player.bilibili.com'].includes(host)) {
      if (url.hash || !positive('p') || !nonnegative('t')) return;
      if (/^\/video\/(?:BV1[A-Za-z0-9]{9}|av[1-9]\d*)\/?$/.test(path) || /^\/bangumi\/play\/ep[1-9]\d*\/?$/.test(path)) return 'video';
      if (host === 'player.bilibili.com' && path === '/player.html') {
        const ids = ['bvid', 'aid', 'episodeId'].filter(key => single(key) !== undefined);
        if (ids.length === 1 && (ids[0] === 'bvid' ? /^BV1[A-Za-z0-9]{9}$/.test(single('bvid')!) : positive(ids[0]!))) return 'video';
      }
      return;
    }
    if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
      if (url.hash || single('h') !== undefined && !/^[a-f\d]{10}$/i.test(single('h')!)) return;
      return /^\/(?:[1-9]\d*(?:\/[a-fA-F\d]{10})?|album\/[1-9]\d*\/video\/[1-9]\d*|channels\/[^/]+\/[1-9]\d*|groups\/[^/]+\/videos\/[1-9]\d*|ondemand\/[^/]+\/[1-9]\d*|video\/[1-9]\d*)\/?$/.test(path) ? 'video' : undefined;
    }
    if (['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'].includes(host)) {
      return /^\/(?:[A-Za-z0-9_]{1,15}\/status|i\/web\/status)\/[1-9]\d*\/?$/.test(path) ? 'post' : undefined;
    }
    if (['b23.tv', 'www.b23.tv'].includes(host)) return;
    if (['arxiv.org', 'www.arxiv.org'].includes(host) && /^\/pdf\/(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v[1-9]\d*)?(?:\.pdf)?$/.test(path)) return 'pdf';
    const kind = files[path.match(/\.([a-z\d]+)$/i)?.[1]?.toLowerCase() ?? ''];
    if (kind) return kind;
    return image ? 'image' : undefined;
  } catch { return; }
}
