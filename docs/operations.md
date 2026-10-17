# Runner operations

## Scheduled runs and leases

Scheduled `run --due` performs collect → rank → summarize → render → relate → render → backup before optional publication. The ranking pass also runs when collection is not yet due, using the existing evidence cache and cooldowns, so HN RSS candidates missing API counters can recover automatically. Missing HN counters still defer their day and preserve its last valid selection; the runner prints ranking diagnostics and records a partial run with exit code 1. Archived bodies are reused by default, including for selected items. Explicit `summarize --source hackernews --refresh` or `--rebuild` allows selected archived items to be enriched and regenerated; those generated summaries then follow the normal periodic enrichment schedule, while dropped items remain private. Already completed artifacts for subsequently dropped items finish their jobs and retain reusable private copies.

Losing either runner lock cancels active collection/ACP work and prevents accepting new results. Database lease ownership and expiry are checked again at collection, summary, content replacement and publication boundaries; an expired lease cannot be renewed by its former owner. Saved artifacts remain recoverable. Generated schedulers have no whole-run time limit that conflicts with the daily ACP budget; individual HTTP/ACP timeouts and concurrent-run exclusion still apply. Updating an installed scheduler requires regenerating its files and reloading the service or reimporting the Windows task.

Database initialization precedes runner lease acquisition. Current schemas use read-only revision checks; existing-schema upgrades serialize in an immediate SQLite transaction with a five-second busy timeout. A contention timeout reports startup failure without leaving partial schema changes.

## Persistence, retention and backups

SQLite retains raw responses, content versions, observations, collection cursors, gaps, summary jobs, accepted snapshots, fixed task inputs, ACP usage and run state. Future raw captures deduplicate identical source/stream/channel/URL, body, status and header snapshots, retaining their first capture; latest HTTP cache timestamps and collection/run records track subsequent activity. Existing captures and observations are not automatically deleted. Every collection retains its observations, including metric changes, so database size grows with collection activity. The `gaps` and `runs` tables support manual audit in a SQLite reader; they are not public site content.

New runner-owned task directories have `agent.workspaceRetentionDays` retention (default 7 days from creation; 0 disables cleanup). At summary startup, aged accepted, failed, interrupted and deferred batch directories are removed only when their ownership marker matches the database batch. Accepted and exhausted failed auxiliary task directories follow the same retention rule with their task ownership marker. Pending and running auxiliary tasks, including quota-deferred tasks, keep their directories so they can resume. After a failed task directory is pruned, `--retry-failed` creates a new marked directory and restarts its retention age; fixed inputs, accepted outputs, diagnostics and attempt accounting remain in SQLite. Deferred batches are never resumed; their pending jobs enter a new batch on a later run. Active/prepared batches, unmarked historical directories, symlinks and paths outside the configured runtime directory remain untouched. Fixed inputs, accepted snapshots and ACP accounting remain in SQLite; database history is not pruned or vacuumed automatically. Historical report tables remain private for audit. A filesystem lock and renewable database lease prevent concurrent runners. Online backups retain seven daily and four weekly copies; private raw data, credentials and scratch workspaces are never deployed.

Windows flushes file contents before atomic replacement, but Node cannot fsync the parent directory there; directory-entry crash durability remains a POSIX-only guarantee. Generated schedulers still target Linux/WSL.

## Request limits and resource bounds

Rate limits honor a valid `Retry-After` first. Otherwise, GitHub reset values and contemporary epoch-sized `x-ratelimit-reset` values are treated as timestamps; smaller values (including Reddit's remaining seconds) are treated as durations. Invalid values, including unsupported millisecond epochs, fall back to 30 minutes, and cooldowns are bounded to 1 second-24 hours.

HTTP responses are limited to 12 MB of decoded bytes while reading, and oversized streams are cancelled. Article response buffers are released after their evidence is stored. Summary planning and site rendering read 128 records at a time; quota checks use an indexed timestamp. Pending batches walk an index ordered by source, first observation and item ID, skipping retries that are not yet due without sorting the whole queue for each batch. Runs with no changed or due items skip preparation and job writes. Rendering skips an unchanged tree using content and recommendation revisions plus fingerprints of topics, sources and locale configuration; explicit `render` rebuilds the tree and repairs missing or edited files. Changed renders still build a full tree, parse each accepted item once, and retain the recovery journal. Migration checksums stream files while preserving existing archive hashes. ACP usage and tool notification logs each retain at most 64 KiB and 128 entries, with omitted counts in the audit; complete fixed inputs and accepted snapshots remain in SQLite, while on-disk task artifacts follow the workspace retention policy.

## Diagnostics

`doctor` reports summary job and intermediate `feed_tasks` counts by state, and checks the required report skill files as well as the runtime; missing files identify the repository path to restore. `verify:collect -- SOURCE ...` rejects unknown or disabled IDs before creating its isolated evidence directory; `--help` lists its usage.

## Related documentation

- [Configuration](configuration.md)
- [Archive maintenance](archives.md)
- [Deployment and publishing](deployment.md)
