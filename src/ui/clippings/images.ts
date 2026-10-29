import { parse, postprocess, preprocess } from 'micromark';
import { decodeString } from 'micromark-util-decode-string';
import { normalizeIdentifier } from 'micromark-util-normalize-identifier';

interface Syntax { type: string; start: number; end: number; children: Syntax[] }
interface Reference { image: Syntax; label: Syntax; destination: Syntax; title?: Syntax; shared: boolean; url: string }
export interface ImageReferences {
  urls: string[];
  rewrite(local: ReadonlyMap<string, string>): string;
}

function tree(source: string): Syntax {
  const root: Syntax = { type: 'root', start: 0, end: source.length, children: [] }, stack = [root];
  for (const [kind, token] of postprocess(parse().document().write(preprocess()(source, undefined, true)))) {
    if (kind === 'enter') {
      const node = { type: token.type, start: token.start.offset, end: token.end.offset, children: [] };
      stack.at(-1)!.children.push(node); stack.push(node);
    } else stack.pop();
  }
  return root;
}
function nodes(root: Syntax, type: string): Syntax[] {
  return root.children.flatMap(child => child.type === type ? [child] : nodes(child, type));
}
const blank = (text: string) => text.replace(/[^\r\n]/g, ' ');

export function clippingImages(source: string): ImageReferences {
  // Keep UTF-16 offsets, CRLF and BOM intact; frontmatter is never Markdown.
  let masked = source.replace(/^\uFEFF?---[^\S\r\n]*\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)[^\S\r\n]*(?:\r?\n|$)/, blank);
  // OFM comments are not CommonMark. Ignore delimiters inside actual code/HTML.
  const initial = tree(masked), protectedNodes = ['codeFenced', 'codeIndented', 'codeText', 'htmlFlow', 'htmlText'].flatMap(type => nodes(initial, type));
  const delimiters = [...masked.matchAll(/%%/g)].filter(match => !protectedNodes.some(node => node.start <= match.index && match.index < node.end));
  for (let i = delimiters.length - 1 - (delimiters.length % 2 === 0 ? 1 : 0); i >= 0; i -= 2) {
    const start = delimiters[i]!.index, end = delimiters[i + 1] ? delimiters[i + 1]!.index + 2 : masked.length;
    masked = masked.slice(0, start) + blank(masked.slice(start, end)) + masked.slice(end);
  }
  const root = tree(masked), text = (node: Syntax) => source.slice(node.start, node.end);
  const definitions = new Map<string, Syntax>();
  for (const definition of nodes(root, 'definition')) {
    const label = nodes(definition, 'definitionLabelString')[0]!;
    const key = normalizeIdentifier(text(label));
    if (!definitions.has(key)) definitions.set(key, definition);
  }
  const images: Syntax[] = [], links: Syntax[] = [];
  const visit = (node: Syntax) => {
    if (node.type === 'image') { images.push(node); return; }
    if (node.type === 'link') links.push(node);
    node.children.forEach(visit);
  };
  visit(root);
  const identifier = (node: Syntax) => {
    const reference = node.children.find(child => child.type === 'reference');
    const label = node.children.find(child => child.type === 'label')!;
    return normalizeIdentifier(text((reference && nodes(reference, 'referenceString')[0]) || nodes(label, 'labelText')[0]!));
  };
  const shared = new Set(links.filter(node => !node.children.some(child => child.type === 'resource')).map(identifier));
  const references: Reference[] = [];
  for (const image of images) {
    const label = image.children.find(node => node.type === 'label')!;
    const inline = image.children.find(node => node.type === 'resource');
    const definition = inline ? undefined : definitions.get(identifier(image));
    const destination = nodes(inline ?? definition ?? image, inline ? 'resourceDestinationString' : 'definitionDestinationString')[0];
    if (!destination) continue;
    const raw = decodeString(text(destination));
    if (!/^(?:https?:\/\/|\/\/)/i.test(raw)) continue;
    const url = raw.startsWith('//') ? 'https:' + raw : raw;
    references.push({ image, label, destination, url, shared: !inline && shared.has(identifier(image)), title: definition && nodes(definition, 'definitionTitleString')[0] });
  }
  return {
    urls: [...new Set(references.map(reference => reference.url))],
    rewrite(local) {
      const edits = new Map<number, { end: number; value: string }>();
      for (const ref of references) {
        const path = local.get(ref.url);
        if (!path) continue;
        if (ref.shared) {
          const title = ref.title ? ' "' + decodeString(text(ref.title)).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"' : '';
          edits.set(ref.image.start, { end: ref.image.end, value: text(ref.label) + `(<${path}>${title})` });
        } else edits.set(ref.destination.start, { end: ref.destination.end, value: path });
      }
      let result = source;
      for (const [start, edit] of [...edits].sort(([a], [b]) => b - a)) result = result.slice(0, start) + edit.value + result.slice(edit.end);
      return result;
    },
  };
}
