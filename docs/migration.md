# Migration and rollback

## Migrate schema 2

`migrate` is required for an existing schema 2 database. It makes a permanent online SQLite backup, preserving WAL data, reports, original configuration, dependency/theme locks, code revision and checksums under `.local/migrations/`. It then freezes the migration calendar day's **Asia/Shanghai midnight as one instant**, excludes every existing `(source,id)`, resets collection cursors, upgrades additively, and replaces the public report tree with item content. Old report URLs return 404. Existing items are retained privately and are not backfilled. Migration and content replacement use recoverable journals. Migration archives are excluded from normal backup retention.

## Rollback

For local rollback, stop the scheduler and runners, then run `feedgarden rollback ARCHIVE`. The command verifies archive checksums, preserves the new database/content, retires WAL/SHM after closing SQLite, restores the old data/configuration/reports, and clears the lease only in the restored copy. Continue with the recorded old code revision in an independent worktree. A remote rollback requires an ordinary Git revert and Pages rebuild.

## Related documentation

- [Runner operations](operations.md)
- [Archive maintenance](archives.md)
- [Deployment and publishing](deployment.md)
