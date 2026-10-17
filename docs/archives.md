# Archive maintenance

## Update or remove an archive

Malformed bilingual archive pairs are preserved as opaque bytes and recorded in `gaps` under channel `archive`; only their platform/date's ranking is deferred. Other collection and summary work continues. Fix both visible files, then run `archives update PATH` to validate and save that pair, followed by `rank --history --source ID` to retry. Updates keep the native identity, date and file number. `archives remove PATH` removes both outputs of a platform pair through private exclusion, or removes an opaque file from the render snapshot. It retains platform archive rows; opaque-file originals remain in the maintenance backup. Both commands save the database and complete content tree first, print the backup path, and render locally without publishing. Files already replaced by generated summaries use `summarize --refresh` for updates. To undo maintenance, restore the printed private backup with runners stopped; merely editing or deleting rendered files is overwritten on the next render.

```sh
npm run feedgarden -- archives update hackernews/2026-10/09/item-1.md
npm run feedgarden -- archives remove other/draft.md
```

## Import and dry-run isolation

Archive import runs once per database, including when adopting an earlier directory-based import marker. Changing `feed.directory` changes the publication destination and reuses private snapshots, selections and exclusions; it does not import that directory over the database or create another import backup. Use the explicit archive maintenance commands for revisions. Malformed YAML or media URLs leave the complete affected Markdown file unchanged and do not stop other files from rendering. Archive paths must stay inside the output directory; Unicode, spaces and dots in ordinary filenames remain supported.

Dry-run isolation copies the complete SQLite database and may read/import the complete content tree into its temporary workspace. Archive import stages immutable bytes in a temporary SQLite snapshot, keeping file/identity metadata and the file or bilingual pair being processed in JavaScript memory. Temporary disk use and elapsed time still scale with the archive size. The validated snapshot enters the private database in one transaction after the backup; failed imports roll back and remove their temporary snapshot. Archive identities and reserved-number conflicts are checked before the first import backup, and backup and commit retain their lease checks.

## Maintenance and rendering

Archive maintenance scans only the requested file or bilingual pair once initial import is complete. Unrelated edited files cannot block that update. Rendering still publishes a complete staged tree atomically; unchanged renders skip it, while a changed render copies every retained opaque asset. Configuration changes regenerate the two locale manifests and keep all other archive bytes.

## Related documentation

- [Daily ranking](ranking.md)
- [Runner operations](operations.md)
- [Migration and rollback](migration.md)
