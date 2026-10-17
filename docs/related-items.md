# Related coverage

## Candidates and evidence

Related coverage considers public articles from the rolling last 72 hours on both sides. Local title/summary bigram recall requires at least three shared bigrams and 1% overlap with the smaller bigram set, then proposes up to eight candidates per article. It spends the shared budget on the strongest matches first. These conservative floors remove incidental matches; they do not establish semantic relevance or guarantee a particular reduction in calls. The model must establish the same specific event or a direct follow-up with exact evidence from both texts; shared topics alone and transitive links are insufficient. Up to six confirmed cards appear newest first. No candidate means no model call. Evidence stays private; `content/_recommendations.json` publishes only paths and expiry. The theme resolves localized public targets, preserves manual related links, and expires automatic cards between builds. Automatic recommendations require JavaScript.

Recommendation rendering follows persisted changes to verdicts, article hashes, paths, expiry values and policy. Time passing alone does not trigger a full render or publication. The manifest may retain expired entries until the next content change or explicit render; the theme omits them when building HTML and hides automatic cards at expiry in an open browser. Private evidence edits alone do not change the render revision.

`content/_recommendations.json` is generated metadata, not an article. Archive maintenance protects it, and rendering replaces it from private judgments. External content tools should select Markdown articles and exclude this manifest from article parsing; do not edit it as an authored archive.

## Recall cost

Recall indexes each bigram to its article postings and counts each unordered intersection once. It keeps at most eight candidates per article without capping the recent article set. Memory grows with the indexed grams and article count. Runtime follows the sum of squared posting lengths, so a window dominated by shared vocabulary can still take quadratic work; the index does not guarantee subquadratic time. Normal windows contain a few hundred recent publications, while large imports should be profiled. Discovery still walks the stored Markdown tree to find articles within the 72-hour window.

## Run relation tasks

Use `npm run feedgarden -- relate` to judge published articles. Scheduled runs perform relations after summaries, giving summaries and transcript tasks first use of the shared daily 80-call allowance. Relations can use all remaining calls; there is no separate per-run relation quota. A large backlog is deferred when that shared allowance is exhausted, and candidates older than 72 hours cease to be eligible. Rendering/building never calls the model.

## Related documentation

- [Summaries and content](summaries.md)
- [Podcasts](podcasts.md)
- [Site features](site.md)
