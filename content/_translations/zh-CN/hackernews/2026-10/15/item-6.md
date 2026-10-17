---
publish: true
content_type: "post"
title: "我删掉了 16.8 万行注释，AI 智能体毫无察觉"
description: "讨论围绕帖中的删注释实验展开：该代码库约三分之一的内容是注释，作者删掉全部注释后，让 AI 智能体在两个版本上各三次构建相同功能，结果代码质量不分高下。一位评论者提出更细粒度的后续实验：分别删除全部、一半或大部分注释，并用轻微错误或严重错误的注释替换一部分，以找出正确性与 token 消耗的拐点。另一人用“苦涩的教训”来解读结果——通用方法随算力增长胜过依赖领域理解的方法，但有回复反驳称该教训针对的是 AI 研发路径，而非应用层面的 LLM 使用细节。也有人认为质量并非..."
date: "2026-10-14T16:34:53.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://openstation.blog/2026/10/13/i-deleted-168000-lines-of-comments-my-ai-agent-didnt-notice/"
discussion_url: "https://news.ycombinator.com/item?id=50090484"
tags: ["source/hackernews","topics/coding","topics/agents","topics/evaluation"]
---

## HN 热门讨论

根据 7 条选取的评论与回复整理。

讨论围绕帖中的删注释实验展开：该代码库约三分之一的内容是注释，作者删掉全部注释后，让 AI 智能体在两个版本上各三次构建相同功能，结果代码质量不分高下。一位评论者提出更细粒度的后续实验：分别删除全部、一半或大部分注释，并用轻微错误或严重错误的注释替换一部分，以找出正确性与 token 消耗的拐点。另一人用“苦涩的教训”来解读结果——通用方法随算力增长胜过依赖领域理解的方法，但有回复反驳称该教训针对的是 AI 研发路径，而非应用层面的 LLM 使用细节。也有人认为质量并非合适的度量：在维护良好的 AGENTS.md 前提下，差异应体现在工具调用次数和长期可用性上，尤其在复杂度上升、跨会话的场景中，维护得当的注释可能减少无效调用。有评论者质疑这些注释本身是否由 AI 生成，导致智能体读代码时的上下文与写注释时相近，并希望用人写注释再做测试。还有人看重记录“为什么”的注释，因为一次回滚正是靠这类注释定位问题；另一人则指出注释在 OpenAPI 等规范中仍有价值，因为智能体无法从代码直接读到这些信息。

评论来源：[phil-martin](https://news.ycombinator.com/item?id=50091978) · [andyjohnson0](https://news.ycombinator.com/item?id=50092096) · [skeledrew](https://news.ycombinator.com/item?id=50092987) · [huijzer](https://news.ycombinator.com/item?id=50091960) · [sinn357](https://news.ycombinator.com/item?id=50099631) · [benoau](https://news.ycombinator.com/item?id=50092090)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50090484>)
