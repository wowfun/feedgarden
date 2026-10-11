---
publish: true
content_type: "post"
title: "做了一个可直接替换 GitHub Pages 的服务"
description: "一位开发者构建并发布了一个可直接替换 GitHub Pages 的服务。它提供与 GitHub Pages 相同的功能，并在其上增加了一个私有仪表盘，用于查看页面日志和统计数据。由于它是常规的 Web 服务器，作者表示还可以在其上添加 Web 服务、WebSocket 和数据库。 部署被描述为只需在现有工作流中改动两行代码，另外还提供一个助手来引导用户完成该过程。自定义域名是可行的，但尚未自动化，作者请有需要的用户直接发私信联系。 该项目使用 Opus 5.5 在 xhigh"
date: "2026-10-09T13:47:18.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1ltic/built_a_dropin_replacement_for_github_pages/"
tags: ["source/reddit","topics/coding","topics/products"]
---

一位开发者构建并发布了一个可直接替换 GitHub Pages 的服务。它提供与 GitHub Pages 相同的功能，并在其上增加了一个私有仪表盘，用于查看页面日志和统计数据。由于它是常规的 Web 服务器，作者表示还可以在其上添加 Web 服务、WebSocket 和数据库。

部署被描述为只需在现有工作流中改动两行代码，另外还提供一个助手来引导用户完成该过程。自定义域名是可行的，但尚未自动化，作者请有需要的用户直接发私信联系。

该项目使用 Opus 5.5 在 xhigh 级别下、约半小时内完成，是在 GenHTTP Lambda 已有托管能力和 API 之上的一层薄封装。作者估计生成过程消耗了 20 万 token，另有 20 万 token 用于测试和修复 bug，并认为这样的结果相当令人印象深刻。

## 图片与视频

- [图片: Built a drop-in replacement for GitHub Pages](<https://preview.redd.it/lxmpcnhr4guh1.png?width=640&crop=smart&auto=webp&s=da4ac4a5146e384e18ebef394f3fd6252f808491>)
