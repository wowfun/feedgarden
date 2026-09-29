# Feedgarden

An English-first, bilingual feed digest at **https://sinputer.top/feedgarden/**. Chinese translations live at `/feedgarden/zh-CN/`. A local TypeScript runner collects public sources into SQLite, generates grounded report copy through DSH ACP, and publishes Markdown to a static Jekyll Obsidian site.

## Run locally

Use Node 24, Ruby 4.0.6, Git, curl and an authenticated GitHub CLI/Git credential helper. The pinned Jekyll frontend also requires Node 26. On this WSL workspace, the backend uses `.local/runtime/node_modules/node/bin/node`; an ordinary installation can use `nvm use` with `.nvmrc`.

```sh
npm ci
npm run typecheck
npm test
npm run feedgarden -- collect
npm run feedgarden -- run --due --no-publish
npm run site:build
```

DSH `0.1.7-rc.2` is installed and locked as a project dependency. The configured model is `deepseek/deepseek-flash` with effort `off`. Set `FEEDGARDEN_AGENT_API_KEY` or `DEEPSEEK_API_KEY`, or provision `DEEPSEEK_API_KEY` in your local DSH credentials. Feedgarden reads only that credential and starts each batch in a private workspace. No credentials belong in JSONC, reports, Git or Pages. Existing OpenCode configuration is unused.

The model has only two tools: read the fixed input and trusted skill, and write a fixed JSON artifact. Other tools are disabled and denied by a native DSH tool guard. The ACP client rejects permission requests, explicitly selects the advertised model and effort, enforces a timeout, and validates matching English/Chinese IDs and order. DSH's native provider name is `deepseek-official`; the user-facing model alias maps to that route. Extending model providers requires an explicit change to this adapter.

## Configuration and sources

Edit [feedgarden.jsonc](feedgarden.jsonc), validated against [the generated schema](schemas/feedgarden.schema.json). Strict JSON is also supported; if both files exist, supply `--config`. Source → stream → ordered channels is the collection hierarchy. A failed or stale channel falls through; a valid empty response stops. Partial coverage is retained and explained. Each channel has its own cursor, health and retry time.

| Source | Default channels | Frequency / interval |
| --- | --- | --- |
| Hacker News | Firebase top-story snapshot → front-page RSS | Daily + weekly / 1 h |
| Anthropic | News, research, engineering and Claude Blog lists → sitemaps + dated detail pages | Daily / 6 h |
| OpenAI | News RSS → sitemap + dated detail pages | Daily / 6 h |
| GitHub | Trending HTML → recently pushed repositories by total stars | Daily + weekly / 6 h |
| X | Optional explicit-cookie timeline → follow-builders daily sample | Daily + weekly / 4 h |
| Reddit | Six communities' official new-post RSS, using curl transport | Daily + weekly / 12 h |
| arXiv | Six categories' paginated Atom API → new-only category RSS | Weekly / 6 h |
| Product Hunt | Dated leaderboard HTML → new-product Atom feed | Daily + weekly / 6 h |

HTML collection checks robots.txt. HTTP requests have timeouts, bounded retries, conditional caching and per-host spacing; rate limits retain a retry time. HTTP(S)_PROXY and NO_PROXY are honored. `transport: "curl"` uses the system HTTP client with the same Feedgarden user agent, useful for public RSS endpoints that reject Node's HTTP stack. Challenge pages and inaccessible responses remain failures.

X's public fallback is an independent daily sample: up to three posts per configured account, without complete replies or threads. It cannot establish that an absent account had no activity. Cookie collection is optional and unofficial. To prepare its pinned environment-only CLI:

```sh
npm run setup:twitter
```

This requires `uv` and installs twitter-cli at commit `7c634e0d396b1e7af9f63315b414925fe4f29ae7` with its lockfile. A local patch prevents browser extraction even when explicit cookies expire. Set `TWITTER_AUTH_TOKEN` and `TWITTER_CT0` yourself to enable that channel. Feedgarden does not extract browser credentials. Without cookies the public fallback remains usable.

Reddit has no known score/comment metrics in RSS. Neither RSS ordering, GitHub Search nor Product Hunt's fallback feed is presented as the platform's popularity ranking. Historical coverage is bounded by the actual source: HN and GitHub begin with observed snapshots; X/Reddit feeds cannot reconstruct missed history. arXiv resumes its fixed query range after pagination interruptions or retrieval limits. Articles without a verifiable publication date are excluded, with a gap recorded.

To add accounts/categories, add streams. To add a source, configure its streams and implement a channel adapter only if none exists. Channel adapters return raw responses, normalized items, coverage and a cursor; `Store.saveCollection` commits these together. Extend the channel enum, adapter registry and meaningful parser/behavior tests, then run `npm run schema`. Source `agent` overrides model/effort; `reportAgent.daily` and `reportAgent.weekly` override those per frequency.

## Reports and selection

Reports contain at most 50 items per source and period:

- `reports/{source}/YYYY/YYYY-MM-DD.md`
- `reports/{source}/YYYY/YYYY-MM-DD-Weekly.md`
- Chinese mirrors beneath `reports/_translations/zh-CN/`.

