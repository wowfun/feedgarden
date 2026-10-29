import type { Metrics, RankingObservation, RawResponse } from '../contracts/items.js';
import type { DatabaseSession } from './database.js';
export interface SummaryAcceptance { source: string; id: string; key: string; copy: string; topics: string; admitted: boolean; accepted: string; at: string }
export interface SummaryIdentity { source: string; id: string; key: string }
export function acceptSummaries(store: DatabaseSession, batch: string, rows: SummaryAcceptance[]): void {
  store.db.transaction(() => {    
store.assertLease(); for (const row of rows) {
      store.jobs.cache(row.key, row.copy); store.jobs.cacheTopics(row.key, row.topics);
      store.jobs.acceptState(row.admitted ? 'ready' : 'cached', row.source, row.id, row.key);
      if (row.admitted) store.jobs.acceptSummary(row.source, row.id, row.key, row.accepted, row.at);
    } store.batches.accept(batch);  
})();
}
export function rejectCachedSummaries(store: DatabaseSession, rows: SummaryIdentity[], error: string): void {
  store.db.transaction(() => { for (const row of rows) { store.jobs.removeCache(row.key); store.jobs.removeCacheTopics(row.key); store.jobs.rejectArtifact(error, row.source, row.id); } })();
}
export function startSummaryAttempt(store: DatabaseSession, batch: string, workspace: string, rows: SummaryIdentity[]): void {
  store.db.transaction(() => { for (const row of rows) store.jobs.countAttempt(row.source, row.id); store.batches.start(workspace, batch); })();
}
export function failSummaryBatch(store: DatabaseSession, batch: string, error: string, rows: { source: string; id: string; state: string; next: string }[]): void {
  store.db.transaction(() => { for (const row of rows) store.jobs.backoff(row.state, row.next, error, row.source, row.id); store.batches.fail(error, batch); })();
}
export function recordPublications(store: DatabaseSession, identities: Iterable<[string, string]>, initialize = false, signal?: AbortSignal): void {
  store.db.transaction(() => { store.assertLease(); signal?.throwIfAborted(); for (const [source, id] of identities) store.projections.publish(source, id); if (initialize) store.setMeta('publications_initialized', '1'); })();
}
export interface SelectionRow { id: string; day: string; selected: number; score: number | null; method: string; scored_at: string | null }
export function commitSelection(store: DatabaseSession, source: string, day: string, policy: string, at: string, rows: SelectionRow[]): void {
  store.db.transaction(() => {    
store.assertLease(); let changed = false;
    const oldRows = store.selection.day(source, day), old = new Map(oldRows.map(row => [row.id, row]));
    for (const row of rows) {      
if (JSON.stringify(row) !== JSON.stringify(old.get(row.id))) { store.selection.save(source, row.id, row.day, row.selected, row.score, row.method, row.scored_at); changed = true; }
      if (row.selected && old.get(row.id)?.selected !== 1) store.selection.enqueue(source, row.id);
      if (!row.selected) store.jobs.removePlanning(source, row.id);
    }
    const identities = new Set(rows.map(row => row.id));
    for (const row of oldRows) if (!identities.has(row.id)) { store.selection.remove(source, row.id); changed = true; }
    store.selection.saveDay(source, day, policy, at); if (changed) store.setMeta('content_version', String(Number(store.meta('content_version')) + 1));
  })();
}
export function moveSelections(store: DatabaseSession, source: string, rows: { id: string; day: string }[]): void {
  store.db.transaction(() => { for (const row of rows) { store.selection.move(row.day, source, row.id); store.jobs.removePlanning(source, row.id); store.setMeta('content_version', String(Number(store.meta('content_version')) + 1)); } })();
}

export interface RankingEvidence { source: string; id: string; stream: string; channel?: string; raw?: RawResponse; inactive?: boolean; ranking?: RankingObservation; metrics?: Metrics }
export function recordRankings(store: DatabaseSession, rows: RankingEvidence[], snapshot?: { source: string; stream: string; window: string; at: string }, signal?: AbortSignal): void {
  store.db.transaction(() => {    
store.assertLease(); signal?.throwIfAborted();
    if (snapshot) store.saveRankSnapshot(snapshot.source, snapshot.stream, snapshot.window, snapshot.at);
    for (const row of rows) {      
if (row.raw && row.channel) store.saveRaw(row.source, row.stream, row.channel, row.raw);
      if (row.inactive && row.raw) store.markRankingInactive(row.source, row.id, row.raw.fetchedAt);
      else if (row.ranking) store.updateRankingItem(row.source, row.id, row.ranking, row.metrics!);
    }
  })();
}
export function replaceRelations(store: DatabaseSession, rows: { key: string; leftPath: string; rightPath: string; leftHash: string; rightHash: string; output: string; expiresAt: string }[]): void {
  store.db.transaction(() => { for (const row of rows) store.projections.saveRelation(row.key, row.leftPath, row.rightPath, row.leftHash, row.rightHash, row.output, row.expiresAt); })();
}
