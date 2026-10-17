# Configuration

## Configuration discovery

All commands, including `migrate` and `rollback`, discover `feedgarden.jsonc` or `feedgarden.json` in the working directory. If both exist, pass `--config FILE` explicitly.

## Agent execution

`agent.backend` selects `opencode` (default) or `dsh`. `command` defaults to the backend name; `args` defaults to `["acp"]` and is the complete argument list before runner-managed options. Use an executable or JavaScript entrypoint rather than a shell command. On Windows, literal npm/pnpm `.cmd`, `.bat` and `.ps1` launchers resolve to their declared native executable or JavaScript entrypoint without a shell. Opaque launchers, unresolved variables and launchers requiring fixed extra arguments need an explicit entrypoint path. `version`, when supplied, requires an exact CLI version. OpenCode 2 is required; acceptance uses 2.0.31.

```json
"agent": {
  "backend": "opencode",
  "command": "opencode",
  "args": ["acp"],
  "runtimeDirectory": ".local/agents"
}
```

Configure OpenCode providers and credentials using its normal local configuration. Optional `model` is a provider/model ID; optional `effort` is an advertised reasoning variant. With neither supplied, Feedgarden reads OpenCode's normalized configuration through a temporary authenticated local server, then validates and pins the inherited selection through ACP without calling a model. This preserves configured default variants even when ACP initially reports `default`. An explicit model uses its own defaults; a configured default variant is inherited only when that model matches. Unsupported selections and versions fail before generation; they never fall back silently. `source.agent` may override only `model` and `effort`, with precedence over the global values. OpenCode's internal agent/mode is managed by Feedgarden.

After setting the ACP options, the runner reloads the persisted session and verifies its model, effort and dedicated agent before prompting. This avoids mistaking an older selection event for a failed setting change; a persisted mismatch still stops generation.

The temporary config server follows OpenCode 2's native `serve --stdio` protocol. The runner accepts only a loopback HTTP announcement without embedded credentials, refuses redirects and validates the document/model/provider response shape before opening an ACP session. Authentication uses OpenCode's supported random `OPENCODE_PASSWORD` environment variable; the server submits no model request and closes after config retrieval. Local provider plugins run with the same user's process permissions. Generation APIs require a fixed input object and cannot implicitly become configuration probes.

Each run shares in-flight and successful resolutions for identical configurations; failed probes are evicted so later work can retry. A source whose configuration cannot be resolved is reported in `sourceErrors`, keeps its queued work, and does not block healthy sources. Relation resolution failures appear as `configurationError` with the candidate count, without spending model quota. The CLI records these as partial failures and exits 1 after completing the remaining renders and scheduled backup/publication decision. Cancellation and lost ownership still stop the run immediately; a later hard failure retains the earlier phase diagnostics in the run record.

Summary sources without eligible items and relation runs without candidate pairs skip agent probing. When eligible accepted copies or relation candidates exist, the runner still resolves the current selection before checking caches so inherited settings cannot go stale. Resolutions are not persisted across runs based on an incomplete config-file fingerprint.

OpenCode persists ACP sessions outside the task directory. Normally completed probes delete only their own new session through ACP when deletion is advertised; generation sessions retain their audit history. Interrupted probes or backends without deletion support may leave empty native sessions. OpenCode probes omit unused skill/input files; DSH probes retain them because DSH initializes its fixed plugin during the handshake.

OpenCode runs a dedicated Feedgarden agent in each task workspace. A local stdio MCP server exposes only `feedgarden_input` and `feedgarden_result`, with Code Mode disabled. A local readiness plugin observes OpenCode's final tool registry; the runner waits until both direct tools are registered before submitting the prompt. This wait shares the task timeout and cancellation scope. Its permissions deny other actions; additional ACP permission requests are rejected. Inputs, schemas, result validation and atomic writes are shared with DSH. No provider credentials are written into generated task configuration. Private workspaces and local OpenCode session state must not be published.

The stdio server names its tools `input` and `result`; OpenCode adds the `feedgarden_` server namespace, yielding the same effective names used by DSH and the permission allowlist.

