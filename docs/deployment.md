# Targets and publication

Content is ordinary repository data. Valid Markdown or JSON can be published without a database record, configured source, instance marker or import. Setup creates no target.

Configure a repository, branch, format (`json`, `markdown`, `jekyll`) and a non-root `managedPrefix`. `targets add --worktree PATH` selects an existing Git checkout on that branch with a matching `origin`. Without it, Feedgarden maintains a regular checkout at `dataDir/repositories/TARGET`; cache cleanup never removes it. `worktree` replaces target `output`. Relative worktree paths resolve against the instance config directory.

For an existing configuration, remove `output` and optionally set `worktree` to the repository root, rather than the former export directory. Remove the old content ownership file once through Git. Existing item paths, commits, collection databases and summary caches remain intact; no adoption or compatibility mode is needed.

```sh
fdg targets add notes --repository /absolute/repository.git --worktree /absolute/checkout --format markdown --prefix feed
fdg targets inspect notes
fdg export --target notes
fdg publish --target notes --dry-run
fdg publish --target notes
```

`targets inspect` reports the worktree, branch, origin and HEAD. `status` shows up to 100 working-tree paths, `statusCount` gives their total and `diffStat` summarizes the tracked scoped diff. Run `git status` or `git diff HEAD -- PATH` in that worktree for detail. The default checkout tracks its configured remote branch. An explicitly selected worktree keeps its existing upstream settings.

Generic targets default to `feed/`. Jekyll targets default to `content/` and declare `config/topics.json` as an auxiliary file. These paths define the write and commit scope. Generation maintains the topic registry.

## Generation

`export --target ID` uses that target's worktree and format. Standalone `export --output DIR --format markdown` remains available; those overrides cannot accompany `--target`.

Generation adds files individually. Existing items, authored files and Git-tracked deletions remain intact. `export --rebuild` explicitly updates or restores identifiable generated items at their existing paths. New items carry `feed_source` and `feed_source_id` frontmatter (JSON exports retain `item.source` and `item.id`); these are generation hints, never publishing credentials. Legacy source/discussion links identify items when unambiguous. Unknown or ambiguous items are preserved and reserve their numbers.

`item-N` numbering comes from the current directory and Git history, including deleted files, rather than instance database numbering. Use complete repository history to retain all old numbering. Concurrent clones can allocate the same path; Git then reports an ordinary add/add conflict. Standalone directories outside Git have no deletion history.

Export streams historical paths to reserve numbers. A live article with identical bytes at the same path accounts for that Git blob during the current export. Unresolved identities and rebuilds may still require reading every remaining historical version, including old articles identifiable only by a source link. Default export stops this scan once it finds every missing identity.

A bilingual item is written one file at a time. An interrupted export or a same-name collision can leave only one translation. Default export preserves a missing translation because it may have been deleted intentionally. Inspect both paths and save any manual edits before running `fdg export --target ID --rebuild` to regenerate a recognizable pair. If an incomplete file has lost its identity, inspect and move it aside before rebuilding.

Locale labels, indexes and recommendations use the final content directory, including external content. Existing topic definitions are retained and missing definitions appended. `topics apply FILE` validates and edits the instance's local vocabulary. Repository topics merge through Git like other files; there is no remote topic baseline or independent reconciliation protocol.

## Publishing and recovery

`publish` does not generate content. It validates the worktree's current files, commits only the content prefix and declared auxiliary files, fetches the configured branch, merges normally, validates the merged result and pushes the validated commit without force. `sync --publish` and `process --publish` explicitly export before publishing. Daily Skill workflows also export first.

An alternate Git index freezes the exact tree that is validated and committed. The real index is locked during publication. Unrelated staged changes, including renames, stay in the index. Edits made during validation stay in the worktree. Git ignore rules apply to new untracked files. To include an ignored file deliberately, stage it with `git add -f`. Feedgarden also skips untracked atomic-write leftovers named `<filename>.<UUIDv4>.tmp`. Ordinary authored `.tmp` files can be published.

A dry run validates the local snapshot and returns `baseTree`, `tree` and `diffStat`. Run `git diff BASE_TREE TREE` in the reported worktree to inspect its exact patch. Initial access may create the default clone. On both dry runs and real publishes, `changes` lists up to 100 local paths and `changeCount` reports the full local count before fetching or merging. A real publish returns the final confirmed commit, including any merged remote changes.

Validation covers the complete scoped snapshot, including a full trusted UI build for Jekyll and for dry runs. Merges that change scoped files require a second full validation; changes entirely outside that scope reuse the already-validated snapshot. This keeps cross-page links, locale configuration and manually authored content covered without trusting an earlier commit merely because it exists in Git. Object reads are batched by byte size, and format validation does not load media files into memory.

Conflicts remain in the normal working files and index, with concrete paths in the error. Resolve them, run `git add` on those paths, and publish again. A merged result that fails validation also remains available for correction. Overlapping unrelated local changes stop the merge without discarding them. Git commands can inspect, commit or abort a pending merge as usual.

Interrupted pushes leave local commits intact. Retry publication to fetch and inspect remote ancestry; an already-delivered commit is not duplicated. No per-file publication manifest, deletion queue, baseline or pending-push receipt is needed. After a killed process, use normal Git recovery; remove an abandoned index lock only after confirming no process still uses it. Old publication receipts are ignored. Private collection databases, summary caches and Skill runtime integrity receipts are unchanged.

Validation scratch directories use the existing runtime cache retention mechanism. A subsequent publish removes marked, inactive scratch directories older than seven days; active runs, unmarked directories and persistent repository clones are retained.

A confirmed push completes publication. Pages deployment and live-site checks are separate.

Instance backups copy the default checkouts under `dataDir/repositories/`, including working files and Git object stores. Backup size grows with repository history. Worktrees configured outside the instance data directory use their own backup arrangements.

## Optional Jekyll UI

Jekyll targets require Git, Ruby 4.0.x and Bundler. Validation copies the Git snapshot into an isolated directory and uses the bundled Gemfile, lockfile and template with frozen dependencies. Target Gemfiles, plugins and build scripts are preserved and never executed by this build.

The optional `ui` object supports `title`, `description`, `lang`, HTTP(S) `url`, `baseurl` and boolean `features` (`search`, `feed`, `tags`, `graph`, `relations`, `previews`, `outline`, `favorites`). Arbitrary executable build configuration is rejected.

```sh
fdg ui build --target site
fdg ui serve --target site --port 4000
fdg ui clippings fetch --target site --all --dry-run
```

The repository Pages workflow and `pnpm run dev:site:build` validate the checked-in site separately from consumer publication.
