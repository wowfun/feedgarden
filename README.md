# Feedgarden

English | [简体中文](README.zh-CN.md)

Feedgarden collects developer and AI sources into local SQLite and publishes a bilingual chronological feed. Each item has its own Markdown page, source tag, 1-3 topic tags, and a clickable original URL.

The site is built with [jekyll-obsidian](https://github.com/wowfun/jekyll-obsidian). Preview: [English](https://sinputer.top/feedgarden/) | [简体中文](https://sinputer.top/feedgarden/zh-CN/).

[Clippings](docs/clippings.md) holds manually maintained Markdown. Its items appear both in a dedicated tab and on the homepage, with one original body shared by both language interfaces.

Article lists support independent daily folding with localized dates, weekdays and page-local counts. Only the newest day opens by default; filters and pagination retain manual choices until reload. See [Site features](docs/site.md).

## Quick start

Use Node 24-26 for the runner (`npm ci`), Ruby 4.0.6 and Bundler for the published Jekyll Obsidian gem. X setup (`npm run setup:twitter`) also requires `uv`. Install OpenCode 2 separately and configure its providers and credentials locally. Feedgarden defaults to `opencode acp` and inherits OpenCode's model and reasoning variant unless `agent.model` / `agent.effort` override them. OpenCode 2.0.31 is the acceptance baseline. DSH remains an optional backend; see [agent configuration](docs/configuration.md#agent-execution). Keys stay out of Git and generated content. Windows npm/pnpm launchers with literal entrypoints are resolved without a shell. Cache identities include the agent version; a source configuration error is reported without blocking healthy sources.

On Windows, install the shared toolchains globally. Use Node 24–26 for Feedgarden, RubyInstaller **Ruby+Devkit 4.0.6**, Bundler 4.0.16, Git and uv. Open a new PowerShell after installation so it receives the updated PATH. RubyInstaller's MSYS2 toolchain supplies native gem builds. Keep `node_modules` and the patched X CLI environment local because their versions and authentication behavior belong to this project.

Agent processes inherit a restricted environment. If your OpenCode provider reads an environment credential, add its variable name to `agent.inheritEnvironment`, for example `["DEEPSEEK_API_KEY"]`; saved OpenCode authentication remains available through its profile.

```powershell
winget install --id RubyInstallerTeam.RubyWithDevKit.4.0 --exact --version 4.0.6-1
gem install bundler -v 4.0.16 --no-document
npm ci
bundle install
npm run setup:twitter
npm run feedgarden -- doctor
npm run site:build
npm run site:serve
```

The preview is at `http://127.0.0.1:58002/feedgarden/` (Chinese: `/feedgarden/zh-CN/`). `doctor` does not call the model or collect live data. Summarization uses the selected backend’s local provider credentials; authenticated X collection additionally needs `TWITTER_AUTH_TOKEN` and `TWITTER_CT0` in the runner environment. A new empty database does not contain the checked-in article history: do not run `render` merely to preview existing content.

## Run the pipeline

Run commands from the repository root. Private data and state default to `.local/feedgarden/`, controlled by `storage.root`. Public articles remain in `content/`. A missing database is initialized on the first runner command. Old storage paths and the legacy `migrate` / `rollback` commands are unsupported; see [storage configuration](docs/configuration.md#storage-layout).

```sh
npm run feedgarden -- collect --source openai
npm run feedgarden -- summarize --source openai
npm run feedgarden -- render
npm run site:build
npm run feedgarden -- run --due --no-publish
```

## Documentation

| Document | Contents |
| --- | --- |
| [Architecture](docs/architecture.md) | Pipeline, module boundaries, durable state and recovery |
| [Configuration](docs/configuration.md) | Configuration discovery and collection channels |
| [Sources](docs/sources.md) | Product Hunt, Hacker News and X collection |
| [Podcasts](docs/podcasts.md) | Episode discovery, transcripts and recovery |
| [Summaries and content](docs/summaries.md) | Queues, budgets, cache keys and item paths |
| [Daily ranking](docs/ranking.md) | Daily selection, historical reranking and private candidates |
| [Archive maintenance](docs/archives.md) | Private snapshots, explicit updates and recovery |
| [Topic vocabulary](docs/topics.md) | Bilingual labels, deprecation and registry updates |
| [Site features](docs/site.md) | Articles, media, filters, reading, export and favorites |
| [Related coverage](docs/related-items.md) | Evidence requirements, expiry and relation commands |
| [Runner operations](docs/operations.md) | Scheduling, persistence, backups, limits and diagnostics |
| [Daily task prompts](docs/daily-updates.md) | 06:00/18:00 Shanghai runs, yesterday's window and first observations |
| [Deployment and publishing](docs/deployment.md) | Build environment, publication boundaries and conflicts |
| [Development and validation](docs/development.md) | Theme ownership, checks and isolated fixtures |
