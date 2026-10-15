---
publish: true
content_type: "post"
title: "Show HN：Edi Life OS——自带 AI MCP 服务器的自托管生活仪表盘"
description: "Edi Life OS 是一个自托管仪表盘，把十个工作区整合到同一套设计、同一个登录入口和同一个数据库之下，目标是取代互不相通的一堆待办、习惯、预算、番茄钟和笔记应用。作者强调的设计取向是“连接”而非“收集”：习惯会推动目标进度，看板卡片会出现在日历中，概览页则把各项活动汇总成单一的每日效率评分。 十个工作区包括：概览（效率评分、专注与习惯趋势、财务以及七日天气预报）、成长（六个生活维度关联长期目标与 SMART 目标、习惯和任务，并提供每周、每月、每季度复盘）、专注（..."
date: "2026-10-09T00:02:19.000Z"
updated: "2026-10-10T05:10:37.706Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/edrisranjbar/lifeos"
discussion_url: "https://news.ycombinator.com/item?id=50014150"
tags: ["source/hackernews","topics/agents","topics/products","topics/open-source"]
---

## 正文提炼

Edi Life OS 是一个自托管仪表盘，把十个工作区整合到同一套设计、同一个登录入口和同一个数据库之下，目标是取代互不相通的一堆待办、习惯、预算、番茄钟和笔记应用。作者强调的设计取向是“连接”而非“收集”：习惯会推动目标进度，看板卡片会出现在日历中，概览页则把各项活动汇总成单一的每日效率评分。

十个工作区包括：概览（效率评分、专注与习惯趋势、财务以及七日天气预报）、成长（六个生活维度关联长期目标与 SMART 目标、习惯和任务，并提供每周、每月、每季度复盘）、专注（含短休与长休的计时会话、会话历史与专注配乐）、财务（按用户所选货币记录支出、收入与预算，默认货币为托曼；应收应付的一次性或周期性账目可直接记入总账）、Habittify（每日习惯、连续打卡与月度进度）、看板（可拖拽卡片，支持优先级、标签、日期、清单、评论和附件）、日历、目标、Notepad 与便签。日期遵循 Asia/Tehran 时区；天气卡片通过 Open-Meteo 显示格什姆岛，作者提示其潮汐数值为模型估算，不可用于导航。

可选的 MCP 服务器开放 15 个工具，覆盖仪表盘、目标、任务、习惯、财务和笔记，可接入 Claude Desktop、Claude Code 或任何 MCP 客户端，用自然语言完成诸如“创建一个带任务的 SMART 目标”“把今天的阅读习惯标记完成”“记录一笔消费并查看余额”等操作。作者表示，MCP 服务器只通过受令牌保护的 HTTP API 访问应用，绝不经手数据库或凭据。

部署要求 PHP 8.1+（含 pdo&#95;mysql 与 mbstring）以及 MySQL 8+ 或 MariaDB 10.4+。既可走 Docker Compose（MySQL、应用和附件各占独立卷，pull 之后重建不会丢数据），也可下载 release zip 部署到共享主机，后端目录置于网站根目录之上。作者称其无订阅、无跟踪、无供应商锁定；项目通过 GitHub 分发。

## HN 热门讨论

根据 8 条选取的评论与回复整理。

评论者大多认可这个想法，但对实现提出质疑。有人表示自己让 Claude 对该代码做过评审，结果“并不客气”，指出了他二十年未见的反模式；另有回复为选择普通 LAMP 而非庞大的 node&#95;modules 依赖树辩护，认为老技术栈启动依然更快。另有讨论质疑为何不直接用 Notion 模板，作者回应说如果 Notion 适合你就很好，但对他并不适用。还有评论者建议只给智能体应用的只读数据库权限，让它们直接对服务发起普通 HTTP 调用，并称服务若采用本地优先加同步引擎会很好用。另外两人介绍了相近的做法：在 Notion 前面加一层带更新规则的 MCP，再用第二个 MCP 经 Tailscale 访问；以及一个面向个人健康数据的类似项目。

评论来源：[ceejayoz](https://news.ycombinator.com/item?id=50014531) · [soltanov](https://news.ycombinator.com/item?id=50015857) · [armanckeser](https://news.ycombinator.com/item?id=50019833) · [hmyn](https://news.ycombinator.com/item?id=50016165) · [edris0077](https://news.ycombinator.com/item?id=50016779) · [GaiusCoffee](https://news.ycombinator.com/item?id=50015964)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50014150>)

## 媒体

![图片: Growth workspace with six life dimensions and SMART progress](<https://github.com/edrisranjbar/lifeos/raw/main/docs/media/growth.webp>)

[图片: Growth workspace with six life dimensions and SMART progress](<https://github.com/edrisranjbar/lifeos/raw/main/docs/media/growth.webp>)

![图片: Habit checklist with a seven-day completion chart](<https://github.com/edrisranjbar/lifeos/raw/main/docs/media/habittify.webp>)

[图片: Habit checklist with a seven-day completion chart](<https://github.com/edrisranjbar/lifeos/raw/main/docs/media/habittify.webp>)

![图片: Kanban board with backlog, in progress, review and done columns](<https://github.com/edrisranjbar/lifeos/raw/main/docs/media/kanban.webp>)

[图片: Kanban board with backlog, in progress, review and done columns](<https://github.com/edrisranjbar/lifeos/raw/main/docs/media/kanban.webp>)
