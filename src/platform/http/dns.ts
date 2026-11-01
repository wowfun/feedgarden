import type { LookupAddress } from 'node:dns';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { EnvHttpProxyAgent } from 'undici';

const cache = new Map<string, { expires: number; result: Promise<LookupAddress[]> }>();
const failure = (message: string) => new Error('DNS-over-HTTPS ' + message);
const normalizeName = (name: string) => name.toLowerCase().replace(/\.$/, '');

async function jsonBody(response: Response): Promise<any> {
  if (!response.ok) {
    await response.body?.cancel();
    throw failure('request returned HTTP ' + response.status);
  }
  const reader = response.body?.getReader();
  if (!reader) throw failure('response has no body');
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 65_536) throw failure('response exceeds 64 KiB');
      chunks.push(value);
    }
  } finally { await reader.cancel(); reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw failure('response is not valid JSON'); }
}

async function query(endpoint: URL, hostname: string) {
  // Only this explicitly configured, trusted resolver uses ordinary proxy DNS.
  // Source URLs and redirects still pass through public-address validation and
  // connect to the returned IP with the original Host/SNI and TLS verification.
  const dispatcher = new EnvHttpProxyAgent();
  try {
    const records = await Promise.all([1, 28].map(async type => {
      const url = new URL(endpoint);
      url.searchParams.set('name', hostname);
      url.searchParams.set('type', String(type));
      let response: Response;
      try {
        response = await fetch(url, { dispatcher, redirect: 'error',
          headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(10_000) } as RequestInit);
      } catch { throw failure('request failed'); }
      const body = await jsonBody(response);
      if (body?.Status !== 0 || body.TC === true) throw failure('query failed or was truncated');
      if (!Array.isArray(body.Question) || body.Question.length !== 1 ||
          typeof body.Question[0]?.name !== 'string' || normalizeName(body.Question[0].name) !== normalizeName(hostname) ||
          body.Question[0].type !== type) throw failure('response question does not match');
      const answers = body.Answer ?? [];
      if (!Array.isArray(answers)) throw failure('response has invalid answers');
      const addresses: LookupAddress[] = [];
      let ttl = 60;
      for (const answer of answers) {
        ttl = Math.min(ttl, Number.isFinite(answer?.TTL) && answer.TTL >= 0 ? answer.TTL : 0);
        if (answer?.type !== 1 && answer?.type !== 28) continue;
        const family = answer.type === 1 ? 4 : 6;
        if (typeof answer.data !== 'string' || isIP(answer.data) !== family)
          throw failure('response has an invalid address');
        addresses.push({ address: answer.data, family });
      }
      return { addresses, ttl };
    }));
    return { addresses: records.flatMap(row => row.addresses), ttl: Math.min(...records.map(row => row.ttl)) };
  } finally { await dispatcher.destroy(); }
}

/** An explicit resolver avoids VPN Fake-IP DNS without weakening destination checks. */
export async function resolveHostname(hostname: string): Promise<LookupAddress[]> {
  const configured = process.env.FEEDGARDEN_DNS_OVER_HTTPS;
  if (!configured) return lookup(hostname, { all: true });
  let endpoint: URL;
  try { endpoint = new URL(configured); } catch { throw failure('endpoint must be a valid HTTPS URL'); }
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.hash)
    throw failure('endpoint requires HTTPS without credentials or fragments');
  const key = endpoint.href + '\n' + normalizeName(hostname), existing = cache.get(key);
  if (existing && existing.expires > Date.now()) return existing.result;
  const entry = { expires: Infinity, result: query(endpoint, hostname).then(({ addresses, ttl }) => {
    entry.expires = Date.now() + ttl * 1000;
    return addresses;
  }).catch(error => { if (cache.get(key) === entry) cache.delete(key); throw error; }) };
  cache.delete(key);
  cache.set(key, entry);
  if (cache.size > 512) cache.delete(cache.keys().next().value!);
  return entry.result;
}
