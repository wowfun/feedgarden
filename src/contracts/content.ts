import type { z } from 'zod';
import type { Item } from './items.js';
import type { outputSchema } from './topics.mjs';
export type ItemCopy = z.infer<typeof outputSchema>['items'][number];
export interface AcceptedItem { item: Item; copy: ItemCopy; firstSeen: string; date: string; dateBasis: 'published' | 'observed'; updated: string }
