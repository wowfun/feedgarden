import type { InstanceContext } from '../instance/index.js';


const tabs = [
  { source: 'podcast', id: 'podcasts', title: { en: 'Podcasts', 'zh-CN': '播客' }, order: 10 },
  { source: 'github', id: 'github', title: { en: 'GitHub', 'zh-CN': 'GitHub' }, order: 12 },
  { source: 'arxiv', id: 'arxiv', title: { en: 'arXiv', 'zh-CN': 'arXiv' }, order: 14 },
] as const;

// Disabled sources retain their public history. Rendering and archive protection
// must use the same collection definitions and configuration membership.
export function collectionTabs(sources: InstanceContext['sources']) {
  return tabs.filter(tab => sources.some(source => source.id === tab.source));
}
