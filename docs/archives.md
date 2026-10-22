# Archive maintenance

## Update or remove an archive

Malformed bilingual archive pairs are preserved as opaque bytes and recorded in `gaps` under channel `archive`; only their platform/date's ranking is deferred. Other collection and summary work continues. Fix both visible files, then run `archives update PATH` to validate and save that pair, followed by `rank --history --source ID` to retry. Updates keep the native identity, date and file number. `archives remove PATH` removes both outputs of a platform pair through private exclusion, or removes an opaque file from the render snapshot. It retains platform archive rows; opaque-file originals remain in the maintenance backup. Both commands save the database and complete content tree first, print the backup path, and render locally without publishing. Files already replaced by generated summaries use `summarize --refresh` for updates. To undo maintenance, restore the printed private backup with runners stopped; merely editing or deleting rendered files is overwritten on the next render.

```sh
npm run feedgarden -- archives update hackernews/2026-10/09/item-1.md
npm run feedgarden -- archives remove other/draft.md
```

Removal also recognizes generated `SOURCE/YYYY-MM/DD/item-N.md` paths registered in SQLite, for every source. Passing either language's path excludes that identity and removes both language outputs, including any opaque archive copies. Summary evidence, publication history and reserved item numbers remain private; repeating the removal is safe. Generated updates still use the summary pipeline. For example: `npm run feedgarden -- archives remove anthropic/2026-10/21/item-1.md`.

This exclusion persists through later collection, ranking and summary refresh/rebuild commands. There is no CLI un-exclude command. To undo removal, stop runners and restore the printed maintenance backup; that restores the database and content snapshot, including its other state at backup time.

## Import and dry-run isolation

Archive import runs once per database, including when adopting an earlier directory-based import marker. Changing `feed.directory` changes the publication destination and reuses private snapshots, selections and exclusions; it does not import that directory over the database or create another import backup. Use the explicit archive maintenance commands for revisions. Malformed YAML or media URLs leave the complete affected Markdown file unchanged and do not stop other files from rendering. Archive paths must stay inside the output directory; Unicode, spaces and dots in ordinary filenames remain supported.

Dry-run isolation copies the complete SQLite database and may read/import the complete content tree into its temporary workspace. Archive import stages immutable bytes in a temporary SQLite snapshot, keeping file/identity metadata and the file or bilingual pair being processed in JavaScript memory. Temporary disk use and elapsed time still scale with the archive size. The validated snapshot enters the private database in one transaction after the backup; failed imports roll back and remove their temporary snapshot. Archive identities and reserved-number conflicts are checked before the first import backup, and backup and commit retain their lease checks.

## Maintenance and rendering

Imported published pairs enter publication history. Later ranking changes preserve their bodies and paths, including HN stories subsequently marked dead/deleted. Explicit removal still takes precedence. Existing databases adopt the current bilingual output once; previously private archives stay private unless selected again.

Archive maintenance scans only the requested file or bilingual pair once initial import is complete. Unrelated edited files cannot block that update. Rendering still publishes a complete staged tree atomically; unchanged renders skip it, while a changed render copies every retained opaque asset. Configuration changes regenerate the two locale manifests and keep all other archive bytes.

## Related documentation

- [Daily ranking](ranking.md)
- [Runner operations](operations.md)
- [Migration and rollback](migration.md)
