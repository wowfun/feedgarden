# Feedgarden

Feedgarden collects developer and AI sources into local SQLite and publishes a bilingual chronological feed. Each item has its own Markdown page, source tag, 1–3 topic tags, and a clickable original URL. The English site is at `/feedgarden/`, with Simplified Chinese at `/feedgarden/zh-CN/`.

Use Node 24–26 for the runner (`npm ci`), Node 26 and Ruby 4.0.6 for the pinned Jekyll Obsidian theme. The local DSH dependency is pinned to `0.1.7-rc.2`. Its model is `deepseek/deepseek-flash`, with effort `off`. Configure `DEEPSEEK_API_KEY` in local DSH credentials, or set `FEEDGARDEN_AGENT_API_KEY` / `DEEPSEEK_API_KEY`. Keys stay out of Git and generated content.

```sh
npm run feedgarden -- migrate
npm run feedgarden -- collect --source openai
npm run feedgarden -- summarize --source openai
npm run feedgarden -- render
npm run site:build
npm run feedgarden -- run --due --no-publish
```

`migrate` is required for an existing schema 2 database. It makes a permanent online SQLite backup, preserving WAL data, reports, original configuration, dependency/theme locks, code revision and checksums under `.local/migrations/`. It then freezes the migration calendar day's **Asia/Shanghai midnight as one instant**, excludes every existing `(source,id)`, resets collection cursors, upgrades additively, and replaces the public report tree with item content. Old report URLs return 404. Existing items are retained privately and are not backfilled. Migration and content replacement use recoverable journals. Migration archives are excluded from normal backup retention.

For local rollback, stop the scheduler and runners, then run `feedgarden rollback ARCHIVE`. The command verifies archive checksums, preserves the new database/content, retires WAL/SHM after closing SQLite, restores the old data/configuration/reports, and clears the lease only in the restored copy. Continue with the recorded old code revision in an independent worktree. A remote rollback requires an ordinary Git revert and Pages rebuild.

Configuration v2 uses `feed.directory`, `feed.topics` and `collection.backfillDays`. Sources retain their streams and ordered fallback channels. A valid empty response stops fallback; unavailable or stale channels permit the next channel. `source.agent` overrides model/effort. arXiv `includeKeywords` retains lexical relevance filtering; X reposts are excluded. There is no report frequency, seal period, ranking or Top 50 selection. GitHub collection remains disabled; its stored historical data and adapter remain available.

All eligible new items enter the summary queue, FIFO per source and round-robin across sources. Dated items must meet the cutoff instant. Explicit offsets are honored; date-only and unzoned ISO/SQL dates use the source timezone (Shanghai by default, Los Angeles for Product Hunt). Undated items use their stable first observation and display “First observed”; a sample feed's generated timestamp is not a publication date.

A batch contains at most 10 items, 4,000 normalized body characters each, and 24,000 characters for the complete JSON input including the topic registry. The default budget is 80 ACP attempts per UTC day, including failed/repair attempts (reset at Shanghai 08:00). Attempts time out after 300 seconds. One immediate artifact repair is allowed per visit; other retries back off from 15 minutes to six hours, up to five attempts per content version. Credential problems stop with a manual-action message; three consecutive runtime failures stop the run. Quota deferral leaves pending tasks and exits successfully. Other task failures produce a partial run and exit 1.

```sh
npm run feedgarden -- summarize --retry-failed
npm run feedgarden -- summarize --source openai --rebuild
npm run feedgarden -- doctor
npm run feedgarden -- backup
```

Identity is `(source,native ID)`; filenames are the full SHA-256 of its JSON tuple, independent of unsafe native ID characters. Content lives in `content/items/<hash>.md`, with matching translations below `content/_translations/zh-CN/items/`. Frontmatter includes `date`, `updated`, `first_seen`, `date_basis`, `source_url`, and tags `source/<id>` plus `topics/<id>`. Summaries are cached by normalized input, source identity, model/effort, skill hash and contract version. Media candidates are part of the input cache identity. Metrics, URL and date changes update presentation without regenerating text. Failed revisions retain the last accepted bilingual snapshot. No new item is published with only one language.

