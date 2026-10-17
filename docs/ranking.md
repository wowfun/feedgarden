# Daily ranking

## Scoring and the update window

Reddit and Hacker News each publish at most 50 items per Shanghai publication day. Their optional `source.selection` specifies `method`, `dailyLimit` (default 50) and `updateDays` (default 7, including today). HN uses `0.75 * ln(1 + max(score, 0)) + 0.25 * ln(1 + max(comments, 0))`, without age decay; unavailable counters remain unknown. Reddit collects each community's weekly `top.rss?t=week&limit=100` and scores its original position `r` in an `N`-entry sample as `100 * (N-r+1)/N`. All communities compete for the same daily 50 places. This is relative RSS sample popularity, not measured votes or a complete community percentile. Ordinary `new` feed order is never used as heat. Scored items come first; unknown Reddit rankings fill remaining places by newest publication. Equal scores use newest publication, then native ID ascending. Earlier days freeze after leaving the update window. Raw candidates, observations, ranking evidence and accepted copies remain private; dropped items stop enrichment and new ACP calls, and returning items reuse accepted copies and stable path numbers. A failed request preserves its last valid ranking; rate-limit cooldowns are retained for subsequent ranking commands.

The seven-day update window means seven Shanghai calendar dates including today, rather than a rolling 168 hours. Newly discovered posts dated before that window stay private until an explicit `rank --history --source ID`, even if a weekly RSS sample still includes them. For example, at October 13 00:01 in Shanghai the active dates are October 7-13; a post from October 6 00:02 remains private although it is less than 168 hours old. Existing historical selections stay frozen.

## Ranking evidence and frozen days

Ordinary selection reads the active source-local dates through indexed UTC instants in pages of 128 records; queued date corrections also revisit affected identities. Historical ranking deliberately visits older records. HN fetches up to eight stories concurrently and commits each batch's evidence, selection scores and native metrics together, with an unexpired-lease check at the transaction boundary. Older cached observations cannot overwrite newer metrics or revive a more recent dead/deleted state. Historical Reddit feeds update only posts assigned to the requested week/month/year/all window. A valid empty RSS ranking leaves posts unscored and uses the chronological fallback; malformed or failed responses defer the day. Private exclusion markers apply to imported archives as well as generated summaries. Materialized daily selections preserve frozen days and the previous selection during failures; sorting the latest scores at render time would lose those guarantees.

Ranking updates use their evidence timestamp and must not be older than the stored ranking, item observation, embedded ranking, or HN inactive check. Older cached evidence is ignored. Selection policy revisions change deliberately when scoring/grouping/tie rules change; frozen days keep their recorded policy until historical reranking.

## Ranking commands

```sh
npm run feedgarden -- rank --history --dry-run
npm run feedgarden -- rank --history
npm run feedgarden -- rank --history --source hackernews
```

`rank` refreshes ranking evidence for the active date window; `--history` also reselects older archives. `--dry-run` uses an isolated temporary database and leaves the real database, queues, locks and content unchanged. Reports include candidate counts, unknown rankings, scoring method, kept IDs and deferred days. Before the first archive import, a database and content backup is saved below `.local/ranking-backups/` (or the configured storage directory). Existing bilingual bodies and numbers are imported without regeneration, and other source files remain byte-for-byte intact. Historical Reddit IDs are matched against week/month/year/all RSS for dates less than 7/30/365 days old or older, respectively; unmatched IDs remain unknown. HN stories explicitly marked dead/deleted by the official API are excluded while their private copies remain stored. Fetch failures defer the affected day rather than deleting its archive. Historical scores describe currently available evidence, not the original day's heat. Applying a rank command renders both languages locally and does not publish. Deferred days produce exit code 1 and can be retried after their cooldown.

## Example: the 2026-10-09 reranking

The local `2026-10-09` reranking keeps 50 of 329 Reddit candidates and 50 of 129 HN candidates. Removing 358 items means 716 bilingual output files are removed; their original bodies and candidates remain private. SQLite is the runner's durable source for candidates, evidence, selection and archive bodies, and is intentionally gitignored. Keep its online backups and `.local/ranking-backups/` outside the repository as well. A fresh database can import the surviving `content/` files and render them again, but recovering dropped candidates requires the private database backup or the original files from Git history. The published static site can still build from tracked `content/` without SQLite. Run commands from the repository root; relative feed, topic and locale paths use that working directory.

## Related documentation

- [Archive maintenance](archives.md)
- [Summaries and content](summaries.md)
- [Runner operations](operations.md)
