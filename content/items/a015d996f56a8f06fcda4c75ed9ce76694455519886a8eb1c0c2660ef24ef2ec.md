---
publish: true
content_type: "post"
title: "Autonomous coding pipeline merged 67 PRs in two weeks, then was shut down"
description: "A developer describes running an autonomous coding pipeline for two weeks before shutting it down because maintaining the automation cost more than using the agents directly. The pipeline ran as a GitHub Actions workflow: Claude wrote speci"
date: "2026-10-09T04:59:35.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1cjf3/i_ran_an_autonomous_coding_pipeline_for_two_weeks/"
tags: ["source/reddit","topics/agents","topics/coding","topics/evaluation"]
---

A developer describes running an autonomous coding pipeline for two weeks before shutting it down because maintaining the automation cost more than using the agents directly.

The pipeline ran as a GitHub Actions workflow: Claude wrote specifications and code, Codex reviewed both, and agents fixed issues before merging. The developer controlled the workflow through Telegram. Between September 21 and October 5 it merged 67 agent-authored PRs, with a median time to merge of 3.3 hours.

Three problems emerged. The developer made 54 distinct changes to the automation, producing 129 maintenance PRs across multiple repositories. The workflow exhausted the 3,000 monthly GitHub Actions minutes in about 3.5 days, and jobs stopped without the developer noticing for two days. Because untrusted content was involved, the developer had to separate the agents that read untrusted content from the bot that could perform privileged actions.

They switched back to a local workflow: Claude implements, Codex reviews, and the developer makes the final decisions on merging. The developer reports this is currently faster and needs less maintenance, and asks how others handle the same trade-off.

## Images and video

- [Image: I ran an autonomous coding pipeline for two weeks. It merged 67 PRs, then I shut it down.](<https://preview.redd.it/sanfs9meiduh1.png?width=640&crop=smart&auto=webp&s=aeb0f07b5d27d81a2f722dc154d28b854fae605f>)
