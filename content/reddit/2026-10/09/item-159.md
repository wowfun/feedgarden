---
publish: true
content_type: "post"
title: "I ran an autonomous coding pipeline for two weeks. It merged 67 PRs, then I shut it down."
description: "A developer built a GitHub Actions workflow in which one model wrote specifications and code, another reviewed both, and agents fixed issues before merging. The workflow was controlled through Telegram. Between September 21 and October 5 it"
date: "2026-10-09T05:03:05.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1cltw/i_ran_an_autonomous_coding_pipeline_for_two_weeks/"
tags: ["source/reddit","topics/agents","topics/coding","topics/evaluation"]
---

A developer built a GitHub Actions workflow in which one model wrote specifications and code, another reviewed both, and agents fixed issues before merging. The workflow was controlled through Telegram. Between September 21 and October 5 it merged 67 agent-authored pull requests, with a median time to merge of 3.3 hours. The developer then shut it down because maintaining the automation became more expensive than using the agents directly.

Three specific failures are cited:
- Maintenance load: 54 distinct changes were made to the automation, producing 129 maintenance PRs across multiple repositories.
- Capacity: the workflow exhausted the account's 3,000 monthly GitHub Actions minutes in about 3.5 days, and jobs stopped without the developer noticing for two days.
- Security: agents that read untrusted content had to be separated from the bot able to perform privileged actions.

The developer reverted to a local workflow in which one model implements, another reviews, and the human makes the final decisions, reporting that this is currently faster and needs less maintenance. The account is a first-hand experience report from a single developer with no baseline comparison, and the author asks how others handle similar setups. The metric definitions &#40;agent-authored PRs, median time to merge&#41; come from the author's own tracking.

## Images and video

- [Image: I ran an autonomous coding pipeline for two weeks. It merged 67 PRs, then I shut it down.](<https://preview.redd.it/93rd20s7jduh1.png?width=640&crop=smart&auto=webp&s=fc3d0e1fb9d7c612c707f6a5c8f3d90d4057f5e1>)
