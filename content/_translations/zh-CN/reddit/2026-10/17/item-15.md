---
publish: true
content_type: "post"
title: "Claude 撰写了 Claude Code 约 90% 的代码，团队介绍审查方式"
description: "Claude Code 团队介绍了在 Claude 撰写约 90% 自身代码后，他们如何审查代码。现在每一个 PR 都会由 Claude 审查者检查。加入这一环节后，收到真实审查意见的 PR 比例从 16% 升至 54%，需要 5 轮或更多审查的 PR 从 8.9% 降到 1.5%。 文档等低风险改动在自动检查和安全检查通过后，可以不经人工批准直接合并。但智能体的批准永远不能算作人的批准；如果你给智能体下达了提示，你就算作其 PR 的审查者之一。经过 3 轮审查后，审查..."
date: "2026-10-16T19:17:43.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:51:06.644Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x7palj/claude_writes_about_90_of_claude_codes_own_code/"
tags: ["source/reddit","topics/coding","topics/ai-code-policy","topics/agents"]
---

Claude Code 团队介绍了在 Claude 撰写约 90% 自身代码后，他们如何审查代码。现在每一个 PR 都会由 Claude 审查者检查。加入这一环节后，收到真实审查意见的 PR 比例从 16% 升至 54%，需要 5 轮或更多审查的 PR 从 8.9% 降到 1.5%。

文档等低风险改动在自动检查和安全检查通过后，可以不经人工批准直接合并。但智能体的批准永远不能算作人的批准；如果你给智能体下达了提示，你就算作其 PR 的审查者之一。经过 3 轮审查后，审查者会要求作者停下来重新思考方案；帖子提到，曾有一个 PR 在一夜之间经历了 50 多轮审查。

帖子列出了其他团队今天就能照做的做法：
- 在打开 PR 前运行 /code-review 和 /security-review。
- 维护一份 REVIEW.md，说明代码库中真正重要的内容。
- 把审查轮次限制在约 3 轮。

帖子还指出，团队面向 GitHub PR 的 Code Review 已结束测试，但仅在 Team 和 Enterprise 套餐提供。
