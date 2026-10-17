---
publish: true
content_type: "post"
title: "Show HN：我写了一个每个收件箱只接收一个发件人的邮件应用"
description: "一篇 Show HN 帖子介绍了一个围绕“无限收件箱”构建的邮件服务：地址按需创建，每个地址被设计为只接收来自单一发件人的邮件。 作者描述了三种收件箱类型。单发件人收件箱会锁定到第一个给它发信的域名；对 Gmail、Outlook 等大型服务商则出于明显原因锁定到具体邮箱账号，其余发件人一律被退回。临时收件箱在选定时长（24 小时、7 天等）后失效并退信，已收到的邮件是保留还是删除由用户选择。帖子称前缀类型最强大：声明一个如 “service” 的前缀后，用户可以随意编..."
date: "2026-10-14T17:00:59.000Z"
updated: "2026-10-15T15:41:45.488Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://clova.email/"
discussion_url: "https://news.ycombinator.com/item?id=50090932"
tags: ["source/hackernews","topics/security-privacy","topics/products"]
---

## 正文提炼

一篇 Show HN 帖子介绍了一个围绕“无限收件箱”构建的邮件服务：地址按需创建，每个地址被设计为只接收来自单一发件人的邮件。

作者描述了三种收件箱类型。单发件人收件箱会锁定到第一个给它发信的域名；对 Gmail、Outlook 等大型服务商则出于明显原因锁定到具体邮箱账号，其余发件人一律被退回。临时收件箱在选定时长（24 小时、7 天等）后失效并退信，已收到的邮件是保留还是删除由用户选择。帖子称前缀类型最强大：声明一个如 “service” 的前缀后，用户可以随意编造后缀，例如 service-netflix 或 service&#36;bank，每个新后缀会自动创建单个发件人收件箱，并锁定给第一个来信者。

该服务支持自带域名、转发，以及自带 AI 的设置，已就绪 MCP 服务器。作者请读者帮忙测试。

帖子本身没有说明定价、垃圾邮件检测细节，也未涉及品牌换域名的情况，相关内容只出现在作者后续的回复中。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

一个核心反对意见是：企业经常使用多个地址和子域名发送合法邮件——评论者举了花旗银行和美国银行的例子——因此把收件箱锁定到第一个发件人会静默丢弃重要邮件。作者回复说，锁定的是域名，而不是发件人或子域名，所以这两个例子仍会被接受；同时系统还提供永久收件箱，任何人都可发信，被垃圾邮件污染后可以删除。

在被问到品牌换域名的情况（例如公司从 facebook.com 转到 meta.com）时，作者表示目前尚不支持。他正在考虑几种方案：提供一个按钮释放锁定、让下一个发件人重新锁定；手动添加关联域名（作者认为对用户负担太重，并举例某公司会用两个域名发信）；或允许多达数个域名并让用户手动屏蔽。

在身份验证方面，一位评论者询问是否检查 DMARC 对齐，并警告否则伪造的 From 地址会通过，同时指出 gmail.com 和 outlook.com 使用 p=none。作者确认已实现 DMARC、SPF、DKIM 和垃圾邮件检查。

评论来源：[CrendKing](https://news.ycombinator.com/item?id=50097977) · [edpin2000](https://news.ycombinator.com/item?id=50098770) · [zatkin](https://news.ycombinator.com/item?id=50093861) · [edpin2000](https://news.ycombinator.com/item?id=50094551) · [CreepyHunterX](https://news.ycombinator.com/item?id=50103275) · [edpin2000](https://news.ycombinator.com/item?id=50103777)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50090932>)
