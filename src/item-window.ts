import { DateTime } from 'luxon';
import type { Item } from './types.js';
import { iso } from './util.js';

export interface WindowOptions { since?: string; until?: string; observedDays?: number }
export interface ItemWindow { since: string; until?: string; observedSince: string; observedUntil?: string; observedInclusive: boolean }
export type PublicationScope = Record<string, ItemWindow>;

export function resolveItemWindow(options: WindowOptions, cutoff: string, at: string): ItemWindow {
  const normalize = (value: string, name: string) => iso(DateTime.fromISO(value).toUTC(), name);
  const since = options.since === undefined ? cutoff : normalize(options.since, '--since');
  const until = options.until === undefined ? undefined : normalize(options.until, '--until');
  if (until && !options.since) throw new Error('--until requires --since');
  if (until && Date.parse(until) <= Date.parse(since)) throw new Error('--until must be later than --since');
  if (options.observedDays !== undefined && (!Number.isSafeInteger(options.observedDays) || options.observedDays < 1 || !until)) throw new Error('--observed-days requires a positive integer and a --since/--until window');
  const later = (a: string, b: string) => new Date(Math.max(Date.parse(a), Date.parse(b))).toISOString();
  if (until && Date.parse(until) <= Date.parse(cutoff)) throw new Error('--until must be later than the durable cutoff');
  return {
    since: later(cutoff, since), until,
    observedSince: later(cutoff, options.observedDays === undefined ? since : new Date(Date.parse(at) - options.observedDays * 86400_000).toISOString()),
    observedUntil: options.observedDays === undefined ? until : normalize(at, 'observation time'),
    observedInclusive: options.observedDays !== undefined,
  };
}

export function inItemWindow(item: Item, firstSeen: string, window: ItemWindow): boolean {
  const observed = item.basis === 'observed', value = Date.parse(observed ? firstSeen : item.publishedAt);
  const lower = Date.parse(observed ? window.observedSince : window.since), upper = observed ? window.observedUntil : window.until;
  return Number.isFinite(value) && value >= lower && (!upper || (observed && window.observedInclusive ? value <= Date.parse(upper) : value < Date.parse(upper)));
}

// Keep durable queue filtering identical to the in-memory admission check.
export function itemWindowSql(item: string, firstSeen: string, window: ItemWindow, path = '$', publishedAt = `json_extract(${item},'${path}.publishedAt')`): { clause: string; parameters: string[] } {
  const observed = `json_extract(${item},'${path}.basis')='observed'`;
  return {
    clause: `((${observed} AND julianday(${firstSeen})>=julianday(?)${window.observedUntil ? ` AND julianday(${firstSeen})${window.observedInclusive ? '<=' : '<'}julianday(?)` : ''}) OR (${observed} IS NOT TRUE AND julianday(${publishedAt})>=julianday(?)${window.until ? ` AND julianday(${publishedAt})<julianday(?)` : ''}))`,
    parameters: [window.observedSince, ...(window.observedUntil ? [window.observedUntil] : []), window.since, ...(window.until ? [window.until] : [])],
  };
}