Agent children receive an allowlisted environment for version checks, configuration probes and ACP execution. It includes the base OS/path/locale/temp variables, proxy variables and certificate paths (`NODE_EXTRA_CA_CERTS`, `SSL_CERT_FILE`, `SSL_CERT_DIR`). OpenCode additionally receives its profile/state paths (`XDG_CONFIG_HOME`, `XDG_DATA_HOME`, `XDG_STATE_HOME`, `XDG_CACHE_HOME`), configuration selectors (`OPENCODE_CONFIG`, `OPENCODE_CONFIG_DIR`, `OPENCODE_CONFIG_CONTENT`) and `OPENCODE_DISABLE_AUTOUPDATE`. Unrelated runner credentials and `NODE_OPTIONS` are omitted. OpenCode's saved provider authentication continues to work through those profile paths. If a provider config uses an environment credential, name it explicitly; values remain outside Feedgarden configuration and are redacted from agent errors:

```json
"agent": {
  "backend": "opencode",
  "inheritEnvironment": ["DEEPSEEK_API_KEY"]
}
```

`inheritEnvironment` defaults to an empty list, applies to both backends, and is not a source override. Listed variables are trusted process inputs, so include only those required by the configured provider or launcher. The local MCP server inherits the restricted OpenCode environment. This is process environment isolation; local provider plugins still have the same user's file permissions.

DSH remains pinned by the local dependency and default version constraint:

```json
"agent": {
  "backend": "dsh",
  "model": "deepseek/deepseek-flash",
  "effort": "off",
  "version": "0.1.7-rc.2"
}
```

DSH requires an explicit DeepSeek model and reads `FEEDGARDEN_AGENT_API_KEY`, then `DEEPSEEK_API_KEY`, then local DSH credentials. OpenCode uses its own provider authentication instead. Changing backends does not move or delete historical `.local/dsh` workspaces.

Shared budgets remain configurable: `timeoutSeconds` (default 300), `maxBatchItems` (10), `maxInputChars` (24000), `maxItemChars` (4000), `maxDailyCalls` (80), `workspaceRetentionDays` (7), and `maxTranscriptChunks` (64). New workspaces default to `.local/agents`. Model-call accounting excludes configuration probes. Execution audit records the backend, version, resolved model/effort and original usage updates. Cache and planning identities include the backend, actual agent version, resolved selection and a fingerprint of relevant OpenCode provider/model configuration; inherited configuration changes and backend upgrades cannot reuse stale entries. Existing historical content remains governed by the normal refresh/rebuild policy.

`doctor` uses this same resolver and submits no generation prompt. `npm run verify:agent -- --config FILE` uses the selected configuration for a paid live run in isolated storage. `npm run verify:opencode` instead uses a temporary profile and local simulated provider, exercising the installed OpenCode without paid model calls. Pass `-- --command PATH` to test a specific OpenCode executable.

The OpenCode provider fingerprint is conservative: edits or additions to any provider document can invalidate all model-dependent caches, even when the selected model ID is unchanged. This favors recomputation over reusing results after an endpoint or provider setting changes.

## Sources and channels

Configuration v2 uses `feed.directory`, `feed.topics` and `collection.backfillDays`. `collection.enrichmentRefreshDays` defaults to 7 (0-30), measured from each item’s first observation. Sources retain their streams and ordered fallback channels. A valid empty response stops fallback; unavailable or stale channels permit the next channel. A successful collection round sets the stream cadence. After a failed round, each enabled channel keeps its own retry time, so a failed fallback cannot postpone a due primary. Sources collected in one run share host pacing and robots policy. `source.agent` overrides model/effort. arXiv `includeKeywords` retains lexical relevance filtering; X reposts are excluded. There is no report frequency or seal period; daily selection is optional per source. GitHub collection remains disabled; its stored historical data and adapter remain available.

Channel kinds select collection transports. Source-specific enrichment, filtering and summary contracts use the built-in source IDs `hackernews`, `producthunt`, `openai`, `anthropic`, `arxiv`, `podcast` and `x`. Keep those IDs when changing their channels; use `name` to change their displayed labels. Custom source IDs use generic collection and summary behavior, so an `hn-api` channel alone does not enable the Hacker News article/discussion contract. Configuration rejects `podcast-rss` channels outside the `podcast` source and requires both `url` and `podcastName`.

Locale manifests can provide explicit `tag_labels` overrides for source names. Topic labels continue to come from the canonical bilingual topic registry.

`channel.limit` applies to `hn-api` and `arxiv-api`. Other channel kinds use the supplied feed window or their adapter's own bounds; setting `limit` does not truncate those results.

Feed and X CLI channels keep valid entries when individual rows are malformed, mark coverage partial and record the skipped count. An entirely malformed nonempty response fails, allowing fallback; a valid empty response still stops fallback. arXiv pages remain strict so a bad entry cannot advance their pagination checkpoint.

## Related documentation

- [Sources](sources.md)
- [Summaries and content](summaries.md)
