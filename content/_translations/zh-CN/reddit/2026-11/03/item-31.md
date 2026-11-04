---
publish: true
content_type: "post"
title: "“Karpathy” CLAUDE.md 明显改变了 Claude Code 在 4 个任务中的 2 个上的行为"
description: "帖子报告了一项小型实验，测试一个流行的 CLAUDE.md 文件（约 22.8 万星，forrestchang/andrej-karpathy-skills），它并非 Karpathy 本人所写，而是基于他的观察。它包含四条规则：编码前先思考、优先简单、手术式修改、目标驱动执行。作者对有/无该文件两种情况各运行同一组 4 个任务、每组 3 次，共 24 次运行，使用 Claude Code 2.1.312 与 Opus 5.5，在每次运行都用全新副本的小型 Node.j..."
date: "2026-11-03T03:11:47.000Z"
updated: "2026-11-04T16:00:39.769Z"
first_seen: "2026-11-04T16:03:59.638Z"
date_basis: "published"
feed_source: "reddit"
feed_source_id: "t3_1xmhy1d"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1xmhy1d/the_karpathy_claudemd_clearly_changed_claude/"
tags: ["source/reddit","topics/coding","topics/agents"]
---

帖子报告了一项小型实验，测试一个流行的 CLAUDE.md 文件（约 22.8 万星，forrestchang/andrej-karpathy-skills），它并非 Karpathy 本人所写，而是基于他的观察。它包含四条规则：编码前先思考、优先简单、手术式修改、目标驱动执行。作者对有/无该文件两种情况各运行同一组 4 个任务、每组 3 次，共 24 次运行，使用 Claude Code 2.1.312 与 Opus 5.5，在每次运行都用全新副本的小型 Node.js 项目上进行。结果因任务而异。在模糊的日期处理请求中，6 次运行都注意到了日期歧义，但无文件时 3 次都写出代码（25–31 行）后说明假设；有文件时 3 次中有 2 次先停下来询问；有文件的一次运行做了 8 行修改，允许未知日期文本原样通过，而无文件的运行拒绝了这种处理。在含折扣 bug 的混乱文件任务中，6 次运行都只修复了同一行并保留死代码；只有有文件的 3 次运行添加了回归测试。在重试助手任务中，有文件时改动为 10–12 行，无文件时为 12–17 行。在明确 bug 任务中没有差异：6 次运行都做了相同修复并添加测试，Claude 从未见过的隐藏测试在两种设置下都通过。总体上，两种设置分别耗时 274 秒与 281 秒、成本 2.56 与 2.69 美元（按 Claude Code 估算），不包括回答提问后的后续交互。作者指出实验限制：每组仅 3 次运行、项目很小、只用一个模型，且仓库最后一次提交是 2026 年 4 月，因此并非针对 Opus 5.5 编写。他们还警告，通过 curl 安装会覆盖现有的 CLAUDE.md，建议追加而非替换。

## 媒体

![图片: The “Karpathy” CLAUDE.md clearly changed Claude Code’s behavior on 2 of 4 tasks](<https://preview.redd.it/52h8y3w5ebzh1.jpeg?width=640&crop=smart&auto=webp&s=f94ba15324366c418cb91b9510df22fb66acfd99>)

[图片: The “Karpathy” CLAUDE.md clearly changed Claude Code’s behavior on 2 of 4 tasks](<https://preview.redd.it/52h8y3w5ebzh1.jpeg?width=640&crop=smart&auto=webp&s=f94ba15324366c418cb91b9510df22fb66acfd99>)
