import { load } from 'cheerio';
import { safeUrl } from '../platform/url.js';

// Decode Apollo's data transport without executing any of the page's JavaScript.
export function* productHuntObjects(body: string): Generator<Record<string, any>> {
  const $ = load(body);
  let visited = 0;
  for (const element of $('script').toArray()) {
    const script = $(element).text();
    if (!script.startsWith('(window[Symbol.for("ApolloSSRDataTransport")]')) continue;
    const payload = script.match(/\.push\((\{[\s\S]*\})\)\s*;?$/)?.[1];
    if (!payload) continue;
    const pending: unknown[] = [];
    try { pending.push(JSON.parse(payload.replace(/"(?:\\.|[^"\\])*"|\bundefined\b/g, token => token === 'undefined' ? 'null' : token))); } catch { continue; }
    while (pending.length) {
      if (++visited > 100000) return;
      const node = pending.pop();
      if (!node || typeof node !== 'object') continue;
      if (!Array.isArray(node)) yield node as Record<string, any>;
      for (const child of Object.values(node)) pending.push(child);
    }
  }
}

export function repositoryUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 2048) return undefined;
  try {
    const url = new URL(safeUrl(value));
    if (url.port || !['github.com', 'gitlab.com', 'bitbucket.org', 'codeberg.org'].includes(url.hostname)) return undefined;
    const parts = url.pathname.replace(/\/+$/, '').slice(1).split('/');
    if (parts.length < 2 || url.hostname !== 'gitlab.com' && parts.length !== 2 || parts.some(part => !/^[\w.-]+$/.test(part) || /^\.+$/.test(part) || part === '-')) return undefined;
    if (['features', 'topics', 'collections', 'settings', 'users', 'orgs', 'login', 'explore', 'marketplace', 'help', 'groups', 'sponsors', 'search', 'notifications', 'pulls'].includes(parts[0]!.toLowerCase())) return undefined;
    parts[parts.length - 1] = parts.at(-1)!.replace(/\.git$/, '');
    if (!parts.at(-1) || /^\.+$/.test(parts.at(-1)!)) return undefined;
    return 'https://' + url.hostname + '/' + parts.join('/');
  } catch { return undefined; }
}

export function productHuntPage(url: string): boolean {
  try {
    const parsed = new URL(safeUrl(url));
    return parsed.origin === 'https://www.producthunt.com' && /^\/(products|posts)\/[\w-]+\/?$/.test(parsed.pathname);
  } catch { return false; }
}

export function parseProductHuntRepository(body: string, url: string): { matched: boolean; repoUrl?: string } {
  if (!productHuntPage(url)) return { matched: false };
  const [, route, slug] = new URL(url).pathname.match(/^\/(products|posts)\/([\w-]+)\/?$/)!;
  const products = [], productIds = new Set<string>(), productSlugs = new Set<string>(), explicit = new Set<string>(), primary = new Set<string>();
  let matched = false;
  if (route === 'products') productSlugs.add(slug!);
  function add(node: Record<string, any>): void {
    const repo = repositoryUrl(node.githubUrl), website = repositoryUrl(node.primaryLink?.url);
    if ('githubUrl' in node || website) matched = true;
    if (repo) explicit.add(repo);
    if (website) primary.add(website);
  }
  for (const node of productHuntObjects(body)) {
    if (node.__typename === 'Product') products.push(node);
    if (route === 'posts' && node.__typename === 'Post' && node.slug === slug) {
      add(node);
      if (typeof node.product?.slug === 'string') productSlugs.add(node.product.slug);
      if (node.product?.id != null) productIds.add(String(node.product.id));
    }
  }
  for (const node of products) if (productSlugs.has(node.slug) && node.id != null) productIds.add(String(node.id));
  for (const node of products) if (productSlugs.has(node.slug) || node.id != null && productIds.has(String(node.id))) {
    add(node);
  }
  const candidates = explicit.size ? explicit : primary;
  return { matched, ...(candidates.size === 1 ? { repoUrl: [...candidates][0]! } : {}) };
}
