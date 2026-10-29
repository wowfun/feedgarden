# Configuration

JSONC is the only editable source of desired subscriptions, models, time policy and targets. SQLite owns observed state, the queue, accepted content, budgets and run checkpoints. `subscriptions` makes atomic, comment-preserving edits and validates the complete document. `setup` writes a versioned schema beside the config.

## Instance selection and storage layout

With no selector, fdg uses the user instance. The current directory never changes that choice. `--workspace PATH` selects `PATH/feedgarden.jsonc`; `--config FILE` selects that file and its parent as the workspace base. These selectors are mutually exclusive. Selecting the standard user config retains user directories.

| Category | Linux/macOS (XDG) | Windows |
| --- | --- | --- |
| Config | `$XDG_CONFIG_HOME/feedgarden`, default `~/.config/feedgarden` | `%APPDATA%/Feedgarden` |
| Data | `$XDG_DATA_HOME/feedgarden`, default `~/.local/share/feedgarden` | `%LOCALAPPDATA%/Feedgarden/Data` |
| State | `$XDG_STATE_HOME/feedgarden`, default `~/.local/state/feedgarden` | `%LOCALAPPDATA%/Feedgarden/State` |
| Cache | `$XDG_CACHE_HOME/feedgarden`, default `~/.cache/feedgarden` | `%LOCALAPPDATA%/Feedgarden/Cache` |

Empty or relative XDG variables use the specification defaults. Invalid Windows environment paths fall back to native KnownFolder queries in hidden, noninteractive PowerShell; failure returns `DIRECTORY_UNAVAILABLE`. WSL is a separate Linux instance.

An explicit workspace uses `.local/feedgarden/{data,state,cache}` beneath its config directory. `storage.dataDir` or `--data-dir` overrides data only; relative values resolve against the config directory. An override neither moves nor initializes data. Config and database instance UUIDs must match.

- Data: SQLite, raw evidence, topics, budgets, `workspaces/agents`, `recovery`, `targets`, `backups`, `tools`, `runtime`, and `secrets/runner.env`.
- State: run logs, diagnostics, generated scheduler files and validation evidence.
- Cache: temporary downloads, publish checkouts and isolated UI builds. Recovery never depends on cache alone.
- Core output defaults to `data/exports/core`; target outputs default to `data/exports/TARGET`. Explicit output paths resolve against the config directory. Published trees must never be a private data directory.

`instance paths` only computes paths. `doctor`, `status` and `items` use read-only SQLite connections; they never initialize or migrate a store. `runner.env` is parsed as KEY=value data, never executed as a shell script. Existing process environment values take precedence. Credentials remain local and are redacted from logs/results.

## New and existing instances

`setup` creates a UUID, four subscriptions (Hacker News, OpenAI, Anthropic, GitHub), timezone `Asia/Shanghai`, observedDays=7 and no targets. The collection cutoff is today at local midnight minus seven calendar days. Setup refuses an existing config or database.

The repository's `feedgarden.jsonc` deliberately remains the existing site's v2 migration input. `feedgarden.development.jsonc` is a separate v3 developer-validation configuration. Do not replace an existing private config with a template.

```sh
fdg instance upgrade --workspace /absolute/workspace --dry-run
fdg instance upgrade --workspace /absolute/workspace
```

Upgrade reads the actual old `storage.root`, including custom absolute roots. Supply `--legacy-base` if the old relative root was resolved elsewhere. It locks maintenance, checks leases, backs up the original config/database/content, copies and verifies durable files, rewrites recovery paths, validates ownership, migrates provably equivalent semantic caches, and atomically replaces the config. A durable journal supports retry from the original backup; originals are retained. No ordinary command performs this migration.

## Channels and subscriptions

A channel is a platform (`hackernews`, `reddit`, `openai`, `anthropic`, `github`, `arxiv`, `producthunt`, `x`, `podcast`, `rss`). Each source group contains named `streams`, each with ordered `routes`. Routes replace the old ambiguous `channels` field. Streams have independent enablement; removing a subscription retains history and stable item IDs.

```sh
fdg subscriptions list
fdg subscriptions add reddit LocalLLaMA
fdg subscriptions add rss research --url https://example.org/feed.xml
fdg subscriptions disable reddit/LocalLLaMA
fdg collect --subscription research
```

`--subscription` selects membership, not a duplicate copy of the item. Generic RSS identities include the feed URL so identical GUIDs from different feeds do not collide. `channels ID` describes available actions, limits and dependencies. `read URL` uses the public HTML reader; authenticated text and full comment coverage are not implied.

## Agent execution

OpenCode is configured separately; its model/effort can be inherited. `agent.model` and `agent.effort` override defaults, a source's `agent` overrides the instance, and explicit CLI flags override both. The optional pinned DSH runtime is installed only by `backend setup dsh`. X tooling is installed only by `channel x setup` and requires explicit cookie environment variables.

```json
{
  "backend": "opencode",
  "model": "provider/primary",
  "maxDailyCalls": 80,
  "inheritEnvironment": ["PROVIDER_API_KEY"],
  "candidates": [
    {"model": "provider/alternate", "effort": "low", "account": "default", "maxDailyCalls": 80}
  ]
}
```

Budgets are independent per backend/account/model and reset at UTC midnight. Effort does not create another budget. Summary, transcript, relation and repair calls share that model's budget; no global 80-call cap exists. Candidates are tried in order only with `--fallback`. Typed quota, model unavailability, model-call timeout and provider 429 may advance candidates. Authentication, configuration, artifact, storage, lease and unknown errors cannot. Account-wide 429 suppresses sibling models for that provider/account.

Every real call gets an isolated attempt directory, execution identity and input hash. Candidate switches and the single artifact-repair opportunity consume the existing five attempts per content version. Skipped quota/cooldown checks do not. Accepted caches depend on semantic input and trusted instructions; changing routing or budgets does not force regeneration. Use `--rebuild` explicitly for rewriting.

An effort-only candidate resolves its own execution identity while sharing the model's budget. Exhausted routes stop preparing further uncached batches for that run; reusable cached output and other model budgets remain available. Authentication or invalid execution configuration during a paid call stops further calls. Retention also removes old superseded attempt directories when their ownership is proven and no current task references them.

Collection honors `transport: "curl"` on public requests. Both transports validate and pin each destination and redirect. The curl adapter uses manual redirects and pins proxy CONNECT destinations while retaining the original HTTP Host and TLS identity; it does not load user curl configuration.
