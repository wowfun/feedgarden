---
publish: true
content_type: "post"
title: "Fancy Curl Sites"
description: "评论者交流了在同一网址上提供适合终端内容的做法。有人介绍了一种完全静态、无需检测 user agent 的方案：把 ANSI 输出藏进 HTML 注释，并借助备用终端缓冲区，curl 时先写入 HTML，随即清空该缓冲区，再把 ANSI 版本显示到真实屏幕；浏览器则直接忽略注释内容。另一位把这类比为多部分邮件，由客户端渲染能力决定显示纯文本还是 HTML。 也有不同看法：有人主张采用更朴素的方案，让 HTML 保持默认，用 link rel alternate 指向 M..."
date: "2026-10-14T19:29:12.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://nytpu.com/gemlog/2026-03-18"
discussion_url: "https://news.ycombinator.com/item?id=50093612"
tags: ["source/hackernews","topics/coding","topics/products","topics/open-source"]
---

## HN 热门讨论

根据 9 条选取的评论与回复整理。

评论者交流了在同一网址上提供适合终端内容的做法。有人介绍了一种完全静态、无需检测 user agent 的方案：把 ANSI 输出藏进 HTML 注释，并借助备用终端缓冲区，curl 时先写入 HTML，随即清空该缓冲区，再把 ANSI 版本显示到真实屏幕；浏览器则直接忽略注释内容。另一位把这类比为多部分邮件，由客户端渲染能力决定显示纯文本还是 HTML。

也有不同看法：有人主张采用更朴素的方案，让 HTML 保持默认，用 link rel alternate 指向 Markdown 版本，让客户端通过 Accept 请求 text/markdown。该作者称全站（含文章页）均支持，主要为屏幕阅读器、其他设备以及可跳过排版的智能体服务。还有人建议用标准的 Accept: text/html 获取规范页面，并用 text/x-ansi 之类的专用类型标识终端版本，便于 wget 等工具请求；有人回应说希望 curl 和 wget 默认拿到规范表示。

实例方面，有人给出可 curl 的天气服务 wthr.dev/City，仿照 wttr.in 但输出更简单，并自嘲地理编码有时不准、限流很严且服务跑在自家地下室。还有人分享用个人站点返回近期听歌和阅读列表。最后一条提醒：这些 ANSI 技巧在 Windows 上只有用 Terminal（而非 PowerShell 模式）运行才正常。

评论来源：[colewilson](https://news.ycombinator.com/item?id=50095529) · [G&#95;o&#95;D](https://news.ycombinator.com/item?id=50098263) · [tinthedev](https://news.ycombinator.com/item?id=50101448) · [jayknight](https://news.ycombinator.com/item?id=50094314) · [lightandlight](https://news.ycombinator.com/item?id=50095124) · [abound](https://news.ycombinator.com/item?id=50099058)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50093612>)
