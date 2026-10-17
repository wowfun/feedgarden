# Configuration

## Configuration discovery

All commands, including `migrate` and `rollback`, discover `feedgarden.jsonc` or `feedgarden.json` in the working directory. If both exist, pass `--config FILE` explicitly.

## Sources and channels

Configuration v2 uses `feed.directory`, `feed.topics` and `collection.backfillDays`. `collection.enrichmentRefreshDays` defaults to 7 (0-30), measured from each item’s first observation. Sources retain their streams and ordered fallback channels. A valid empty response stops fallback; unavailable or stale channels permit the next channel. A successful collection round sets the stream cadence. After a failed round, each enabled channel keeps its own retry time, so a failed fallback cannot postpone a due primary. Sources collected in one run share host pacing and robots policy. `source.agent` overrides model/effort. arXiv `includeKeywords` retains lexical relevance filtering; X reposts are excluded. There is no report frequency or seal period; daily selection is optional per source. GitHub collection remains disabled; its stored historical data and adapter remain available.

Channel kinds select collection transports. Source-specific enrichment, filtering and summary contracts use the built-in source IDs `hackernews`, `producthunt`, `openai`, `anthropic`, `arxiv`, `podcast` and `x`. Keep those IDs when changing their channels; use `name` to change their displayed labels. Custom source IDs use generic collection and summary behavior, so an `hn-api` channel alone does not enable the Hacker News article/discussion contract. Configuration rejects `podcast-rss` channels outside the `podcast` source and requires both `url` and `podcastName`.

Locale manifests can provide explicit `tag_labels` overrides for source names. Topic labels continue to come from the canonical bilingual topic registry.

`channel.limit` applies to `hn-api` and `arxiv-api`. Other channel kinds use the supplied feed window or their adapter's own bounds; setting `limit` does not truncate those results.

Feed and X CLI channels keep valid entries when individual rows are malformed, mark coverage partial and record the skipped count. An entirely malformed nonempty response fails, allowing fallback; a valid empty response still stops fallback. arXiv pages remain strict so a bad entry cannot advance their pagination checkpoint.

## Related documentation

- [Sources](sources.md)
- [Summaries and content](summaries.md)
