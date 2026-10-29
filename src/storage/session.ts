import { DatabaseSession } from './database.js';
/** Application-facing database capabilities. SQL is confined to storage internals. */
export type Storage = Omit<DatabaseSession, 'db' | 'statement'>;
export type ReadStorage = Pick<Storage, 'path' | 'meta' | 'states' | 'items' | 'cache' | 'cacheHeaders' | 'isSelected' | 'close' | 'quickCheck' | 'backup'> & {
  readonly models: Pick<Storage['models'], 'dailyUsage' | 'cooldown' | 'findAttempt'>;
  readonly runs: Pick<Storage['runs'], 'find' | 'token' | 'listIds'>;
  readonly sources: Pick<Storage['sources'], 'findItem' | 'hasItem'>;
  readonly maintenance: Pick<Storage['maintenance'], 'scheduledRun' | 'activeLease'>;
};
export function openDatabase(path: string, options: { readonly: true }): ReadStorage;
export function openDatabase(path: string, options?: { readonly?: false }): Storage;
export function openDatabase(path: string, options: { readonly?: boolean } = {}): Storage { return new DatabaseSession(path, options); }

export { QuotaDeferred } from './database.js';
