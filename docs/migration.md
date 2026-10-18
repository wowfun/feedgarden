# Migration and rollback

## Migrate schema 2

`migrate` is required for an existing schema 2 database. It makes a permanent online SQLite backup, preserving WAL data, reports, original configuration, Node and Ruby dependency locks, Gemfile, code revision and checksums under `.local/migrations/`. It then freezes the migration calendar day's **Asia/Shanghai midnight as one instant**, excludes every existing `(source,id)`, resets collection cursors, upgrades additively, and replaces the public report tree with item content. Old report URLs return 404. Existing items are retained privately and are not backfilled. Migration and content replacement use recoverable journals. Migration archives are excluded from normal backup retention.

Converting a v1 configuration stamps `agent.backend: "dsh"` to preserve its existing execution semantics, including model, effort and launch command. Native v2 configurations retain the OpenCode default; a v2 DSH configuration must explicitly set `backend: "dsh"` and its model.

## Rollback

For local rollback, stop the scheduler and runners, then run `feedgarden rollback ARCHIVE`. The command verifies archive checksums, preserves the new database/content, retires WAL/SHM after closing SQLite, restores the old data/configuration/reports, and clears the lease only in the restored copy. Continue with the recorded old code revision in an independent worktree. A remote rollback requires an ordinary Git revert and Pages rebuild.

New migration archives use format 2 and record the committed and working gem bundle identities. Historical archives are not rewritten. To resume or restore an older archive, use its recorded `codeCommit` in an independent worktree; current commands reject unsupported formats before modifying the database or restoring files.

## Related documentation

- [Runner operations](operations.md)
- [Archive maintenance](archives.md)
- [Deployment and publishing](deployment.md)
