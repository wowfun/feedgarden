import { DateTime } from 'luxon';
import type { Source } from './config.js';
import { Store } from './store.js';
import type { Coverage, Item, Period, ReportSnapshot } from './types.js';

export function roundRobin(items: Item[], streams: string[], limit: number): Item[] {
  const buckets = streams.map(stream => items.filter(item => item.stream === stream).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id)));
  const selected: Item[] = []; const seen = new Set<string>();
  const offsets = buckets.map(() => 0);
  while (selected.length < limit) {
    let progressed = false;
    for (let index = 0; index < buckets.length && selected.length < limit; index++) {
      const bucket = buckets[index]!;
      while (offsets[index]! < bucket.length && seen.has(bucket[offsets[index]!]!.id)) offsets[index]!++;
      const item = bucket[offsets[index]!];
      if (!item) continue;
      offsets[index]!++; selected.push(item); seen.add(item.id); progressed = true;
    }
    if (!progressed) break;
  }
  return selected;
}
export function relevance(item: Item, topics: string[]): number {
  const title = item.title.toLowerCase(); const body = item.text.toLowerCase();
  return topics.reduce((sum, topic) => sum + (title.includes(topic.toLowerCase()) ? 3 : body.includes(topic.toLowerCase()) ? 1 : 0), 0);
}
export function select(source: Source, period: Period, store: Store, limit: number, at: string, previous?: ReportSnapshot): ReportSnapshot {
  let candidates = store.items(source.id, period.start, period.end);
  const scores: Record<string, number> = { ...previous?.frozenScores };
  const observations = store.observations(source.id, source.id === 'producthunt' ? '' : period.start, at);
  if (source.id === 'github') {
    const inPeriod = observations.filter(item => item.observedAt < period.end);
    const daily = new Map<string, Item[]>();
    for (const item of inPeriod) {
      const date = DateTime.fromISO(item.observedAt).setZone(source.timezone).toISODate()!;
      const current = daily.get(date);
      if (!current || item.observedAt > current[0]!.observedAt) daily.set(date, [item]);
      else if (item.observedAt === current[0]!.observedAt) current.push(item);
    }
    const aggregate = new Map<string, Item>(); const rankScores = new Map<string, number>();
    for (const day of daily.values()) for (const item of day) {
      aggregate.set(item.id, item);
      rankScores.set(item.id, (rankScores.get(item.id) ?? 0) + 1 / Math.max(1, item.metrics.rank ?? 9999));
    }
    candidates = [...aggregate.values()];
    for (const item of candidates) scores[item.id] ??= rankScores.get(item.id)!;
  } else if (source.id === 'producthunt') {
    const unique = new Map<string, Item>();
    for (const item of observations) {
      const day = item.metadata?.leaderboardDate;
      const inPeriod = day ? String(day) >= period.date && String(day) < DateTime.fromISO(period.end).setZone(period.timezone).toISODate()! : item.publishedAt >= period.start && item.publishedAt < period.end;
      if (inPeriod) unique.set(item.id, item);
    }
    candidates = [...unique.values()];
  }
  if (source.id === 'x') candidates = candidates.filter(item => item.kind !== 'repost');
  if (source.id === 'arxiv') candidates = candidates.filter(item => relevance(item, source.topics) > 0);
  for (const item of candidates) {
    const seen = observations.filter(snapshot => snapshot.id === item.id);
    const highest = (key: 'score' | 'votes'): number | undefined => {
      const values = seen.map(snapshot => snapshot.metrics[key]).filter((value): value is number => typeof value === 'number');
      return values.length ? Math.max(...values) : undefined;
    };
    scores[item.id] ??= source.id === 'hackernews' ? highest('score') ?? item.metrics.score ?? 1 / (item.metrics.rank ?? 9999)
      : source.id === 'producthunt' ? period.frequency === 'daily' ? 1 / (item.metrics.rank ?? 9999) : highest('votes') ?? 1 / (item.metrics.rank ?? 9999)
      : source.id === 'arxiv' ? relevance(item, source.topics) : Date.parse(item.publishedAt);
  }
  let selected: Item[];
  if (source.id === 'x' || source.id === 'reddit') selected = roundRobin(candidates, source.streams.map(stream => stream.id), limit);
  else selected = candidates.sort((a, b) => (scores[b.id]! - scores[a.id]!) || (b.metrics.comments ?? 0) - (a.metrics.comments ?? 0) || b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id)).slice(0, limit);
  const notes = new Set<string>();
  const states = store.states().filter(state => state.source === source.id);
  for (const stream of source.streams) {
    const current = states.filter(state => state.stream === stream.id);
    const latest = current.map(state => state.last_attempt).sort().at(-1);
    const accepted = stream.channels.map(channel => current.find(state => state.channel === channel.id && state.last_attempt === latest && ['complete', 'partial'].includes(state.status))).find(Boolean);
    if (!accepted) notes.add(`${stream.id}: unavailable at latest collection.`);
    else if (accepted.status !== 'complete') for (const note of JSON.parse(accepted.notes) as string[]) notes.add(`${stream.id}: ${note}`);
  }
  const sourceFirst = store.db.prepare('SELECT MIN(first_seen) AS at FROM items WHERE source=?').get(source.id) as { at: string | null };
  if (['hackernews', 'github', 'reddit', 'x'].includes(source.id) && sourceFirst.at && sourceFirst.at > period.start) notes.add(`Collection began ${sourceFirst.at}; historical coverage is limited.`);
  if (source.id === 'arxiv') notes.add('Papers are grouped by first submission date; announcement and revision dates can differ.');
  const coverage: Coverage = { status: notes.size ? 'partial' : 'complete', from: period.start, to: period.end, notes: [...notes] };
  return { period, items: selected, coverage, createdAt: at, frozenScores: scores };
}
