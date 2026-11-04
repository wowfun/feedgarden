---
publish: true
content_type: "post"
title: "The “Karpathy” CLAUDE.md clearly changed Claude Code’s behavior on 2 of 4 tasks"
description: "The post reports a small experiment testing a popular CLAUDE.md file (~228k stars, forrestchang/andrej-karpathy-skills) that is not written by Karpathy but is based on his observations. It encodes four rules: think before coding, simplic..."
date: "2026-11-03T03:11:47.000Z"
updated: "2026-11-04T16:00:39.769Z"
first_seen: "2026-11-04T16:03:59.638Z"
date_basis: "published"
feed_source: "reddit"
feed_source_id: "t3_1xmhy1d"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1xmhy1d/the_karpathy_claudemd_clearly_changed_claude/"
tags: ["source/reddit","topics/coding","topics/agents"]
---

The post reports a small experiment testing a popular CLAUDE.md file &#40;&#126;228k stars, forrestchang/andrej-karpathy-skills&#41; that is not written by Karpathy but is based on his observations. It encodes four rules: think before coding, simplicity first, surgical changes, and goal-driven execution. The author ran the same four tasks with and without the file, three runs each, for 24 runs total, using Claude Code 2.1.312 with Opus 5.5 on a small Node.js project with a fresh copy each run. Results varied by task. On a vague date-handling request, all six runs noticed the date ambiguity, but without the file all three wrote code &#40;25-31 lines&#41; and then stated their assumptions, while with the file two of three stopped to ask first; one run with the file made an 8-line change that let unknown date text pass unchanged, which the no-file runs rejected. On a messy file with a discount bug, all six fixed the same single line and left dead code alone; only the three runs with the file added a regression test. On a retry helper, changes were 10-12 lines with the file versus 12-17 without. On a clear bug, there was no difference: all six made the same fix and added a test, and hidden tests Claude never saw passed in both setups. Overall, the two setups took 274 vs 281 seconds and cost &#36;2.56 vs &#36;2.69 by Claude Code's estimate, excluding follow-up time after answering questions. The author notes limits: only three runs per setup, tiny projects, one model, and the repository's last commit was April 2026, so it was not written with Opus 5.5 in mind. They also warn that installing via curl replaces an existing CLAUDE.md and recommend appending instead.

## Media

![Image: The “Karpathy” CLAUDE.md clearly changed Claude Code’s behavior on 2 of 4 tasks](<https://preview.redd.it/52h8y3w5ebzh1.jpeg?width=640&crop=smart&auto=webp&s=f94ba15324366c418cb91b9510df22fb66acfd99>)

[Image: The “Karpathy” CLAUDE.md clearly changed Claude Code’s behavior on 2 of 4 tasks](<https://preview.redd.it/52h8y3w5ebzh1.jpeg?width=640&crop=smart&auto=webp&s=f94ba15324366c418cb91b9510df22fb66acfd99>)
