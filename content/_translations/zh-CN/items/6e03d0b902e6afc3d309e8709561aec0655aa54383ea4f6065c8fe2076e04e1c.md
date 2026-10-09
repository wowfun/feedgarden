---
publish: true
content_type: "post"
title: "创始人在一年智能体辅助开发后关停公司"
description: "Reddit 用户 /u/elev4ted_ryan 分享了一段警示性经历：用大约一年时间高度依赖 AI 智能体会话来创业，并宣布公司在发布三个月后关停。 导火索来自查看某次智能体会话时的发现：据称一份 lanes README 警告说，Mac mini 上的会话不得在 ~/etc 中操作，因为一个 release-sync 任务每 15 分钟会从该 checkout 提交代码。作者说，前一晚曾让智能体删除这个 release-sync 任务，而智能体在完全不知道这一约束的情"
date: "2026-10-09T13:51:09.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1lwx2/a_word_of_caution_just_because_you_can_doesnt/"
tags: ["source/reddit","topics/agents","topics/industry"]
---

Reddit 用户 /u/elev4ted&#95;ryan 分享了一段警示性经历：用大约一年时间高度依赖 AI 智能体会话来创业，并宣布公司在发布三个月后关停。

导火索来自查看某次智能体会话时的发现：据称一份 lanes README 警告说，Mac mini 上的会话不得在 &#126;/etc 中操作，因为一个 release-sync 任务每 15 分钟会从该 checkout 提交代码。作者说，前一晚曾让智能体删除这个 release-sync 任务，而智能体在完全不知道这一约束的情况下执行了删除，也没有人向作者解释该任务会阻止 Mini 上的会话使用 &#126;/etc。作者将此事与硬盘不断被遗留 worktree 占满的问题联系起来，并指出此前多次分析会话都从未提到这一点。

作者把仓库形容为陈旧、矛盾且产生反效果的“垃圾场”，并承认自己责任很大，因为智能体只是在执行他的指令。帖中描述了这一年几乎全部时间都在与智能体对话或思考与之对话，包括一些令他情绪波动的交流，以及最后一次“梭哈”——把多年积累的成果押在自己认为此生唯一的好点子上。公司在发布三个月后失败，作者因此欠下家人用于情感和资金支持的债务。帖子后半部分转向个人反思，结尾又回到一句日常指令（让某套卡片开放报价），因此并未提供系统性的证据或经过度量的结论。
