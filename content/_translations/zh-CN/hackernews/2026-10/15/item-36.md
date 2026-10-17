---
publish: true
content_type: "post"
title: "Show HN：Flipflop —— 基于 Iroh 的持久文件共享隧道"
description: "This is a project that spun from my frustrations of using LocalSend and DashBeam to transfer stuff between devices, and with the extra goal of…"
date: "2026-10-15T04:25:28.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://github.com/andunieee/flipflop"
discussion_url: "https://news.ycombinator.com/item?id=50099136"
tags: ["source/hackernews","topics/open-source","topics/communication","topics/security-privacy"]
---

## 原文摘录

> This is a project that spun from my frustrations of using LocalSend and DashBeam to transfer stuff between devices, and with the extra goal of…

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论者把 Flipflop 视为朝去中心化互联网迈出的一步，其中配对是把自己的设备连接起来的关键机制。一条讨论（50100025）指出，该项目依赖 Iroh 库完成 NAT/防火墙打洞、外部地址发现与覆盖网络，并认为在没有中央协调服务器的情况下打通两台 5G 设备虽然可行，但非常困难。

一位 Iroh 维护者（50100678）回复说，他们尚未实现生日悖论式打洞，内部也在争论是否值得做，因此遇到特殊 NAT 时会回退到中继：公共中继、通过其服务租用的中继，或自建中继。他认为，偶尔使用中继的 P2P 社交应用仍优于中心化应用，因为中继只是转发端到端加密连接，无法得知内容。

随后是功能比较与建议。被问及与 Tailscale 的 Taildrop 有何不同时（对应回复 50102454），作者表示 Taildrop 更适合已经在用 Tailscale 的人，而那套方案依赖中央服务器和一个“拥有者”；Flipflop 除了应用本身什么都不需要，每一对节点自成一个无主、无需管理的网络。一位评论者（50100262）称赞浏览器链接功能，便于和同一局域网内没装 Flipflop 的设备共享，并表示若能通过互联网使用将是杀手级特性；作者（50102410）认为这是好主意，自己没想到，打算去实现，并提到据说 Iroh 可在浏览器中通过始终使用中继来运行。另一位评论者（50099862）强调，在网络传输之间保持隧道存活是很好的设计，一旦建立起来就可以直接使用。

评论来源：[synctext](https://news.ycombinator.com/item?id=50100025) · [rklaehn](https://news.ycombinator.com/item?id=50100678) · [andunie](https://news.ycombinator.com/item?id=50102454) · [YCombinedBob](https://news.ycombinator.com/item?id=50100262) · [andunie](https://news.ycombinator.com/item?id=50102410) · [cold&#95;boot](https://news.ycombinator.com/item?id=50099862)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50099136>)
