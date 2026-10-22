# Site features

## Article pages and media

Item detail pages use a wider reading column. Source/topic chips remain visible when the separate global tag index is disabled, and link back to the corresponding archive filter. The original URL sits below those chips and above the body. The header's GitHub icon links to this repository, after the color-scheme control, on desktop and mobile.

Custom frontmatter fields appear below the original URL and above the body, using their original keys. Values render by type: escaped text, clickable HTTP(S) URLs and resolved Wiki links, numbers, booleans, ISO dates, nulls, and flat lists. Empty strings and lists remain visible. Feedgarden's `website.properties.hidden` hides `first_seen` and `date_basis`; `repo_url` and `discussion_url` remain clickable. Built-in page controls and fields with dedicated rendering do not repeat in the property block. Nested lists and mappings are unsupported.

The runner extracts up to six source image, video, audio or PDF candidates; the agent may select up to three useful figures, recordings, documents or demos by their fixed IDs. The shared contract rejects invented or duplicate media references. Selected supported HTTPS media embed under “Media” in the body, with a link to open each source. Recognizable media originals also embed, without duplicating a selected copy of the same URL; ordinary articles retain their original link. Direct files use the URL path's extension, and arXiv `/pdf/` links work without an extension. Images display inline, audio/video use browser controls, PDFs have a viewer and visible fallback, and YouTube/Bilibili/Vimeo/X use the upstream theme's supported embeds. HTTP, unknown video formats and unsupported provider URLs remain links. Builds never fetch these media; playback depends on browser codecs and provider availability. Summaries preserve safe paragraphs/bullets, and media labels are escaped before Markdown rendering. Existing contractVersion 2 artifacts remain readable.

URLs in summary prose remain text, including browser setup addresses such as `chrome://extensions`. The separately validated original and media URLs remain clickable.

## Collections, filters and chronology

The header provides dedicated Podcasts, GitHub and arXiv collection tabs between Home and Favorites. Both languages are generated with the feed, and each collection automatically includes published articles from its source, with date archives, topic filters, and pagination scoped to that collection. A configured source keeps its collection tab even when disabled, so its published history stays accessible. Removing the source stops generating and protecting its collection index pages; retained authored archive copies can then be maintained explicitly.

Home enables `website.home.hide_tab_sources: true`: sources belonging to actual archive tabs (Podcasts, GitHub and arXiv) and their items are excluded initially. “Include tab sources” below Sources reveals both. “Show hidden topics” below Topics reveals configured hidden choices without changing the results. Article labels, search, collection tabs and Favorites retain all history. A selected hidden topic stays visible so it can be cleared.

`include_tabs=1` and `show_hidden=topic` preserve disclosure state through links, pagination, reloads, language changes and browser history. Old links explicitly selecting a tab source automatically include it. Collapsing sources clears selected tab sources and resets the page, retaining other filters. Export inherits the page's state but keeps subsequent changes local to its dialog. Without JavaScript the default first page and counts remain correct, and tab/article links remain usable.

These settings are supported by the pinned `jekyll-obsidian-site` 0.3.1 release. Both themes also provide a Back to top button after scrolling beyond one viewport. [简体中文说明](site.zh-CN.md)

The feed shows 50 cards per page. Sources and topics support multiple selection: OR within a group, AND across groups and chronology. Query parameters preserve selection, page, language switching and browser history. Unknown IDs produce an empty result. Facet and timeline counts describe the current homepage source scope; matching counts are shown separately. The theme writes a small generation manifest, lazy per-facet bitmaps and 50-card chunks. A Worker evaluates queries, network concurrency is capped at four, and resource caching at 20 entries. Failed loads retain the last successful page and offer retry. Search includes the latest 3,000 item titles/tags/summary excerpts; Atom includes 100 items. Full static builds still render every item page.

The archive timeline groups entries by day (`website.blog.timeline_granularity: day`) in the configured `+08:00` timezone. Dates appear newest first with daily counts; selecting a day combines with source/topic filters and resets pagination.

Daily article groups on Home, archive collection tabs and Favorites can be expanded independently. The newest day in the current filtered page opens by default. Headings show the localized month/day, weekday and the number of entries in that group on this page; older years include the year. Dates use the configured +08:00 calendar rather than the browser timezone. Manual open/closed choices survive filters, pagination and browser history until reload. Native date disclosures also work without JavaScript. Closed groups hide loaded reading bodies and defer new article loads until opened.

Minimal and Docs use compact icons for header actions, with localized accessible names and hover hints. Archive and favorites pagination show up to five nearby page links and a numeric jump field; jumping preserves source, topic and date filters.

## Continuous reading and loading

Ledger entries display their descriptions. The header's **Read in full** switch expands the current page's article bodies for continuous reading and follows pagination, filters and language changes. It remembers the preference locally, loads at most four article pages concurrently, and offers a per-article retry. Switching off cancels pending article loads and restores the ledger.

Reading, pagination and export share a four-request budget. Reading keeps a bounded cache of sanitized bodies, and retrying one failed article leaves the other loads running. Export progress counts only successfully loaded bodies; consecutive date edits are combined before querying.

Reading loads articles as they approach the viewport. Export uses Blob parts and reuses successful bodies for repeated downloads while the panel conditions stay unchanged. Each task is limited to 5,000 entries and 64 MiB of decoded Markdown response bytes; exceeding either limit stops it with a prompt to narrow the selection.

## Markdown exports

The header's **Export** icon opens independent source/topic filters initialized from the homepage. Choose both dates, spanning at most seven inclusive calendar days in `+08:00` (`website.blog.export_max_days: 7`). A selected day is used initially; otherwise the range ends on the latest matching item. The count and download cover every matching item across all pages. The current language's complete published Markdown is combined with site/filter details and per-item dates, sources, tags and links into `feedgarden-{locale}-{start}_{end}.md`; media retain their authored embed syntax and source links. At most four resources load concurrently. Cancel or close aborts the task. Any failed body prevents a partial download; retry keeps successfully loaded bodies from that task.

Publish the generated `.md` resources on the same origin. Export accepts `text/markdown`, `text/plain`, `application/octet-stream`, or no Content-Type, and rejects recognizable HTML/XML fallback pages even with HTTP 200. The 64 MiB response budget is not a browser heap limit; decoded strings and the download Blob also use memory. Closing the panel releases retained bodies.

## Favorites

The ledger groups articles by Shanghai calendar date and displays a Save button on each entry and article page. The Favorites tab stores metadata snapshots in this browser, shared between English and Chinese. It retains removed entries with their original links and provides favorite-only filters, chronology, 50-entry pagination and continuous reading for available articles. Browser storage errors are reported without changing the saved collection. Clearing browser storage removes favorites; separate preview and production origins have separate collections.

## Related documentation

- [Related coverage](related-items.md)
- [Topic vocabulary](topics.md)
- [Deployment and publishing](deployment.md)
