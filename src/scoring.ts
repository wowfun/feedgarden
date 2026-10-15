import type { Item, RankingObservation, RankingWindow } from './types.js';

export function hnScore(points: unknown, comments: unknown): number | undefined {
  if (typeof points !== 'number' || !Number.isFinite(points) || typeof comments !== 'number' || !Number.isFinite(comments)) return undefined;
  return 0.75 * Math.log1p(Math.max(0, points)) + 0.25 * Math.log1p(Math.max(0, comments));
}
export function redditScore(rank: number, size: number): number {
  if (!Number.isSafeInteger(rank) || !Number.isSafeInteger(size) || rank < 1 || size < rank) throw new Error('Invalid Reddit ranking position or sample size');
  return 100 * (size - rank + 1) / size;
}
export function redditRanking(rank: number, size: number, observedAt: string, window: RankingWindow): RankingObservation {
  return { method: 'reddit-rss-percentile', score: redditScore(rank, size), rank, size, observedAt: new Date(observedAt).toISOString(), window };
}
export function rankingObservation(item: Item): RankingObservation | undefined {
  if (item.source === 'hackernews') {
    const score = hnScore(item.metrics.score, item.metrics.comments);
    return score === undefined ? undefined : { method: 'hn-engagement', score, observedAt: new Date(item.observedAt).toISOString() };
  }
  const ranking = item.ranking;
  if (item.source === 'reddit' && ranking?.method === 'reddit-rss-percentile' && ranking.window && ranking.rank !== undefined && ranking.size !== undefined) {
    return redditRanking(ranking.rank, ranking.size, ranking.observedAt, ranking.window);
  }
  return undefined;
}
