export function safeUrl(value: string, base?: string, options: { preserveQuery?: boolean } = {}): string {
  const url = new URL(value, base);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid public URL');
  // Image signatures may cover every query byte, including tracking-like keys.
  if (!options.preserveQuery) for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
  url.hash = '';
  return url.href;
}
