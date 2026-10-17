---
publish: true
content_type: "post"
title: "Linus Torvalds 首个由大模型辅助的补丁系列"
description: "有评论者指出，该补丁系列附带一条提交信息，说明代码、测试程序、所列改动背后的复核以及文本初稿，都是在作者指导下由大模型编程助手（Claude Code）完成的，而测量则在他自己的机器上运行。 多位评论者认为这条消息并不像表面那样令人意外。有人提出，Torvalds 早已转向主要审阅和管理代码库，而不是亲自编写内核代码，不过他大概仍会在业余时间写自己的小项目。也有人指出，这些 diff 规模适中、可读性好，不同于人们用大模型常常提交的数千行补丁。 一个反复出现的主题是流程..."
date: "2026-10-14T16:55:07.000Z"
updated: "2026-10-15T15:41:45.488Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://lwn.net/Articles/1100449/"
discussion_url: "https://news.ycombinator.com/item?id=50090842"
tags: ["source/hackernews","topics/ai-code-policy","topics/open-source","topics/linux"]
---

## HN 热门讨论

根据 10 条选取的评论与回复整理。

有评论者指出，该补丁系列附带一条提交信息，说明代码、测试程序、所列改动背后的复核以及文本初稿，都是在作者指导下由大模型编程助手（Claude Code）完成的，而测量则在他自己的机器上运行。

多位评论者认为这条消息并不像表面那样令人意外。有人提出，Torvalds 早已转向主要审阅和管理代码库，而不是亲自编写内核代码，不过他大概仍会在业余时间写自己的小项目。也有人指出，这些 diff 规模适中、可读性好，不同于人们用大模型常常提交的数千行补丁。

一个反复出现的主题是流程而非工具。一位评论者说，进入 Linux 的补丁通常先经过维护者和子系统负责人两层过滤。另一位引用 Torvalds 的补丁接受政策：代码仍须由维护者审计；而且机器生成的代码无法获得版权，因而不能算开源，所以补丁必须主要由人完成才能进入内核。还有评论者把使用 AI 与滥用 AI 区分开来——生成代码并人工审查是站得住脚的，而把粗浅审阅过的程序当作自己的成果提交则不可接受。

评论来源：[manbash](https://news.ycombinator.com/item?id=50092522) · [tarkin2](https://news.ycombinator.com/item?id=50091497) · [niemandhier](https://news.ycombinator.com/item?id=50092905) · [overfeed](https://news.ycombinator.com/item?id=50100300) · [DiabloD3](https://news.ycombinator.com/item?id=50091555) · [ASalazarMX](https://news.ycombinator.com/item?id=50093289)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50090842>)
