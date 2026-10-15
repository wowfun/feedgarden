import { DateTime } from 'luxon';
import type { Config, Source } from './config.js';
import type { Store } from './store.js';
import type { Item, RankingObservation, RankingWindow } from './types.js';
import type { ArchiveIssue } from './archives.js';
import { rankingObservation } from './scoring.js';
import { hash, isoDate, nowIso } from './util.js';

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
export function selectionClause(alias: string, existing = false): string {
  return `(NOT EXISTS(SELECT 1 FROM feed_meta WHERE key='selection_policy:'||${alias}.source) OR ${existing ? 'NOT EXISTS' : 'EXISTS'}(SELECT 1 FROM feed_selection s WHERE s.source=${alias}.source AND s.id=${alias}.id AND s.selected=${existing ? 0 : 1}))`;
}
export function* iterateCandidatesFor(store: Store, source: Source, range?: SelectionRange): IterableIterator<Candidate> {
  // Separate indexed date ranges honor offsets without scanning/parsing cold
  // history. Queued identities with existing selections also admit corrections
  // into a frozen day; their unchanged historical rows are discarded below.
  const candidates = range ? `WITH candidates AS (
    SELECT id FROM items WHERE source=? AND julianday(published_at)>=julianday(?) AND julianday(published_at)<julianday(?) AND json_extract(data,'$.basis')!='observed'
    UNION SELECT id FROM items WHERE source=? AND julianday(first_seen)>=julianday(?) AND julianday(first_seen)<julianday(?) AND json_extract(data,'$.basis')='observed'
    UNION SELECT p.id FROM feed_planning p JOIN feed_selection s ON s.source=p.source AND s.id=p.id WHERE p.source=? AND p.id>?
  ) ` : '';
  const query = store.db.prepare(candidates + `SELECT i.id,i.data,i.first_seen,r.data ranking,s.day selected_day,s.selected,
    (a.id IS NOT NULL OR f.id IS NOT NULL) existing
    FROM items i
    LEFT JOIN feed_rankings r ON r.source=i.source AND r.id=i.id
    LEFT JOIN feed_selection s ON s.source=i.source AND s.id=i.id
    LEFT JOIN feed_archives a ON a.source=i.source AND a.id=i.id
    LEFT JOIN feed_summaries f ON f.source=i.source AND f.id=i.id
    LEFT JOIN feed_excluded e ON e.source=i.source AND e.id=i.id
    WHERE i.source=? AND e.id IS NULL AND i.id>? ${range ? 'AND i.id IN (SELECT id FROM candidates)' : ''} ORDER BY i.id LIMIT 128`);
  let cursor = '';
  while (true) {
    const args = range ? [source.id, range.start, range.end, source.id, range.start, range.end, source.id, cursor, source.id, cursor] : [source.id, cursor];
    const rows = query.all(...args) as { id: string; data: string; first_seen: string; ranking: string | null; selected_day: string | null; selected: number | null; existing: number }[];
    if (!rows.length) return;
    for (const row of rows) {
      const item = JSON.parse(row.data) as Item, day = selectionDay(item, row.first_seen, source.timezone);
      cursor = row.id;
      if (range && (day < range.firstDay || day > range.lastDay) && (!row.selected_day || row.selected_day === day)) continue;
      const observed = row.ranking ? JSON.parse(row.ranking) as RankingObservation : rankingObservation(item);
      const ranking = observed?.method === source.selection?.method ? observed : undefined;
      yield { item, firstSeen: row.first_seen, day, ranking, inactive: item.metadata?.rankingInactive === true,
        selectedDay: row.selected_day ?? undefined, selected: row.selected === null ? undefined : row.selected === 1, existing: row.existing === 1 };
    }
  }
}
export function candidatesFor(store: Store, source: Source, range?: SelectionRange): Candidate[] { return [...iterateCandidatesFor(store, source, range)]; }
export function reconcileSelection(config: Config, store: Store, options: { source?: string; history?: boolean; at?: string; blocked?: Set<string>; signal?: AbortSignal } = {}): SelectionReport[] {
  const at = options.at ?? nowIso(), reports: SelectionReport[] = [];
  const archiveIssues = JSON.parse(store.meta('selection_archive_issues') ?? '[]') as ArchiveIssue[];
  store.assertLease();
  for (const source of config.sources.filter(source => source.enabled && (!options.source || source.id === options.source))) {
    options.signal?.throwIfAborted();
    if (!source.selection) {
      if (store.meta('selection_policy:' + source.id)) {
        store.db.prepare('DELETE FROM feed_meta WHERE key=?').run('selection_policy:' + source.id);
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
    const previousSelection = store.db.prepare('SELECT id FROM feed_selection WHERE source=? AND day=? AND selected=1 ORDER BY id');
    const appliedPolicy = store.db.prepare('SELECT policy FROM feed_selection_days WHERE source=? AND day=?');
    const move = store.db.prepare('UPDATE feed_selection SET day=?,selected=0 WHERE source=? AND id=?');
    const removePlanning = store.db.prepare('DELETE FROM feed_planning WHERE source=? AND id=?');
    const snapshots = new Set((store.db.prepare('SELECT stream,window FROM feed_rank_snapshots WHERE source=?').all(source.id) as { stream: string; window: string }[]).map(row => row.stream + '/' + row.window));
    const oldSelection = store.db.prepare('SELECT id,day,selected,score,method,scored_at FROM feed_selection WHERE source=? AND day=?');
    const upsert = store.db.prepare('INSERT INTO feed_selection VALUES (?,?,?,?,?,?,?) ON CONFLICT(source,id) DO UPDATE SET day=excluded.day,selected=excluded.selected,score=excluded.score,method=excluded.method,scored_at=excluded.scored_at');
    const enqueue = store.db.prepare("INSERT INTO feed_planning VALUES (?,?,'') ON CONFLICT(source,id) DO UPDATE SET due_at=''");
    const removeSelection = store.db.prepare('DELETE FROM feed_selection WHERE source=? AND id=?');
    const saveDay = store.db.prepare('INSERT INTO feed_selection_days VALUES (?,?,?,?) ON CONFLICT(source,day) DO UPDATE SET policy=excluded.policy,updated_at=excluded.updated_at');
    store.setMeta('selection_policy:' + source.id, policy);
    if (!options.history) store.db.transaction(() => {
      for (const candidate of candidates) {
        if (candidate.day >= earliest && candidate.day <= today) continue;
        if (candidate.selectedDay && candidate.selectedDay !== candidate.day) {
          move.run(candidate.day, source.id, candidate.item.id);
          removePlanning.run(source.id, candidate.item.id);
          candidate.selected = false;
          store.setMeta('content_version', String(Number(store.meta('content_version')) + 1));
        }
      }
    })();
    for (const [day, group] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
      options.signal?.throwIfAborted();
      const previous = previousSelection.all(source.id, day) as { id: string }[];
      const initialized = appliedPolicy.get(source.id, day) as { policy: string } | undefined;
      const retained = initialized ? previous.map(row => row.id) : group.filter(row => row.selected !== false && row.existing).map(row => row.item.id);
      const report: SelectionReport = { source: source.id, day, candidates: group.length, unknown: group.filter(row => !row.ranking && !row.inactive).length, method: source.selection.method, status: 'selected', kept: [], notes: [] };
      const inactive = group.filter(row => row.inactive);
      if (inactive.length) report.notes.push(`${inactive.length} HN stories marked dead/deleted by the official API are excluded; private archive copies remain stored.`);
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
      store.db.transaction(() => {
        store.assertLease();
        let changed = false;
        const oldRows = oldSelection.all(source.id, day) as { id: string; day: string; selected: number; score: number | null; method: string; scored_at: string | null }[];
        const old = new Map(oldRows.map(row => [row.id, row]));
        for (const candidate of ordered) {
          const row = { id: candidate.item.id, day, selected: kept.has(candidate.item.id) ? 1 : 0, score: candidate.ranking?.score ?? null, method: source.selection!.method, scored_at: candidate.ranking?.observedAt ?? null };
          if (JSON.stringify(row) !== JSON.stringify(old.get(row.id))) {
            upsert.run(source.id, row.id, row.day, row.selected, row.score, row.method, row.scored_at);
            changed = true;
          }
          if (row.selected && old.get(row.id)?.selected !== 1) enqueue.run(source.id, row.id);
          if (!row.selected) removePlanning.run(source.id, row.id);
        }
        // Date corrections must not leave a previously selected ID behind in its old day.
        const identities = new Set(group.map(candidate => candidate.item.id));
        for (const row of oldRows) if (!identities.has(row.id)) {
          removeSelection.run(source.id, row.id); changed = true;
        }
        saveDay.run(source.id, day, policy, at);
        if (changed) store.setMeta('content_version', String(Number(store.meta('content_version')) + 1));
      })();
      reports.push(report);
    }
  }
  return reports;
}
