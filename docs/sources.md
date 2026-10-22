# Sources

## Product Hunt

Product Hunt includes the current source-local day as a provisional snapshot. Long ranges fetch at most seven daily pages per run and retain a checkpoint with the original range and next date; subsequent runs resume it, while an explicit `--since` restarts the range. A failed daily leaderboard does not prevent collecting later days within that batch; when every requested day fails, the next channel can run. A unique native Post ID from the captured page aligns leaderboard and Atom identities for the same launch date. Cards without that evidence retain their route identity.

During summary preparation, Product Hunt items also check their own Product Hunt product/post page for an explicitly associated repository. The product's `githubUrl` (or a repository used as its primary website) becomes optional `repo_url` frontmatter in both languages. Profiles, comment links and recommended products are excluded. Product pages, including results with no repository, are cached for six hours; `summarize --source producthunt --refresh` checks the source again and reuses unchanged summaries. `--rebuild` also regenerates summaries. A transient page failure retains an already verified repository for the same product route. Repository-only updates reuse the accepted summaries and item paths without another model call. Captured responses, the last successful repository check timestamp (repositoryCheckedAt), and the last network attempt timestamp (repositoryLastAttemptAt) remain in the local database. Cache hits do not count as network attempts.

## Hacker News

Hacker News summary preparation also retrieves the linked public HTML/text article and a bounded discussion sample. Mozilla Readability extracts article prose without executing scripts or loading page resources. Short originals (up to 600 characters) render as verbatim excerpts of at most 25 words/240 characters; substantial originals receive a bilingual article summary. Discussions receive their own bilingual synopsis, selected comment links and a full-thread link (`discussion_url` in frontmatter). Article facts and commenter opinions remain separate. Article pages cache for six hours; HN story/comments cache for one hour. A failed refresh retains previously accepted evidence for the same article and original feed text. PDF/media-only pages and inaccessible originals retain the supplied post text and available discussion.

HN comments follow the API's ranked display order, with up to six valid top-level comments from eight candidates and one contextual reply for each of up to four threads. Deleted/dead comments and mismatched parents are excluded; selection is bounded and does not imply consensus. The [official HN API](https://github.com/HackerNews/API) supplies display rank but no individual comment score. Linked article requests bind a validated public IP to each direct connection or proxy CONNECT, including robots and redirect requests. Host, TLS identity verification and NO_PROXY matching retain the original domain. IPv6 endpoints must be global unicast, excluding reserved identifiers, documentation and IPv4 tunneling ranges. Requests respect robots rules and never crawl onward from article/comment links. Public-only fetching supports direct connections and HTTP(S) proxies; unsupported proxy transports fail closed. Local DNS must supply trustworthy, reachable addresses; a proxy cannot silently replace them with its own DNS answers, and failed connections never fall back to an unpinned hostname. Captured source responses remain in SQLite. The trusted `hackernews.md` skill extension and discussion text participate in the HN summary cache key; other sources keep their existing skill identity.

## X

X includes all 26 configured builders; without explicit cookies, the public fallback remains a limited daily sample of up to three posts per account, excluding replies and complete threads. Coverage reports include the sample generation timestamp; samples older than 36 hours are stale. Missing accounts or zero matches do not establish no activity. The configured cookie channel can fail over to this sample; no credentials are inferred or installed automatically.

## Anthropic

Official HTML and sitemap discovery require article metadata (`og:type=article` or Article/BlogPosting/NewsArticle structured data) and an article body before producing an item. Category pages remain discovery links even if they contain an `<article>` wrapper and heading. A genuine article without a verifiable date uses its first observation. Engineering also discovers `/research/...` links in its main list; the sitemap fallback requires an Engineering section marker before admitting a research URL and reports the number of article pages skipped outside that section. Unknown article layouts report failed/partial coverage instead of a misleading successful empty result.

Explicit non-article and outside-section decisions are cached per source and stream for seven days, then rechecked when their URLs appear in discovery again. Each run checks at most 50 detail pages: up to ten expired decisions first, followed by fresh URLs, with remaining slots available for further rechecks. Older decisions without a check timestamp are immediately due. A newly valid article keeps its real source date; normal summary/publication windows still apply, so rechecking does not authorize expired-item backfill. These informational skips and first-observation date notes do not create coverage gaps. Inaccessible or unrecognized pages remain retryable and report incomplete coverage. Body validation removes navigation, headers, footers, scripts and styles first; a paragraph in page chrome is not article evidence.

## GitHub, Reddit and arXiv date semantics

GitHub Trending and its repository-search fallback are discovery snapshots, dated by first observation. Search is based on recent pushes and total stars; it is not a substitute Trending ranking. GitHub is enabled in the checked-in configuration.

Reddit continues to collect weekly Top RSS snapshots and select daily Top 50 candidates by their original dates; a weekly feed does not imply that every entry belongs to yesterday. Already published items survive later ranking changes.

arXiv API dates represent submission dates, and the existing lexical keyword filter still applies. Delayed public availability can put an item outside a strict yesterday window even in an evening run. Product Hunt leaderboard items use the start of their source-local day in America/Los_Angeles, converted to an instant; they are not exact launch timestamps. The [daily task policy](daily-updates.md) keeps those date bases and intentionally does not backfill expired candidates.

## Related documentation

- [Configuration](configuration.md)
- [Podcasts](podcasts.md)
- [Summaries and content](summaries.md)
