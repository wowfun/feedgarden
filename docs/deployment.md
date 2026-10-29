# Targets and publication

Publication is opt-in. Setup creates no target. Configure a stable target ID with a repository, branch, format (`json`, `markdown`, `jekyll`) and non-root managed prefix. Generic targets default to `feed/`; a migrated Jekyll target uses `content/` with `config/topics.json` explicitly listed as an auxiliary managed file. The caller's cwd, origin and FETCH_HEAD are irrelevant.

```sh
fdg targets add notes --repository /absolute/repository.git --format markdown --prefix feed
fdg targets inspect notes
fdg publish --target notes --dry-run
fdg publish --target notes
```

An empty managed prefix can be claimed by first publication. Existing unowned content is refused. After reviewing the fetched head, use `targets adopt ID --expected-head FULL_SHA`; add `--takeover` only to transfer a foreign owner. Adoption imports history, topic vocabulary and reserved paths/numbers, retaining unknown native identities as opaque content. Local identity/path conflicts, symlinks and special files are rejected. The successful adoption push establishes ownership; a new generation prevents the old owner from publishing.

The manifest lives inside the managed prefix and records instanceId, targetId, generation, numbering namespace, path identities and hashes. Data/targets/ID holds baselines, adopted bytes and receipts. Publication compares accepted exports with the fetched manifest and remote files. Missing local files remain remote. Only persistent explicit archive-removal intent authorizes deletion; remote removal/edit of another managed file stops publication. Unexpected identity changes or unowned path collisions are errors.

Topic reconciliation uses the saved target baseline. For a deliberate conflict resolution, apply a complete validated registry with `topics apply FILE --target ID --remote-base FULL_SHA`. The SHA belongs to that target's fetched branch.

Before each ordinary push the expected remote head and lease are rechecked. There is no force push. Network-ambiguous pushes retain pending receipts; a retry checks whether the remote already contains the commit. Each target has an independent run checkpoint. A partial/deferred processing run may publish valid existing work, and retries do not repush completed target checkpoints. A confirmed Git push is the publication endpoint; Pages deployment is reported independently.

## Optional Jekyll UI

Jekyll targets require Git, Ruby 4.0.x and Bundler. Bundled Gemfile/Gemfile.lock and a fixed theme template are the trust source; target dependency files must match. Build uses frozen bundle settings and an isolated cache/ui staging directory. Target plugins, hooks, scripts and custom build commands are never executed.

The target's optional `ui` object supports `title`, `description`, `lang` (`en` or `zh-CN`), an HTTP(S) `url`, `baseurl` and boolean `features` (`search`, `feed`, `tags`, `graph`, `relations`, `previews`, `outline`, `favorites`). These presentation settings overlay the bundled template. Arbitrary Jekyll configuration, plugin lists and executable hooks are rejected. The template includes bilingual routes, feed facets and shared Clippings content.

```sh
fdg export --target site --rebuild
fdg ui build --target site
fdg ui serve --target site --port 4000
fdg ui clippings fetch --target site --all --dry-run
```

The repository Pages workflow and `npm run dev:site:build` are developer validation/deployment paths for the existing checked-in site. They are not consumer runtime dependencies. Theme version changes remain separate from the CLI refactor.
