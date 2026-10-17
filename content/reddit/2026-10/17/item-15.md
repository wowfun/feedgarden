---
publish: true
content_type: "post"
title: "Claude writes about 90% of Claude Code's own code. Here's how the team reviews it"
description: "The Claude Code team has described how it reviews code now that Claude writes about 90% of Claude Code's own code. A Claude reviewer checks every pull request. After that reviewer was added, the share of PRs with real review comments ros..."
date: "2026-10-16T19:17:43.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:51:06.644Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x7palj/claude_writes_about_90_of_claude_codes_own_code/"
tags: ["source/reddit","topics/coding","topics/ai-code-policy","topics/agents"]
---

The Claude Code team has described how it reviews code now that Claude writes about 90% of Claude Code's own code. A Claude reviewer checks every pull request. After that reviewer was added, the share of PRs with real review comments rose from 16% to 54%, while PRs requiring five or more review rounds fell from 8.9% to 1.5%.

Low-risk changes such as documentation can merge without human approval once automated and security checks pass. However, an agent's approval never counts as a person's, and anyone who prompted an agent is counted as one of the reviewers of the resulting PR. After three review rounds, the reviewer tells the author to step back and rethink the approach; one PR reportedly went through more than 50 review rounds overnight.

The post lists practices other teams can copy today:
- Run /code-review and /security-review before opening a PR.
- Keep a REVIEW.md describing what matters in the codebase.
- Cap review rounds at about three.

It also notes that the team's Code Review for GitHub pull requests is now out of beta, but only on Team and Enterprise plans.
