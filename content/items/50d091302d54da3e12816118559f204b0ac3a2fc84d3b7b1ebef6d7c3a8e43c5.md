---
publish: true
content_type: "post"
title: "Comparing Haiku 5.5, Sonnet 5.5 and Opus 5.5 as subagents on 6 real tasks"
description: "A user reran six tasks that Opus 5.5 had already completed in their project, using Sonnet 5.5 and Haiku 5.5 with high effort, same prompts and same files, then checked every result against the real answer. Code search (locating every file t"
date: "2026-10-09T06:39:53.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1e7ts/i_tested_haiku_55_sonnet_55_and_opus_55_as/"
tags: ["source/reddit","topics/evaluation","topics/models","topics/inference"]
---

A user reran six tasks that Opus 5.5 had already completed in their project, using Sonnet 5.5 and Haiku 5.5 with high effort, same prompts and same files, then checked every result against the real answer.

Code search &#40;locating every file to change for a new feature, out of 48 files the feature actually touched&#41;: Opus found 45, Sonnet 44, Haiku 44. Costs were Opus &#36;6.17, Sonnet &#36;1.38, Haiku &#36;0.44, so with comparable quality the author concludes Haiku wins on price.

Web research, across three tasks checked against official rulebooks and Google help pages, produced very different error rates. Wrong facts: Opus 1, Sonnet 3, Haiku 10. On Google Play account rules, of 12 key facts, Opus got 12 right, Sonnet 9, Haiku 5. Haiku also failed to open a league's official rulebook PDF and fell back on last season's rules. For fact-checking two blog posts before publishing, real errors found were Opus 8, Sonnet 7, Haiku 4, but sentences that were correct yet wrongly flagged as errors were Opus 0, Sonnet 6 and Haiku 30 — the author says following Haiku's flags would have meant deleting half of a correct post.

Total cost for all five web-related tasks was Opus &#36;3.93, Sonnet &#36;1.59, Haiku &#36;0.12. The author's current routing is Haiku for code search, Opus for research and fact-checking, and Sonnet when small mistakes are acceptable, and asks whether others have compared Sonnet and Opus on research to see if these results hold up. All cost figures come from this single user's runs.