Substantial articles are summarized in 2–5 short paragraphs, aiming for 150–300 English words and 450–900 Chinese characters, with optional bullet lists and a 4,000-character limit per language. Brief sources remain brief; title-only inputs retain empty summaries. RSS full content is preferred over its description. Before summarizing eligible OpenAI/Anthropic items, the runner tries the official article with robots rules, conditional HTTP caching and a six-hour freshness window. Failed article requests fall back to the feed or retain previously accepted article evidence when the feed text is unchanged. Article-fetch evidence is private and does not change collection coverage or publication dates. Other sources use supplied feed content without crawling arbitrary discovery URLs.

The runner extracts up to six source image/video candidates; the agent may select up to three useful figures, screenshots or demos by their fixed IDs. The shared contract rejects invented or duplicate media references. Selected links appear under “Images and video” in the body; image/video URLs are clickable links and do not automatically load third-party media players. Summaries preserve safe paragraphs/bullets, and media labels are escaped before Markdown rendering. Existing contractVersion 2 artifacts remain readable; the expanded prompt and summary cache revision invalidate older generated copy.

Item detail pages use a wider reading column. Source/topic chips remain visible when the separate global tag index is disabled, and link back to the corresponding archive filter. The original URL sits below those chips and above the body.

`config/topics.json` is the canonical bilingual vocabulary. The fixed-input DSH skill reads it, reuses active IDs and aliases, and may append reusable topics. Both the restricted plugin and client validate identities, bilingual copy, topic references and new-topic uniqueness. The registry is written with file/directory fsync before the summary transaction; an interrupted commit may leave an unused topic, but cannot leave a published dangling reference. Saved artifacts are recovered before another ACP call. Topic additions do not invalidate accepted summaries; `--rebuild` explicitly refreshes classification.

For manual vocabulary changes, preserve IDs and old labels/aliases. Deprecate rather than delete; `replacedBy` must point directly to an active topic. Rendering remaps stored IDs, and old shared query links remain usable. Apply changes through the runner lock:

```sh
npm run feedgarden -- topics apply revised-topics.json
```

Directly editing the canonical registry while a job runs is unsupported and detected by its fingerprint. Topic/file and SQLite commits are separate durable steps; their recovery protocol does not claim a distributed atomic transaction.

The feed shows 50 cards per page. Sources and topics support multiple selection: OR within a group, AND across groups and chronology. Query parameters preserve selection, page, language switching and browser history. Unknown IDs produce an empty result. Counts are global; matching counts are shown separately. The theme writes a small generation manifest, lazy per-facet bitmaps and 50-card chunks. A Worker evaluates queries, network concurrency is capped at four, and resource caching at 20 entries. Failed loads retain the last successful page and offer retry. Search includes the latest 3,000 item titles/tags/summary excerpts; Atom includes 100 items. Full static builds still render every item page.

Publishing is disabled automatically by default. `publish` fetches the configured branch into an isolated worktree, merges topic registries with a three-way base, validates the site, commits only `content/` and `config/topics.json`, and pushes without force. Legacy `reports/` deletions are permitted only with the migration journal. Independent topic additions merge; conflicting IDs stop the entire publication and preserve local data, with `.local/publish-conflict.json` for resolution. Integrate the code/theme change into the publication branch before publishing item content. To resolve a registry conflict, fetch and merge the recorded versions, then run `topics apply FILE --remote-base <recorded-remote-SHA>`, render, and retry.

SQLite retains raw responses, content versions, observations, collection cursors, gaps, summary jobs, accepted snapshots, fixed task inputs, ACP usage and run state. Historical report tables remain private for audit. A filesystem lock and renewable database lease prevent concurrent runners. Online backups retain seven daily and four weekly copies; private raw data, credentials and scratch workspaces are never deployed.

Validation commands:

```sh
npm run typecheck
npm test
npm run verify:scale
FEEDGARDEN_VISUAL_ROOT=.local/notes/1009/fixture/.jekyll-obsidian-cache/site FEEDGARDEN_VISUAL_FIXTURE=1 npm run test:visual
npm run verify:agent
```

The 101-item bilingual fixture exercises full static build and browser flows. The upstream index/query tests cover 100,000 records without generating 100,000 full Jekyll pages. `verify:agent` uses real OpenAI RSS items and the installed DSH ACP in an isolated database, registry and content tree. It performs no publication. Notes and validation artifacts for this refactor live in `.local/notes/1009/`.
