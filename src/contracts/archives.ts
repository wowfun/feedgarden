import type { Item } from './items.js';
export interface ArchivePost { path: string; source: string; id: string; day: string; number: number; item: Item; firstSeen: string; en: string; zh: string }
export interface ArchiveIssue { path: string; source: string; day: string; message: string }
export type ArchiveReference = Omit<ArchivePost, 'en' | 'zh'>;
