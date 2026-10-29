import { isIP } from 'node:net';
import { EnvHttpProxyAgent, Pool } from 'undici';
import type { PublicTarget } from './destination.js';

// Route by the original origin so Undici retains HTTP(S)_PROXY / NO_PROXY
// semantics. The selected pool connects (or CONNECTs) to the validated IP.
// Host and TLS servername remain the original hostname, with normal CA checks.
// Each validated request/redirect owns its dispatcher. Reusing a hostname pool
// across DNS checks could bypass the current request's destination pinning.
export function publicDispatcher(target: PublicTarget, options: EnvHttpProxyAgent.Options = {}): EnvHttpProxyAgent {
  const original = new URL(target.url), pinned = new URL(original.origin);
  // Undici's SOCKS transport constructs its own pools and bypasses factory.
  // Do not allow that route to resolve an untrusted destination a second time.
  const proxies = [options.httpProxy ?? process.env.http_proxy ?? process.env.HTTP_PROXY, options.httpsProxy ?? process.env.https_proxy ?? process.env.HTTPS_PROXY];
  if ((options.noProxy ?? process.env.no_proxy ?? process.env.NO_PROXY) !== '*') {
    for (const proxy of proxies) if (proxy && !['http:', 'https:'].includes(new URL(proxy).protocol)) throw new Error('Public article requests require an HTTP(S) proxy for destination pinning');
  }
  const hostname = original.hostname.replace(/^\[|\]$/g, ''), servername = isIP(hostname) ? undefined : hostname;
  pinned.hostname = target.address.includes(':') ? '[' + target.address + ']' : target.address;
  return new EnvHttpProxyAgent({
    ...options,
    proxyTunnel: true,
    connect: { ...(typeof options.connect === 'object' ? options.connect : {}), servername },
    requestTls: { ...options.requestTls, servername },
    factory(origin, poolOptions) {
      if (new URL(origin).origin !== original.origin) throw new Error('Public dispatcher origin mismatch');
      return new Pool(pinned.origin, poolOptions).compose(dispatch => (request, handler) => {
        // Fetch implementations may discard a caller-supplied Host header.
        // Restore it at the dispatcher boundary, after Fetch normalization.
        const headers: string[] = [];
        if (Array.isArray(request.headers)) {
          for (let i = 0; i < request.headers.length; i += 2) {
            if (request.headers[i]!.toLowerCase() !== 'host') headers.push(request.headers[i]!, request.headers[i + 1]!);
          }
        } else {
          for (const [key, value] of Object.entries(request.headers ?? {})) {
            if (key.toLowerCase() !== 'host' && value !== undefined) for (const part of Array.isArray(value) ? value : [value]) headers.push(key, part);
          }
        }
        headers.push('host', original.host);
        return dispatch({ ...request, headers }, handler);
      });
    },
  });
}
