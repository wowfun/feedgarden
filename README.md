# Feedgarden

English | [简体中文](README.zh-CN.md)

Feedgarden gives agents a local information feed: collect subscriptions, query channels, search stored evidence, process bilingual summaries, and publish to explicit Git targets. The `fdg` CLI is the primary interface. Jekyll Obsidian is an optional UI; core operation requires no Ruby.

## Run the local package

Use **Node 26.x and pnpm 11.18.0**, the development and CI baseline. The repository pins pnpm in `package.json`; install it if needed with `npm install --global pnpm@11.18.0`. Node 24.12+ on 24.x remains best-effort, without dedicated tests or CI. This change delivers a local tarball; it does not publish to npm. The executable is `fdg`, but the npm package named `fdg` belongs to another project. Always supply the tarball explicitly:

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm pack
pnpm --package /absolute/feedgarden-0.1.0.tgz dlx fdg setup
pnpm --package /absolute/feedgarden-0.1.0.tgz dlx fdg doctor
```

`dlx` exposes `fdg` for that invocation. To install a persistent command, configure pnpm's global directory:

```sh
pnpm setup
```

Close and reopen the terminal, then install the tarball:

```sh
pnpm add --global /absolute/feedgarden-0.1.0.tgz
command -v fdg
fdg version
fdg channels
```

In Windows Git Bash, use a path such as `/d/Projects/feedgarden/feedgarden-0.1.0.tgz`. If the global bin directory is missing from PATH, follow [Git Bash PATH configuration](docs/operations.md#global-installation-and-git-bash). Run `fdg setup` once for a new instance; an existing instance can use `fdg doctor` directly. Installing or updating the package preserves instance data.

npm/npx remain supported for installing and running the same tarball:

```sh
npx --yes --strict-allow-scripts --package /absolute/feedgarden-0.1.0.tgz -- fdg setup
npx --yes --strict-allow-scripts --package /absolute/feedgarden-0.1.0.tgz -- fdg doctor
```

After an explicit installation of that tarball, the following examples use its `fdg` executable. `help --json` is the machine-readable command contract. An agent can read [skills/feedgarden/SKILL.md](skills/feedgarden/SKILL.md) directly without installing the Skill; see the [daily task prompt](docs/daily-updates.md). Optional `skill install /absolute/skills/feedgarden` binds an installed copy to a verified absolute runtime and instance invocation.

```sh
fdg channels
fdg channel github search --query 'language:typescript' --limit 10
fdg read https://example.org/article
fdg items search 模型
fdg sync --detach
fdg status RUN_ID --wait-seconds 10
```

The default instance uses XDG directories on Linux/macOS and native AppData directories on Windows. The current working directory never selects an instance. Use `--workspace /absolute/project` or `--config /absolute/config.jsonc` explicitly. Setup creates a stable instance UUID, a seven-calendar-day collection cutoff, four default subscriptions, and no publication targets. Query/read commands save only with `--save`.

Processing defaults to yesterday in Asia/Shanghai and undated items first observed within seven days. Empty results do not widen the window. Explicitly saved historical items retain their dates. Model budgets are independent per backend/account/model, defaulting to 80 calls per model per UTC day. OpenCode defaults to its [unused-free-model policy](docs/configuration.md#agent-execution), trying catalog models in order. Use `--no-free-models` for configured routing; explicit `--model`, `--effort` or `--fallback` also overrides that default. Accepted content remains reusable when routing changes. Configure OpenCode separately, or explicitly install the pinned optional DSH backend with `backend setup dsh`.

## Existing workspace and publication

The checked-in `feedgarden.jsonc` is the existing site's **v2 upgrade input**, not the new-instance default. Keep its private database and content with it. Upgrade a copy first; the implementation does not migrate a production instance automatically:

```sh
fdg instance upgrade --workspace /absolute/workspace --dry-run
fdg instance upgrade --workspace /absolute/workspace
fdg targets inspect site --workspace /absolute/workspace
fdg sync --publish --detach --workspace /absolute/workspace
```

Targets use ordinary persistent Git worktrees, optionally selected with `targets add --worktree PATH`. Content belongs to the repository. Run `export --target ID` to add accepted summaries, then `publish --target ID` to validate, commit and synchronize current files. Manual edits and deletions are preserved; only `export --rebuild` updates identifiable generated items. `sync --publish` performs both steps. Git handles conflicts and history. Success means a confirmed push; deployment remains separate. Jekyll validation uses bundled dependencies in an isolated build.

## Documentation

- [Configuration and directories](docs/configuration.md), [CLI operations](docs/operations.md), [architecture](docs/architecture.md)
- [Daily task prompts](docs/daily-updates.md), [publishing](docs/deployment.md), [development and package acceptance](docs/development.md)
- [Sources](docs/sources.md), [summaries](docs/summaries.md), [podcasts](docs/podcasts.md), [ranking](docs/ranking.md), [archives](docs/archives.md), [topics](docs/topics.md)
- [Clippings](docs/clippings.md), [related items](docs/related-items.md), [site features](docs/site.md)

The existing site remains available in [English](https://sinputer.top/feedgarden/) and [Chinese](https://sinputer.top/feedgarden/zh-CN/). To preview its checked-in content during development, use `pnpm run dev:site:build`; this does not initialize an instance or process articles.
