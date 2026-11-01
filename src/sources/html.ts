import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export function htmlFragment(html: string): DocumentFragment {
  // Keep jsdom out of the CLI startup path. Fragments share an inert document
  // without allocating a new window or fetching page resources for each item.
  // Template parsing drops html/head/body wrappers and their attributes. Query
  // descendant elements only, and keep mutations out of the shared ownerDocument.
  // Nested template.content is a separate tree, outside descendant queries.
  const { JSDOM } = require('jsdom') as typeof import('jsdom');
  return JSDOM.fragment(html);
}

export function selectedText(root: ParentNode, selector: string): string {
  return Array.from(root.querySelectorAll(selector), node => node.textContent ?? '').join(' ');
}

export function normalizeText(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

const textBlocks = new Set(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'pre', 'blockquote', 'tr', 'td', 'th', 'dt', 'dd']);

export function readableText(root: Element | DocumentFragment): string {
  const chunks: string[] = [];
  let node: Node | null = root.firstChild;
  // Walk without cloning or mutating the DOM, and without recursing on deep input.
  while (node) {
    const name = node.nodeType === 1 ? (node as Element).localName : '';
    if (node.nodeType === 3 || node.nodeType === 4) chunks.push(node.nodeValue ?? '');
    else if (name === 'br' || textBlocks.has(name)) chunks.push(' ');
    if (name !== 'br' && node.firstChild) { node = node.firstChild; continue; }
    while (node) {
      if (node.nodeType === 1 && textBlocks.has((node as Element).localName)) chunks.push(' ');
      if (node.nextSibling) { node = node.nextSibling; break; }
      node = node.parentNode;
      if (node === root) node = null;
    }
  }
  return normalizeText(chunks.join(''));
}
