import type { Registry } from '../../contracts/registry.js';
import { collectionTabs } from '../collections.js';
import { topicTagAliases } from '../topics.js';
import { frontmatter } from './render.js';

type Locale = 'en' | 'zh-CN';
interface SourceLabel { id: string; name?: string }
interface LocaleManifest {
  [key: string]: unknown;
  tag_labels?: Record<string, string>;
  hidden_tags?: string[];
  tag_aliases?: Record<string, string>;
}

/** Both projections share the theme format; callers choose which sources and
 * existing files belong in their private snapshot or public worktree. */
export function localeManifest(defaults: LocaleManifest, previous: LocaleManifest | undefined, sources: readonly SourceLabel[], registry: Registry, locale: Locale): LocaleManifest & { tag_labels: Record<string, string> } {
  const labels = Object.fromEntries(sources.map(source => ['source/' + source.id,
    defaults.tag_labels?.['source/' + source.id] ?? source.name ?? previous?.tag_labels?.['source/' + source.id] ?? source.id]));
  return {
    ...defaults, ...previous,
    tag_labels: {
      ...defaults.tag_labels, ...previous?.tag_labels,
      'source/clippings': defaults.tag_labels?.['source/clippings'] ?? previous?.tag_labels?.['source/clippings'] ?? 'Clippings',
      ...labels, ...Object.fromEntries(registry.topics.map(topic => ['topics/' + topic.id, topic.name[locale]])),
    },
    hidden_tags: [...new Set([
      ...[...(defaults.hidden_tags ?? []), ...(previous?.hidden_tags ?? [])].filter(tag => !tag.startsWith('topics/')),
      ...registry.topics.filter(topic => topic.hidden).map(topic => 'topics/' + topic.id),
    ])].sort(),
    tag_aliases: { ...defaults.tag_aliases, ...previous?.tag_aliases, ...topicTagAliases(registry) },
  };
}

export function indexPage(locale: Locale, source?: SourceLabel): string {
  if (!source) return frontmatter({ publish: true, content_type: 'page', title: 'Feedgarden' });
  const tab = collectionTabs([source])[0], title = tab?.title[locale] ?? source.name ?? source.id;
  return frontmatter({
    publish: true, content_type: 'page', title,
    ...(tab ? { tab: locale === 'en' ? { id: tab.id, order: tab.order, topics: ['source/' + source.id], layout: 'archive' } : { label: title } } : {}),
  }) + '# ' + title + '\n';
}
