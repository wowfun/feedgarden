---
publish: true
content_type: "post"
title: "自主编码流水线两周合并 67 个 PR，随后被关停"
description: "一位开发者讲述了自己运行自主编码流水线两周后将其关停的经历，原因是维护自动化本身的成本高于直接使用智能体。 该流水线是一个 GitHub Actions 工作流：Claude 编写规格和代码，Codex 审查两者，智能体在合并前修复问题。开发者通过 Telegram 控制工作流。9 月 21 日至 10 月 5 日期间，它合并了 67 个由智能体编写的 PR，合并时间中位数为 3.3 小时。 过程中出现三个问题。开发者对自动化做了 54 次不同的改动，在多个仓库中产生了 12"
date: "2026-10-09T04:59:35.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1cjf3/i_ran_an_autonomous_coding_pipeline_for_two_weeks/"
tags: ["source/reddit","topics/agents","topics/coding","topics/evaluation"]
---

一位开发者讲述了自己运行自主编码流水线两周后将其关停的经历，原因是维护自动化本身的成本高于直接使用智能体。

该流水线是一个 GitHub Actions 工作流：Claude 编写规格和代码，Codex 审查两者，智能体在合并前修复问题。开发者通过 Telegram 控制工作流。9 月 21 日至 10 月 5 日期间，它合并了 67 个由智能体编写的 PR，合并时间中位数为 3.3 小时。

过程中出现三个问题。开发者对自动化做了 54 次不同的改动，在多个仓库中产生了 129 个维护类 PR。工作流约 3.5 天就用完了每月 3000 分钟的 GitHub Actions 额度，任务停止后开发者两天都没有察觉。由于涉及不可信内容，开发者不得不把读取不可信内容的智能体与可执行特权操作的机器人分离开来。

他改回本地工作流：Claude 实现、Codex 审查、开发者做最终决定。开发者表示目前这样更快、维护更少，并向其他人请教如何处理这一取舍。

## 图片与视频

- [图片: I ran an autonomous coding pipeline for two weeks. It merged 67 PRs, then I shut it down.](<https://preview.redd.it/sanfs9meiduh1.png?width=640&crop=smart&auto=webp&s=aeb0f07b5d27d81a2f722dc154d28b854fae605f>)
