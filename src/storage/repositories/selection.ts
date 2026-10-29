import type Database from '../sqlite.js';
import { statements } from '../statements.js';
export function selectionRepository(db: Database) {
  const statement = statements(db);
  return {
    forgetPolicy: (key: string) => statement("DELETE FROM feed_meta WHERE key=?").run(key),
    selected: (source: string, day: string): { id: string }[] => statement("SELECT id FROM feed_selection WHERE source=? AND day=? AND selected=1 ORDER BY id").all(source, day) as { id: string }[],
    policy: (source: string, day: string): { policy: string } | undefined => statement("SELECT policy FROM feed_selection_days WHERE source=? AND day=?").get(source, day) as { policy: string } | undefined,
    move: (day: string, source: string, id: string) => statement("UPDATE feed_selection SET day=?,selected=0 WHERE source=? AND id=?").run(day, source, id),
    snapshots: (source: string): { stream: string; window: string }[] => statement("SELECT stream,window FROM feed_rank_snapshots WHERE source=?").all(source) as { stream: string; window: string }[],
    day: (source: string, day: string): { id: string; day: string; selected: number; score: number | null; method: string; scored_at: string | null }[] => statement("SELECT id,day,selected,score,method,scored_at FROM feed_selection WHERE source=? AND day=?").all(source, day) as { id: string; day: string; selected: number; score: number | null; method: string; scored_at: string | null }[],
    save: (source: string, id: string, day: string, selected: number, score: number | null, method: string, scoredAt: string | null) => statement("INSERT INTO feed_selection VALUES (?,?,?,?,?,?,?) ON CONFLICT(source,id) DO UPDATE SET day=excluded.day,selected=excluded.selected,score=excluded.score,method=excluded.method,scored_at=excluded.scored_at").run(source, id, day, selected, score, method, scoredAt),
    enqueue: (source: string, id: string) => statement("INSERT INTO feed_planning VALUES (?,?,'') ON CONFLICT(source,id) DO UPDATE SET due_at=''").run(source, id),
    remove: (source: string, id: string) => statement("DELETE FROM feed_selection WHERE source=? AND id=?").run(source, id),
    saveDay: (source: string, day: string, policy: string, updatedAt: string) => statement("INSERT INTO feed_selection_days VALUES (?,?,?,?) ON CONFLICT(source,day) DO UPDATE SET policy=excluded.policy,updated_at=excluded.updated_at").run(source, day, policy, updatedAt),
  };
}
export type SelectionRepository = ReturnType<typeof selectionRepository>;