Daily reports become due at 09:00 for the previous natural day. Weekly reports become due Monday at 09:00 for the preceding Monday–Sunday, and use that week's Monday in the filename. Default timezone is Asia/Shanghai; Product Hunt uses America/Los_Angeles. First runs consider the last seven days where history actually exists. Empty periods do not call the Agent or produce placeholder reports.

HN uses the highest observed score available when selection is first frozen, with comments breaking ties. GitHub uses each day's last observed snapshot; weekly reports aggregate reciprocal daily ranks, not rolling star totals. Product Hunt uses dated daily order and maximum observed votes for weekly selection. X and Reddit rotate fairly across configured streams in publication order. arXiv deduplicates version-free paper IDs and scores configured phrases in titles (3) and abstracts (1), grouped by first submission date. Weekly selection reads stored raw-item observations independently of daily reports.

Initial publication freezes selection scores. At period end + 48 hours, one final evaluation admits late items using those frozen scores and then seals the report. Metrics alone do not request new summaries. Text is cached by content, model, effort and skill version; failed revisions preserve the previous valid bilingual report. Explicit `--rebuild` reselects, while still reusing matching text. Each model call contains at most 10 items and 24,000 input characters, with a maximum of 4,000 body characters per item. The default daily budget is 80 ACP batch attempts in UTC, including failed attempts; batches allow one retry. Each attempt can contain several model/tool exchanges, so this bounds work rather than currency spend. Title-only inputs have no invented summary.

```sh
npm run feedgarden -- report --source openai --frequency daily --date 2026-09-28
npm run feedgarden -- report --source arxiv --frequency weekly --date 2026-09-21 --rebuild
npm run feedgarden -- collect --source arxiv --since 2026-09-21
npm run feedgarden -- doctor
npm run feedgarden -- doctor --live --source github
npm run feedgarden -- render
npm run feedgarden -- backup
npm run feedgarden -- publish
```

## Storage, scheduling and publishing

SQLite in `.local/feedgarden.sqlite` retains raw responses, item content versions, metric observations, cursors, gaps, fixed report snapshots, Agent usage and run state. WAL transactions protect cursor/data consistency. A filesystem lock and database lease prevent overlapping runners, including crash recovery after the 120-second lease expiry. SQLite online backups retain seven daily and four weekly copies under `.local/backups/`.

To restore: stop the scheduler and all runners, preserve the current database and its `-wal`/`-shm` sidecars together, copy a chosen backup to the configured database path, remove only the old database's sidecars after preserving them, wait for any copied lease to expire, and run `doctor`. `render` reconstructs Markdown from stored reports; failed report batches can reuse validated cached copy on retry. Raw data and scratch workspaces are private local files and are not uploaded by Pages.

```sh
npm run schedule:prepare
```

The generator writes reviewable files to `.local/scheduler/`. It **does not install or enable** a task. For WSL, import `Feedgarden.xml` into Windows Task Scheduler under the owning Windows account; it invokes `wsl.exe` every 15 minutes and runs while that account is logged in. It restarts WSL when needed; it does not promise to wake a suspended Windows host. Native Linux can install the generated user service/timer with `Persistent=true`; user lingering must be enabled separately if required. Activate one scheduler only. Optional environment settings belong in a private `.local/runner.env` (mode 0600), read by the generated shell script. Native Windows/macOS behavior is not part of this Linux validation.

`run --due` collects due streams, generates due reports, renders both languages, backs up and (when `publish.auto` is true) publishes. Publishing fetches remote `main` into an isolated Git worktree, replaces only managed `reports/`, validates the full site, commits only those paths and pushes without force. A concurrent remote update rejects the push; local data/report files remain for retry. Code/configuration changes use normal Git review rather than this report publisher.

Automatic publishing is disabled in the checked-in configuration. Keep `--no-publish` on local validation runs; enable `publish.auto` only when ready to publish. If every channel for a stream fails or a report cannot complete, the runner retains successful work, records a `partial` run with failure details and exits with code 1. A working fallback or a valid empty result is successful.

The Pages workflow validates TypeScript/tests and the bilingual browser flows before deploying. It never collects data or uses model credentials. The Jekyll source is pinned by full commit in `.github/theme.lock.json`, using `.references/jekyll-obsidian` when it matches. Feedgarden's generated source/year indexes, compact search (latest 3,000 reports per locale), bounded Atom feed (100 entries) and disabled graph/relations keep browsing costs bounded. Jekyll still rebuilds all archived pages; full-build costs grow with the archive.

## Validation

```sh
npm run typecheck
npm test
npm run build
npm run site:build
npm run test:visual
npm run verify:agent         # real DSH call; requires the configured credential
npm run verify:collect       # real source requests
npm run verify:scale         # isolated synthetic archive; never published
```

Visual checks cover desktop/mobile, English/Chinese, search, language switching, Markdown download, overflow and browser errors. Live evidence, screenshots, resolved issues and measured tradeoffs for this rebuild are retained in `.local/notes/0929/`; synthetic scale content is isolated under `.local/scale-workspace/`.
