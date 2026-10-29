import type { RawResponse } from '../../contracts/items.js';
export interface HostCoordinator {
  reserve(host: string, spacing: number): number;
  cooldown(host: string, until: string): void;
  close?(): void;
}
export interface ResponseCache {
  cache(url: string): RawResponse | undefined;
  cacheHeaders(url: string): Record<string, string> | undefined;
  saveCache(response: RawResponse): void;
  transport?: HostCoordinator;
}
