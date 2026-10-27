import { createHash } from 'node:crypto';
import { mkdir, rename, open } from 'node:fs/promises';
import { dirname } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { DateTime } from 'luxon';
export function iso(value: DateTime, label = 'timestamp'): string {
  const result = value.toISO();
  if (!result) throw new Error('Invalid ' + label + ': ' + (value.invalidExplanation ?? 'cannot serialize ISO timestamp'));
  return result;
}
export function isoDate(value: DateTime, label = 'date'): string {
  const result = value.toISODate();
  if (!result) throw new Error('Invalid ' + label + ': ' + (value.invalidExplanation ?? 'cannot serialize ISO date'));
  return result;
}
export const hash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const nowIso = (): string => new Date().toISOString();
export const sleep = (ms: number, signal?: AbortSignal): Promise<void> => setTimeout(ms, undefined, { signal });
export function safeUrl(value: string, base?: string, options: { preserveQuery?: boolean } = {}): string {
  const url = new URL(value, base);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid public URL');
  // Image signatures may cover every query byte, including tracking-like keys.
  if (!options.preserveQuery) for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
  url.hash = '';
  return url.href;
}
export async function atomicWrite(path: string, content: string, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  const file = await open(temporary, 'w', 0o600);
  try { await file.writeFile(content); await file.sync(); } finally { await file.close(); }
  signal?.throwIfAborted();
  await rename(temporary, path);
  // Node cannot open directory handles for fsync on Windows (EPERM). The file
  // itself is flushed before rename; directory-entry crash durability is POSIX-only.
  if (process.platform === 'win32') return;
  const directory = await open(dirname(path), 'r');
  try { await directory.sync(); } finally { await directory.close(); }
}
export function errorText(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).replace(/(Bearer\s+|(?:token|api[_-]?key|ct0|auth_token)[=:]\s*)[^\s,;]+/gi, '$1[redacted]').slice(0, 2000);
}
export async function mapLimit<T, R>(values: T[], limit: number, fn: (value: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(values.length); let index = 0;
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (index < values.length) { const i = index++; results[i] = await fn(values[i]!); }
  }));
  return results;
}
