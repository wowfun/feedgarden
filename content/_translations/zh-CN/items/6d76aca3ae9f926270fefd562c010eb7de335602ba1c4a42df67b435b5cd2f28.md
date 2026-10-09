---
publish: true
content_type: "post"
title: "我运行了两周的自主编程流水线，合并了 67 个 PR，然后关掉了它"
description: "一位开发者搭建了一条 GitHub Actions 工作流：一个模型编写规格说明和代码，另一个模型对两者进行评审，再由智能体修复问题后合并。该流程通过 Telegram 控制。9 月 21 日至 10 月 5 日期间，它合并了 67 个由智能体编写并提交的 PR，合并时间中位数为 3.3 小时。随后开发者将其关停，因为维护自动化的成本已经高于直接使用这些智能体。 文中列出了三处具体失败： - 维护负担：对自动化做了 54 处不同的修改，在多个仓库中产生了 129 个维护类 P"
date: "2026-10-09T05:03:05.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1cltw/i_ran_an_autonomous_coding_pipeline_for_two_weeks/"
tags: ["source/reddit","topics/agents","topics/coding","topics/evaluation"]
---

一位开发者搭建了一条 GitHub Actions 工作流：一个模型编写规格说明和代码，另一个模型对两者进行评审，再由智能体修复问题后合并。该流程通过 Telegram 控制。9 月 21 日至 10 月 5 日期间，它合并了 67 个由智能体编写并提交的 PR，合并时间中位数为 3.3 小时。随后开发者将其关停，因为维护自动化的成本已经高于直接使用这些智能体。

文中列出了三处具体失败：
- 维护负担：对自动化做了 54 处不同的修改，在多个仓库中产生了 129 个维护类 PR。
- 容量：该工作流在约 3.5 天内耗尽了账户每月 3,000 分钟的 GitHub Actions 配额，任务停止运行，而开发者两天后才发现。
- 安全：必须把读取不可信内容的智能体与能够执行特权操作的机器人分开。

开发者改回本地工作流：一个模型实现，另一个模型评审，由人来做最终决定，并表示目前这样更快、维护更少。这是一位开发者的亲身经历报告，没有基线对比，作者也向他人询问如何处理类似配置。文中指标（智能体编写的 PR、合并时间中位数）来自作者自己的记录。

## 图片与视频

- [图片: I ran an autonomous coding pipeline for two weeks. It merged 67 PRs, then I shut it down.](<https://preview.redd.it/93rd20s7jduh1.png?width=640&crop=smart&auto=webp&s=fc3d0e1fb9d7c612c707f6a5c8f3d90d4057f5e1>)
