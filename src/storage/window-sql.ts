import type { ItemWindow } from '../contracts/window.js';
// Keep durable queue filtering identical to the in-memory admission check.
export function itemWindowSql(item: string, firstSeen: string, window: ItemWindow, path = '$', publishedAt = `json_extract(${item},'${path}.publishedAt')`): { clause: string; parameters: string[] } {
  const observed = `json_extract(${item},'${path}.basis')='observed'`;
  return {
    clause: `((${observed} AND julianday(${firstSeen})>=julianday(?)${window.observedUntil ? ` AND julianday(${firstSeen})${window.observedInclusive ? '<=' : '<'}julianday(?)` : ''}) OR (${observed} IS NOT TRUE AND julianday(${publishedAt})>=julianday(?)${window.until ? ` AND julianday(${publishedAt})<julianday(?)` : ''}))`,
    parameters: [window.observedSince, ...(window.observedUntil ? [window.observedUntil] : []), window.since, ...(window.until ? [window.until] : [])],
  };
}
