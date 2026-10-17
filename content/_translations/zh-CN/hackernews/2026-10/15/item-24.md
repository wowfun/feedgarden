---
publish: true
content_type: "post"
title: "OpenCode 2.0"
description: "评论整体偏正面，但对「哪些真正是新功能」以及代价存在分歧。一位从早期就在用 V2 的用户称赞其易用性、客户端/服务端模型，以及智能体可以编辑自身配置并编写插件的能力。他还特别提到项目的 GitHub 问题处理流程：接入的应用会读取缺陷报告，在被提到的版本和最新开发分支上测试，并把结果连同复现脚本一起评论出来，对于 TUI 缺陷还会录制视频。 有回复质疑「客户端/服务端」的说法，指出这在 V1 就已存在，变化的只是它成了默认方式，而且仍有两个不同命令启动不同的服务。另一位..."
date: "2026-10-14T20:48:24.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://anoma.ly/notes/opencode-2-0/"
discussion_url: "https://news.ycombinator.com/item?id=50094994"
tags: ["source/hackernews","topics/coding","topics/agents","topics/security-privacy"]
---

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论整体偏正面，但对「哪些真正是新功能」以及代价存在分歧。一位从早期就在用 V2 的用户称赞其易用性、客户端/服务端模型，以及智能体可以编辑自身配置并编写插件的能力。他还特别提到项目的 GitHub 问题处理流程：接入的应用会读取缺陷报告，在被提到的版本和最新开发分支上测试，并把结果连同复现脚本一起评论出来，对于 TUI 缺陷还会录制视频。

有回复质疑「客户端/服务端」的说法，指出这在 V1 就已存在，变化的只是它成了默认方式，而且仍有两个不同命令启动不同的服务。另一位评论者列出了具体改进：技能与插件自动重载、任务可放到后台、内置用于编辑配置的技能、前端打磨、子会话通信更好，以及配置从创建会话的目录加载而非服务器启动目录。他还提到循环据称围绕 Effect 重构。

反对意见集中在风险上。一位用户表示 V2 的烦人之处更多，已改用其他 harness，并认为让智能体修改插件并立即重载是安全定位上的错配。有人询问 OpenCode 是否支持类似 Claude Code 自动权限模式的机制，因为逐条批准命令会打断节奏；有回复表示改为在虚拟机中运行完全放开的模式。也有人欢迎「一切皆插件」的方向，并指出 V1 时期的许多变通做法如今已成为原生功能。

评论来源：[ghrl](https://news.ycombinator.com/item?id=50099588) · [c-hendricks](https://news.ycombinator.com/item?id=50103728) · [solarkraft](https://news.ycombinator.com/item?id=50096138) · [verdverm](https://news.ycombinator.com/item?id=50096829) · [moretti](https://news.ycombinator.com/item?id=50100763) · [Lucasoato](https://news.ycombinator.com/item?id=50100234)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50094994>)
