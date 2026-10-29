import { parse } from 'yaml';
import type { AcceptedItem } from '../../contracts/content.js';
import { embedKind } from '../../platform/media.js';
import { safeUrl } from '../../platform/url.js';
function escapeMarkdown(value: string): string { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_[\]{}()#!|$~]/g, char => `&#${char.charCodeAt(0)};`).replace(/\b([a-z][a-z0-9+.-]*):(?=\/\/)/gi, '$1&#58;').replace(/[\r\n]+/g, ' ').trim(); }
export function frontmatter(properties: Record<string, unknown>): string { return `---\n${Object.entries(properties).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n`; }
function prose(value: string): string {
  return value.trim().split(/\n\s*\n/).map(paragraph => paragraph.split('\n').map(line => /^\s*[-*]\s+/.test(line) ? '- ' + escapeMarkdown(line.replace(/^\s*[-*]\s+/, '')) : escapeMarkdown(line)).join('\n')).join('\n\n');
}
function mediaLink(label: string, url: string, image = false, alt = label): string {
  const href = safeUrl(url).replace(/[<>]/g, char => encodeURIComponent(char));
  const link = '[' + label + '](<' + href + '>)';
  if (image && /(?:\||&#124;)\d+(?:x\d+)?$/.test(alt)) alt += ' · ' + label.split(':')[0];
  return embedKind(safeUrl(url), image) ? '![' + alt + '](<' + href + '>)\n\n' + link : link;
}

// Archive snapshots keep their original prose and metadata. Upgrade only the
// generated media section in their publication copy, never the private snapshot.
export function renderArchivedMedia(markdown: string, locale: 'en' | 'zh-CN'): string {
  try { return upgradeArchivedMedia(markdown, locale); }
  catch { return markdown; } // Quarantined or authored files keep their exact bytes.
}
function upgradeArchivedMedia(markdown: string, locale: 'en' | 'zh-CN'): string {
  const front = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!front) return markdown;
  const fields = parse(front[1]!);
  if (!fields || fields.content_type !== 'post' || typeof fields.source_url !== 'string') return markdown;
  let rendered = markdown;
  const section = /\n## (?:Images and video|图片与视频)\r?\n\r?\n([\s\S]*?)\s*$/.exec(markdown);
  if (section) {
    const rows = section[1]!.split(/\r?\n/).filter(line => line.trim());
    const parsed = rows.map(line => /^- \[([^\n]*)\]\(<(https?:\/\/[^<>]+)>\)$/.exec(line));
    if (parsed.length && parsed.every(match => match)) {
      const media = parsed.map(match => mediaLink(match![1]!, match![2]!, /^(?:Image|图片)(?::|$)/.test(match![1]!)));
      rendered = markdown.slice(0, section.index) + '\n## ' + (locale === 'en' ? 'Media' : '媒体') + '\n\n' + media.join('\n\n') + '\n';
    }
  }
  const original = safeUrl(fields.source_url);
  const originalEmbedded = [...rendered.matchAll(/!\[[^\n]*\]\(<([^<>]+)>\)/g)].some(match => safeUrl(match[1]!) === original);
  if (embedKind(original) && !originalEmbedded) {
    const label = escapeMarkdown((locale === 'en' ? 'Original' : '原文') + (typeof fields.title === 'string' ? ': ' + fields.title : ''));
    const heading = '\n## ' + (locale === 'en' ? 'Media' : '媒体') + '\n';
    rendered = rendered.trimEnd() + (rendered.includes(heading) ? '\n\n' : '\n\n' + heading.trimStart() + '\n') + mediaLink(label, original) + '\n';
  }
  return rendered;
}
export function renderItem(record: AcceptedItem, locale: 'en' | 'zh-CN', topics = record.copy.topics): string {
  const { item, copy } = record, translation = copy[locale];
  const summary = prose(translation.summary);
  const excerpt = item.articleQuote && item.articleQuote + (item.text.replace(/\s+/g, ' ').trim() === item.articleQuote ? '' : '…');
  const selected = (copy.media ?? []).map(id => item.media?.find(candidate => candidate.id === id)).filter(candidate => !!candidate);
  const original = safeUrl(item.url), kind = embedKind(original);
  const candidates = kind && !selected.some(candidate => safeUrl(candidate.url) === original)
    ? [{ url: original, type: kind, title: translation.title, original: true }, ...selected] : selected;
  const labels = locale === 'en' ? { image: 'Image', video: 'Video', audio: 'Audio', pdf: 'PDF', post: 'Post' } : { image: '图片', video: '视频', audio: '音频', pdf: 'PDF', post: '帖子' };
  const media = candidates.map(candidate => {
    const label = escapeMarkdown(('original' in candidate ? locale === 'en' ? 'Original' : '原文' : labels[candidate.type]) + (candidate.title ? ': ' + candidate.title : ''));
    const alt = /\|\d+(?:x\d+)?$/.test(candidate.title) ? label + ' · ' + labels[candidate.type] : label;
    return mediaLink(label, candidate.url, candidate.type === 'image', alt);
  });
  let body = item.source === 'hackernews' ? excerpt ? '## ' + (locale === 'en' ? 'Original excerpt' : '原文摘录') + '\n\n> ' + escapeMarkdown(excerpt) : summary ? '## ' + (locale === 'en' ? 'Article' : '正文提炼') + '\n\n' + summary : '' : summary;
  if (item.source === 'podcast') {
    const basis = item.metadata?.summaryBasis === 'transcript' ? 'transcript' : 'shownotes';
    const notes = locale === 'en'
      ? { transcript: 'Based on the complete available transcript.', shownotes: 'Based on episode show notes.' }
      : { transcript: '根据取得的完整转录整理。', shownotes: '根据单集节目简介整理。' };
    body += (body ? '\n\n' : '') + notes[basis];
  }
  if (copy.discussion && item.discussion) {
    const links = copy.discussion.commentIds.map(id => item.discussion!.comments.find(comment => comment.id === id)).filter(comment => !!comment).map(comment => '[' + escapeMarkdown((comment.author || '#' + comment.id)) + '](https://news.ycombinator.com/item?id=' + encodeURIComponent(comment.id) + ')');
    const sample = locale === 'en' ? 'Based on ' + item.discussion.comments.length + ' selected comments and replies.' : '根据 ' + item.discussion.comments.length + ' 条选取的评论与回复整理。';
    body += (body ? '\n\n' : '') + '## ' + (locale === 'en' ? 'HN discussion' : 'HN 热门讨论') + '\n\n' + sample + '\n\n' + prose(copy.discussion[locale]);
    body += '\n\n' + (locale === 'en' ? 'Selected comments: ' : '评论来源：') + links.join(' · ') + '\n\n[' + (locale === 'en' ? 'Read the full HN discussion' : '查看完整 HN 讨论') + '](<' + safeUrl(item.discussion.url) + '>)';
  }
  body += media.length ? '\n\n## ' + (locale === 'en' ? 'Media' : '媒体') + '\n\n' + media.join('\n\n') : '';
  const descriptionChars = [...(translation.summary || excerpt || copy.discussion?.[locale] || '').replace(/\s+/g, ' ')];
  const description = descriptionChars.length > 240 ? descriptionChars.slice(0, 237).join('') + '...' : descriptionChars.join('');
  return frontmatter({ publish: true, content_type: 'post', title: translation.title, description, date: record.date, updated: record.updated, first_seen: record.firstSeen, date_basis: record.dateBasis, source_url: safeUrl(item.url), ...(item.repoUrl ? { repo_url: safeUrl(item.repoUrl) } : {}), ...(item.discussion ? { discussion_url: safeUrl(item.discussion.url) } : {}), tags: ['source/' + item.source, ...topics.map(id => 'topics/' + id)] }) + body + '\n';
}
