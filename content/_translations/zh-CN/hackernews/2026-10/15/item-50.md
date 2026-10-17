---
publish: true
content_type: "post"
title: "Show HN：开源结对编程工具 Petal，CoScreen/ScreenHero 精神的延续"
description: "CoScreen 联合创始人 Jason Thomas 介绍了 Petal：这是一款免费、开源的结对编程与屏幕共享工具，由 CoScreen 原团队的四名成员在 Datadog 于 7 月 31 日关停 CoScreen 服务后开发，代码托管在 github.com/kiruna-labs/petal。 作者将其定位为对一种行业循环的回应：Screenhero 于 2015 年被 Slack 收购，独立应用在 2017 年 12 月关闭；Around 被 Miro 收购..."
date: "2026-10-14T18:23:14.000Z"
updated: "2026-10-15T15:41:45.488Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://petal.live/"
discussion_url: "https://news.ycombinator.com/item?id=50092470"
tags: ["source/hackernews","topics/open-source","topics/coding","topics/products"]
---

## 正文提炼

CoScreen 联合创始人 Jason Thomas 介绍了 Petal：这是一款免费、开源的结对编程与屏幕共享工具，由 CoScreen 原团队的四名成员在 Datadog 于 7 月 31 日关停 CoScreen 服务后开发，代码托管在 github.com/kiruna-labs/petal。

作者将其定位为对一种行业循环的回应：Screenhero 于 2015 年被 Slack 收购，独立应用在 2017 年 12 月关闭；Around 被 Miro 收购后于 2025 年 3 月关停；Multi（原 Remotion）在 2024 年被 OpenAI 收购式招聘，约一个月后关停。团队表示 Petal 不做商业化，如果维护者失去兴趣或发生意外，用户可以自行托管或分叉。

功能上，被共享的窗口会以真实的窗口形式出现在桌面上，可移动、可调整大小，而不是网格中的平铺块。多人可以同时共享，每个人都有一个带标签的光标，任何人都能点击进入共享窗口进行输入和滚动。房间是持久化的，因此只需点击一次即可加入「eng-sync」这样的房间，无需传递链接。Petal 支持 macOS 和 Windows，官方表示 Linux 版本是下一步（欢迎参与贡献），另有网页版。媒体流经由 LiveKit；用户可使用官方托管实例实现零配置，也可以通过一个 docker-compose 将应用指向自建的 LiveKit 服务器，甚至换用其他视频后端。

团队提到，CoScreen 的开发用了将近六年，而 Petal 的第一个版本从零开始不到八周就完成了，其中大量实时视频与窗口捕获这类「毫不留情」的代码由前沿模型完成。他们承诺会专门撰文总结哪些做法有效、哪些无效。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

Screenhero 联合创始人兼 CEO 回应说，自己的产品被关停后也有类似感受，现在在做 Pop：他把 2020 年发布的第一个产品称为「Screenhero 2.0」，此后产品扩展为面向远程团队的虚拟办公室；Pop 已支持 Wayland，其中一部分计划开源，Petal 或许可以使用。另一位评论者询问该虚拟办公室与 Gather 相比如何，在这一评论样本中没有得到回答。

CoScreen 联合创始人 Till 感谢 HN 在 2019 年早期阶段的重要反馈，并表示 Linux 支持等未完成的计划如今正在实现。其他人将 Petal 与相近工具比较：有人指出它很像同样以「Screenhero 替代品」为卖点的 Tuple，回复也认为这是该领域另一款出色的应用。一位喜爱结对编程的评论者感叹连 JetBrains 都要停掉 Code With Me 服务，并认为这类工具能增进人与人的连接。一位来自小创业公司的参与者认为它适合远程联合调试，以及带客户排查棘手问题。

评论来源：[jsherwani](https://news.ycombinator.com/item?id=50094088) · [claydiffrient](https://news.ycombinator.com/item?id=50098499) · [coscreen](https://news.ycombinator.com/item?id=50092660) · [joshuat](https://news.ycombinator.com/item?id=50095294) · [lochnessduck](https://news.ycombinator.com/item?id=50095983) · [citizenfishy](https://news.ycombinator.com/item?id=50094634)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50092470>)
