# Feedgarden

English | [简体中文](README.zh-CN.md)

Feedgarden gives agents a local information feed: collect subscriptions, query channels, search stored evidence, process bilingual summaries, and publish to explicit Git targets. The `fdg` CLI is the primary interface. Jekyll Obsidian is an optional UI; core operation requires no Ruby.

## Run the local package

Use Node **24.12+ on 24.x, or 26.x**. This change delivers a local tarball; it does not publish to npm. The executable is `fdg`, but the npm package named `fdg` belongs to another project. Always supply the tarball explicitly:

```sh
npm ci
npm run build
npm pack
npx --yes --strict-allow-scripts --package /absolute/feedgarden-0.1.0.tgz -- fdg setup
npx --yes --strict-allow-scripts --package /absolute/feedgarden-0.1.0.tgz -- fdg doctor
```

After an explicit installation of that tarball, the following examples use its `fdg` executable. `help --json` is the machine-readable command contract. For agent use, `skill install /absolute/skills/feedgarden` installs the small operator Skill with a verified absolute invocation receipt.

```sh
fdg channels
fdg channel github search --query 'language:typescript' --limit 10
fdg read https://example.org/article
fdg items search 模型
fdg sync --detach
fdg status RUN_ID --wait-seconds 10
```

The default instance uses XDG directories on Linux/macOS and native AppData directories on Windows. The current working directory never selects an instance. Use `--workspace /absolute/project` or `--config /absolute/config.jsonc` explicitly. Setup creates a stable instance UUID, a seven-calendar-day collection cutoff, four default subscriptions, and no publication targets. Query/read commands save only with `--save`.

Processing defaults to yesterday in Asia/Shanghai and undated items first observed within seven days. Empty results do not widen the window. Explicitly saved historical items retain their dates. Model budgets are independent per backend/account/model, defaulting to 80 calls per model per UTC day. Alternate models require `--fallback`; accepted content remains reusable when model routing changes. Configure OpenCode separately, or explicitly install the pinned optional DSH backend with `backend setup dsh`.

## Existing workspace and publication

The checked-in `feedgarden.jsonc` is the existing site's **v2 upgrade input**, not the new-instance default. Keep its private database and content with it. Upgrade a copy first; the implementation does not migrate a production instance automatically:

```sh
fdg instance upgrade --workspace /absolute/workspace --dry-run
fdg instance upgrade --workspace /absolute/workspace
fdg targets inspect site --workspace /absolute/workspace
fdg targets adopt site --expected-head FULL_SHA --workspace /absolute/workspace
fdg sync --publish --detach --workspace /absolute/workspace
```

Publication uses an isolated checkout and a target owner manifest. Nonempty unowned content requires explicit adoption; a foreign owner also requires `--takeover`. Missing local files never mean deletion. Success means a confirmed Git push; deployment remains separate. Generic Markdown/JSON targets require Git only. Jekyll targets use bundled, frozen dependencies and an isolated build.

## Documentation

- [Configuration and directories](docs/configuration.md), [CLI operations](docs/operations.md), [architecture](docs/architecture.md)
- [Daily task prompts](docs/daily-updates.md), [publishing](docs/deployment.md), [development and package acceptance](docs/development.md)
- [Sources](docs/sources.md), [summaries](docs/summaries.md), [podcasts](docs/podcasts.md), [ranking](docs/ranking.md), [archives](docs/archives.md), [topics](docs/topics.md)
- [Clippings](docs/clippings.md), [related items](docs/related-items.md), [site features](docs/site.md)

The existing site remains available in [English](https://sinputer.top/feedgarden/) and [Chinese](https://sinputer.top/feedgarden/zh-CN/). To preview its checked-in content during development, use `npm run dev:site:build`; this does not initialize an instance or process articles.
