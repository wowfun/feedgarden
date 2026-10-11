import { lookup } from 'node:dns/promises';
import type { LookupAddress } from 'node:dns';
import { BlockList, isIP } from 'node:net';
import { safeUrl } from './util.js';

const blocked4 = new BlockList(), blocked6 = new BlockList(), global6 = new BlockList();
global6.addSubnet('2000::', 3, 'ipv6');
for (const [address, prefix] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4]] as const) blocked4.addSubnet(address, prefix, 'ipv4');
// IPv6 article endpoints must be global unicast, excluding documentation,
// protocol identifiers and transports that can embed an unchecked IPv4 target.
for (const [address, prefix] of [['2001::', 32], ['2001:2::', 48], ['2001:10::', 28], ['2001:20::', 28], ['2001:30::', 28], ['2001:db8::', 32], ['2002::', 16], ['3fff::', 20]] as const) blocked6.addSubnet(address, prefix, 'ipv6');
export function publicAddress(address: string): boolean {
  const family = isIP(address);
  return family === 4 ? !blocked4.check(address, 'ipv4') : family === 6 && global6.check(address, 'ipv6') && !blocked6.check(address, 'ipv6');
}
export type PublicResolver = (hostname: string) => Promise<LookupAddress[]>;
export interface PublicTarget { url: string; address: string }
export async function resolvePublicTarget(value: string, resolve: PublicResolver = hostname => lookup(hostname, { all: true })): Promise<PublicTarget> {
  const normalized = safeUrl(value), url = new URL(normalized), hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (url.port || !hostname.includes('.') && !isIP(hostname) || /(?:^|\.)(localhost|local|internal|test|invalid)$/.test(hostname)) throw new Error('Article URL is not a public web endpoint');
  const addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await resolve(hostname);
  if (!addresses.length || addresses.some(row => !publicAddress(row.address))) throw new Error('Article URL resolves to a non-public address');
  // Prefer IPv4 when both families are available; each retry resolves afresh.
  return { url: normalized, address: (addresses.find(row => isIP(row.address) === 4) ?? addresses[0]!).address };
}
export async function assertPublicUrl(value: string, resolve?: PublicResolver): Promise<string> {
  return (await resolvePublicTarget(value, resolve)).url;
}
