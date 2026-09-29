import { createHash } from 'node:crypto';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
export const hash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const nowIso = (): string => new Date().toISOString();
export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
export function safeUrl(value: string, base?: string): string {
  const url = new URL(value, base);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid public URL');
  for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
  url.hash = '';
  return url.href;
}
export async function atomicWrite(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, content, { mode: 0o600 });
  await rename(temporary, path);
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
