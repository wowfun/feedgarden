import { DateTime } from 'luxon';
import type { ArchiveIssue } from '../../contracts/archives.js';
import type { Source } from '../../contracts/configuration.js';
import type { Item, RankingObservation, RankingWindow } from '../../contracts/items.js';
import { rankingObservation } from '../../contracts/scoring.js';
import { isoDate } from '../../contracts/time.js';
import type { InstanceContext } from '../../instance/index.js';
import { hash } from '../../platform/hash.js';
import { nowIso } from '../../platform/time.js';
import type { Storage } from '../../storage/index.js';

export interface Candidate { item: Item; firstSeen: string; day: string; ranking?: RankingObservation; inactive?: boolean; selectedDay?: string; selected?: boolean; existing?: boolean }
export interface SelectionRange { start: string; end: string; firstDay: string; lastDay: string }
export function selectionRange(source: Source, at: string): SelectionRange {
  const today = DateTime.fromISO(at).setZone(source.timezone).startOf('day');
  const first = today.minus({ days: (source.selection?.updateDays ?? 7) - 1 });
  return { start: first.toUTC().toISO()!, end: today.plus({ days: 1 }).toUTC().toISO()!, firstDay: isoDate(first), lastDay: isoDate(today) };
}
export interface SelectionReport { source: string; day: string; candidates: number; unknown: number; method: string; status: 'selected' | 'deferred' | 'frozen'; kept: string[]; notes: string[] }
// Bump revision when scoring, candidate grouping or tie rules change. Frozen
// days retain their prior policy until an explicit historical rerank.
export function selectionPolicy(source: Source): string | undefined { return source.selection ? hash({ ...source.selection, timezone: source.timezone, revision: 1 }) : undefined; }
export function selectionDay(item: Item, firstSeen: string, timezone: string): string {
  return isoDate(DateTime.fromISO(item.basis === 'observed' ? firstSeen : item.publishedAt).setZone(timezone), 'selection date');
}
export function historicalWindow(day: string, at: string, timezone: string): Exclude<RankingWindow, 'day'> {
  const age = DateTime.fromISO(at).setZone(timezone).startOf('day').diff(DateTime.fromISO(day, { zone: timezone }), 'days').days;
  // Reddit's t=week/month/year/all listings cover progressively older archives.
  return age < 7 ? 'week' : age < 30 ? 'month' : age < 365 ? 'year' : 'all';
}
export function orderCandidates(candidates: Candidate[]): Candidate[] {
  return candidates.map(candidate => ({ candidate, timestamp: Date.parse(candidate.item.basis === 'observed' ? candidate.firstSeen : candidate.item.publishedAt) })).sort((left, right) => {
    const a = left.candidate, b = right.candidate;
    if (!!a.ranking !== !!b.ranking) return a.ranking ? -1 : 1;
    const score = (b.ranking?.score ?? 0) - (a.ranking?.score ?? 0);
    if (score) return score;
    const date = right.timestamp - left.timestamp;
    return date || (a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0);
  }).map(row => row.candidate);
}
export function* iterateCandidatesFor(store: Storage, source: Source, range?: SelectionRange): IterableIterator<Candidate> {
  // Separate indexed date ranges honor offsets without scanning/parsing cold
  // history. Queued identities with existing selections also admit corrections
  // into a frozen day; their unchanged historical rows are discarded below.
  for (const row of store.selectionCandidates(source.id, range)) {
    const item = JSON.parse(row.data) as Item, day = selectionDay(item, row.first_seen, source.timezone);
    if (range && (day < range.firstDay || day > range.lastDay) && (!row.selected_day || row.selected_day === day)) continue;
    const observed = row.ranking ? JSON.parse(row.ranking) as RankingObservation : rankingObservation(item);
    const ranking = observed?.method === source.selection?.method ? observed : undefined;
    yield {
      item, firstSeen: row.first_seen, day, ranking, inactive: item.metadata?.rankingInactive === true,
      selectedDay: row.selected_day ?? undefined, selected: row.selected === null ? undefined : row.selected === 1, existing: row.existing === 1
    };
  }
}
export function candidatesFor(store: Storage, source: Source, range?: SelectionRange): Candidate[] { return [...iterateCandidatesFor(store, source, range)]; }
export function reconcileSelection(config: InstanceContext, store: Storage, options: { source?: string; history?: boolean; at?: string; blocked?: Set<string>; signal?: AbortSignal } = {}): SelectionReport[] {
  const at = options.at ?? nowIso(), reports: SelectionReport[] = [];
  const archiveIssues = JSON.parse(store.meta('selection_archive_issues') ?? '[]') as ArchiveIssue[];
  store.assertLease();
  for (const source of config.sources.filter(source => source.enabled && (!options.source || source.id === options.source))) {
    options.signal?.throwIfAborted();
    if (!source.selection) {
      if (store.meta('selection_policy:' + source.id)) {
        store.selection.forgetPolicy('selection_policy:' + source.id);
        store.setMeta('content_version', String(Number(store.meta('content_version')) + 1));
      }
      continue;
    }
    const policy = selectionPolicy(source)!;
    const range = selectionRange(source, at);
    const candidates = candidatesFor(store, source, options.history ? undefined : range), groups = new Map<string, Candidate[]>();
    for (const candidate of candidates) {
      const group = groups.get(candidate.day) ?? []; group.push(candidate); groups.set(candidate.day, group);
    }
    for (const issue of archiveIssues) if (issue.source === source.id && (options.history || issue.day >= range.firstDay && issue.day <= range.lastDay) && !groups.has(issue.day)) groups.set(issue.day, []);
    const earliest = range.firstDay, today = range.lastDay;
    const previousSelection = store.selection.selected;
    const appliedPolicy = store.selection.policy;
    const move = store.selection.move;
    const removePlanning = store.jobs.removePlanning;
    const snapshots = new Set((store.selection.snapshots(source.id) as { stream: string; window: string }[]).map(row => row.stream + '/' + row.window));
    const oldSelection = store.selection.day;
    const upsert = store.selection.save;
    const enqueue = store.selection.enqueue;
    const removeSelection = store.selection.remove;
    const saveDay = store.selection.saveDay;
    store.setMeta('selection_policy:' + source.id, policy);
    if (!options.history) {
      const moved = candidates.filter(candidate => (candidate.day < earliest || candidate.day > today) && candidate.selectedDay && candidate.selectedDay !== candidate.day);
      store.moveSelections(source.id, moved.map(candidate => ({ id: candidate.item.id, day: candidate.day })));
      for (const candidate of moved) candidate.selected = false;
    }
    for (const [day, group] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
      options.signal?.throwIfAborted();
      const previous = previousSelection(source.id, day) as { id: string }[];
      const initialized = appliedPolicy(source.id, day) as { policy: string } | undefined;
      const retained = initialized ? previous.map(row => row.id) : group.filter(row => row.selected !== false && row.existing).map(row => row.item.id);
      const report: SelectionReport = { source: source.id, day, candidates: group.length, unknown: group.filter(row => !row.ranking && !row.inactive).length, method: source.selection.method, status: 'selected', kept: [], notes: [] };
      const inactive = group.filter(row => row.inactive);
      if (inactive.length) report.notes.push(`${inactive.length} HN stories marked dead/deleted by the official API are excluded from candidate processing; published articles are retained.`);
      if (!options.history && (day < earliest || day > today)) {
        if (initialized && initialized.policy !== policy) report.notes.push('This frozen day retains the selection policy under which it was last ranked.');
        report.status = 'frozen'; report.kept = retained; reports.push(report); continue;
      }
      const issues = archiveIssues.filter(issue => issue.source === source.id && issue.day === day);
      report.candidates += issues.length; report.unknown += issues.length;
      report.notes.push(...issues.map(issue => issue.message));
      let unavailable = issues.length > 0 || options.blocked?.has(source.id + '/' + day);
      if (source.selection.method === 'hn-engagement') unavailable ||= report.unknown > 0;
      else {
        const window = options.history ? historicalWindow(day, at, source.timezone) : 'week';
        unavailable ||= group.some(({ item }) => !snapshots.has(item.stream + '/' + window));
      }
      if (unavailable) {
        report.status = 'deferred'; report.kept = retained; report.notes.push('Ranking evidence unavailable; the previous selection and existing archive remain unchanged.'); reports.push(report); continue;
      }
      const eligible = orderCandidates(group.filter(row => !row.inactive)), ordered = [...eligible, ...inactive], kept = new Set(eligible.slice(0, source.selection.dailyLimit).map(row => row.item.id));
      report.kept = [...kept];
      store.commitSelection(source.id, day, policy, at, ordered.map(candidate => ({ id: candidate.item.id, day, selected: kept.has(candidate.item.id) ? 1 : 0, score: candidate.ranking?.score ?? null, method: source.selection!.method, scored_at: candidate.ranking?.observedAt ?? null })));
      reports.push(report);
    }
  }
  return reports;
}
