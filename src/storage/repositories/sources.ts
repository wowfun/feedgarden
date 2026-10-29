import type Database from '../sqlite.js';
import { statements } from '../statements.js';
export function sourcesRepository(db: Database) {
  const statement = statements(db);
  return {
    findItem: (source: string, id: string): { data: string } | undefined => statement("SELECT data FROM items WHERE source=? AND id=?").get(source, id) as { data: string } | undefined,
    hasItem: (source: string, id: string): object | undefined => statement("SELECT 1 FROM items WHERE source=? AND id=?").get(source, id) as object | undefined,
    discoveryCheck: (source: string, stream: string, url: string): { checked_at: string } | undefined => statement("SELECT checked_at FROM feed_discovery_skips WHERE source=? AND stream=? AND url=?").get(source, stream, url) as { checked_at: string } | undefined,
    skipDiscovery: (source: string, stream: string, url: string, reason: string, at: string) => statement("INSERT OR REPLACE INTO feed_discovery_skips(source,stream,url,reason,checked_at) VALUES (?,?,?,?,?)").run(source, stream, url, reason, at),
    forgetDiscovery: (source: string, stream: string, url: string) => statement("DELETE FROM feed_discovery_skips WHERE source=? AND stream=? AND url=?").run(source, stream, url),
    // Node 24's TEXT result conversion stops at NUL. Reading UTF-8 bytes keeps
    // the complete evidence without changing its stored TEXT representation.
    transcript: (source: string, id: string): { body: string; hash: string; url: string; updated_at: string } | undefined => {
      const row = statement('SELECT CAST(body AS BLOB) body,hash,url,updated_at FROM podcast_transcripts WHERE source=? AND id=?').get(source, id) as { body: Buffer; hash: string; url: string; updated_at: string } | undefined;
      return row && { ...row, body: row.body.toString('utf8') };
    },
    saveTranscript: (source: string, id: string, body: string, hash: string, url: string, updatedAt: string) => statement("INSERT OR REPLACE INTO podcast_transcripts VALUES (?,?,?,?,?,?)").run(source, id, body, hash, url, updatedAt),
    transcriptSize: (source: string, id: string): { hash: string; bytes: number } | undefined => statement("SELECT hash,length(CAST(body AS BLOB)) bytes FROM podcast_transcripts WHERE source=? AND id=?").get(source, id) as { hash: string; bytes: number } | undefined,
    transcriptBody: (source: string, id: string): { body: string } => ({ body: (statement('SELECT CAST(body AS BLOB) body FROM podcast_transcripts WHERE source=? AND id=?').get(source, id).body as Buffer).toString('utf8') }),
    transcriptHash: (source: string, id: string): { hash: string } | undefined => statement("SELECT hash FROM podcast_transcripts WHERE source=? AND id=?").get(source, id) as { hash: string } | undefined,
    hasExplicitSource: (inboxSource: string, admittedSource: string): object | undefined => statement("SELECT 1 FROM fdg_inbox WHERE source=? UNION SELECT 1 FROM fdg_admissions WHERE source=?").get(inboxSource, admittedSource) as object | undefined,
    explicitSources: (): { source: string }[] => statement("SELECT source FROM fdg_inbox UNION SELECT source FROM fdg_admissions").all() as { source: string }[],
    admittedSources: (filter: string | null, source: string | null): { source: string }[] => statement("SELECT DISTINCT a.source FROM fdg_admissions a WHERE (? IS NULL OR a.source=?)").all(filter, source) as { source: string }[],
    hasPendingAdmission: (source: string): object | undefined => statement("SELECT 1 FROM fdg_admissions WHERE source=? AND accepted_at IS NULL").get(source) as object | undefined,
    completeAdmissions: (at: string) => statement("UPDATE fdg_admissions SET accepted_at=? WHERE EXISTS(SELECT 1 FROM feed_jobs j WHERE j.source=fdg_admissions.source AND j.id=fdg_admissions.id AND j.state='ready')").run(at),
  };
}
export type SourcesRepository = ReturnType<typeof sourcesRepository>;
