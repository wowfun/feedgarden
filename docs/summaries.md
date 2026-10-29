# Summaries and content

## Preparation and queue order

`--since` requires a valid ISO date or timestamp and is normalized once to UTC before archive or queue work. Week dates, ordinal dates and basic ISO dates use the same parser as ISO timestamps; an explicit offset is honored, while an unzoned `--since` uses the runner timezone. Quota exhaustion retains paid work while allowing valid cached summaries to be accepted during the same run.

A persistent indexed queue prepares newly collected or changed items. Observation timestamps alone do not enqueue unchanged facts; metrics, corrected dates, URLs and content changes do. Recent enriched items refresh at their source’s cache interval until the first-observation window closes. Older unchanged items with accepted summaries remain stored and stop automatic network refreshes; changed source facts and unfinished revisions still require preparation. `process --source ID --refresh --day YYYY-MM-DD` explicitly refreshes evidence in that day; `--rebuild` also regenerates its summaries. Parsed article/repository results, including missing articles, are reused while the response bytes stay the same. Configuration or skill changes can require a full planning pass, but only re-enqueue recent items or unfinished summaries. A zero-day window disables periodic refreshes without preventing initial processing.

Eligible new items enter the summary queue, FIFO per source and round-robin across sources. Sources with `selection` queue only their selected items. Dated items must meet the cutoff instant. Explicit offsets are honored; date-only and unzoned ISO/SQL dates use the source timezone (Shanghai by default, Los Angeles for Product Hunt). Undated items use their stable first observation and display “First observed”; a sample feed's generated timestamp is not a publication date.

Agent resolution failures appear in `sourceErrors` with a source ID and error. They retain that source's planning/queue state without spending model quota, while healthy sources continue. The CLI renders successful work and records the configuration errors as a partial run. Empty and ineligible sources do not start an agent probe.

Relation configuration failures similarly report `configurationError` while leaving candidate work pending. An explicitly publishing run can still publish valid accepted work. Partial progress exits 3; failure without accepted progress exits 1. Cancellation, lost leases and storage failures remain hard errors. Run checkpoints retain completed stage results.

`process --since 2026-10-15T00:00:00+08:00` limits work to that instant onward without discarding older queue entries.

## Input budgets and retries

The runner measures topic-registry overhead before preparing items and warns when it reaches 80% of the input budget. A registry that cannot fit stops with measured limits and guidance to shorten descriptions through `topics apply` while preserving IDs and aliases. An individual item that cannot fit is marked failed without spending an ACP attempt; following items continue. Adjust `agent.maxInputChars` or `agent.maxItemChars`, then use `--retry-failed`.

Round-robin batches contain one source. A batch contains at most 10 items (two for HN's combined bilingual article/discussion output), 4,000 normalized body characters each, and 24,000 characters for the complete JSON input including the topic registry. The default is 80 attempts per backend/account/model per UTC day, including failed/repair attempts (Shanghai 08:00 reset). There is no shared global cap; --fallback explicitly enables ordered candidates. Attempts time out after 300 seconds. One immediate artifact repair is allowed per visit; other retries back off from 15 minutes to six hours, up to five attempts per content version. Credential problems stop with a manual-action message; three consecutive runtime failures stop the run. Quota deferral returns pending work and retryAt: exit 4 without accepted progress, or 3 with progress.

```sh
fdg process --retry-failed
fdg process --source openai --refresh
fdg process --source openai --rebuild
fdg doctor
fdg backup
```

## Identity, paths and accepted copies

The rules below apply to collected items. [Clippings](clippings.md) uses manually maintained, single-copy Markdown and does not enter the summary queue.

Identity remains `(source,native ID)`; native IDs never become path components. Content lives in `content/<source>/<YYYY-MM>/<DD>/item-<num>.md`, with matching paths below `content/_translations/zh-CN/`. The date uses the source timezone and the item's publication date, or its stable first observation when undated. Numbers start at 1 for each source/day and are reserved in SQLite, so later arrivals and repeated renders do not renumber existing items. Correcting an item's date moves it into the appropriate day, reserving a number there; previous reservations are retained and never reused. A failed render keeps its reservations and reuses them on retry; numbers remain stable but are not guaranteed to be gap-free. Frontmatter includes `date`, `updated`, `first_seen`, `date_basis`, `source_url`, and tags `source/<id>` plus `topics/<id>`. The indexed publication date follows source corrections; explicit instance upgrade reconciles legacy index values, preserving first observations and version history. Accepted summaries are cached by normalized semantic input, source identity, trusted skill hash and contract version. Backend/version/model/effort are preserved in attempt audit records; route and budget changes do not invalidate accepted semantic caches. Media candidates are part of the input cache identity. Metrics, URL and date changes update presentation without regenerating text. Cached summaries are revalidated against the current fixed input. Invalid JSON or deprecated topic assignments evict the cached copy and enter normal generation, quota and retry handling. Cache eviction itself spends no ACP attempt. Failed revisions retain the last accepted bilingual snapshot. No new item is published with only one language.

## Summary output and official articles

Substantial articles are summarized in 2-5 short paragraphs, aiming for 150-300 English words and 450-900 Chinese characters, with optional bullet lists and a 4,000-character limit per language. Brief sources remain brief; title-only inputs retain empty summaries. RSS full content is preferred over its description. Before summarizing eligible OpenAI/Anthropic items, the runner tries the official article with robots rules, conditional HTTP caching and a six-hour freshness window. Failed article requests fall back to the feed or retain previously accepted article evidence when the feed text is unchanged. Article-fetch evidence is private and does not change collection coverage or publication dates. Sources other than HN and these official articles use supplied feed content without crawling arbitrary discovery URLs.

## Related documentation

- [Topic vocabulary](topics.md)
- [Podcasts](podcasts.md)
- [Runner operations](operations.md)
