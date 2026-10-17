# Podcasts

## Episode discovery

The `podcast` source discovers configured shows through RSS; this repository currently configures six follow-builders shows. Its `podcast-rss` channel requires `url` and `podcastName`; episode IDs combine the stream and RSS GUID. Atom podcast feeds are not supported by this channel. Episode links take precedence over audio enclosures; missing links fall back to the recording. Namespaced iTunes fields are parsed independently.

RSS provides a finite episode window, so podcast collections report partial coverage and record that limitation in `gaps`. A successful partial collection still advances the normal collection interval; it does not imply a failed request or a complete historical backfill.

## Complete transcripts

Public RSS transcripts (plain text/VTT) are preferred, followed by exact show-name and GUID matches in follow-builders. No transcription service is invoked. Complete transcripts are privately retained, split into contiguous segments of at most 12,000 characters, summarized to at most 1,500 characters each, then recursively reduced in groups of up to eight. Every segment is processed before the final bilingual summary. Missing transcripts use show notes, with the basis displayed. Saved transcripts and accepted summaries survive later feed removals or transient fetch failures. Tail changes invalidate the full transcript recipe.

`agent.maxTranscriptChunks` defaults to 64. A transcript that needs more input segments stops before any model attempt, retains the complete evidence and reports the limit. Raise that explicit budget and use `--retry-failed` to process it. Transcripts are never silently truncated. JSON escaping counts toward `maxInputChars`; smaller budgets reduce segment and intermediate-note sizes so the reduction still converges. See the [configuration schema](../schemas/feedgarden.schema.json) for supported limits.

Each scheduler visit advances at most one transcript node before rotating sources. Episode summaries use a single-item batch to keep their transcript dependency fixed. A quota-deferred episode does not prevent other sources from accepting valid cached summaries. The follow-builders fallback is fetched and indexed once per preparation run.

## Budget and recovery

Summary, transcript and relation tasks share the existing daily 80-call budget, timeout, artifact validation and retry rules. Intermediate tasks retain fixed inputs and recover saved artifacts before another paid attempt. Database and file artifacts are both revalidated. A rejected database cache first tries the saved file, then regenerates under the same quota and paid-attempt limit; exhausted tasks require `--retry-failed`. Transcript planning treats rejected nodes as cache misses without making model calls. `doctor` shows intermediate task counts. Cancellation records the attempted call but adds no failure backoff; lease loss propagates immediately without changing task retry state. Attempts already made still count toward the daily and per-task limits. Exhausted quota retains pending work.

At the default 24,000-character input budget, a plain 127,000-character transcript needs 11 segment calls, two reduction calls and one final reduction call, followed by one bilingual summary call: 15 calls before retries. The default ceiling of 64 full 12,000-character segments needs 64 + 8 + 1 reduction calls and one summary call: 74 calls. Escaping, newline boundaries and smaller configured budgets change segment counts; saved nodes avoid repeating completed calls.

`--refresh` fetches evidence again and reuses accepted reduction nodes if the transcript is unchanged. `--rebuild` invalidates reduction recipes only for episodes eligible in that invocation, honoring the source, `--since`, cutoff, selection and exclusion filters. Other episodes keep their cached nodes. `--retry-failed` retries failed stages while retaining accepted nodes.

## Related documentation

- [Sources](sources.md)
- [Summaries and content](summaries.md)
- [Related coverage](related-items.md)
