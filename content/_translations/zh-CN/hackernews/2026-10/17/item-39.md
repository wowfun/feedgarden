---
publish: true
content_type: "post"
title: "我从未授权任何扫描我机密信息的集成"
description: "回应此事的 Home Assistant 开发者为自己轻慢的语气道歉，并说明该密码检查其实早已可用 ha security options --pwned=false 关闭。他表示，这项检查在 Supervisor 中已存在多年，最近才把标记为密码的应用选项纳入检查；只有 SHA-1 哈希的前五个字符会发送给 Have I Been Pwned，匹配在本地完成。 评论者仍认为该功能应当明确征得用户同意并显著提示。有人说用户期待的是家庭自动化系统，而不是扫描密码的工具；也..."
date: "2026-10-16T20:33:41.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:46:51.389Z"
date_basis: "published"
source_url: "https://github.com/home-assistant/home-assistant.io/issues/49314"
discussion_url: "https://news.ycombinator.com/item?id=50124251"
tags: ["source/hackernews","topics/security-privacy","topics/open-source"]
---

## HN 热门讨论

根据 10 条选取的评论与回复整理。

回应此事的 Home Assistant 开发者为自己轻慢的语气道歉，并说明该密码检查其实早已可用 ha security options --pwned=false 关闭。他表示，这项检查在 Supervisor 中已存在多年，最近才把标记为密码的应用选项纳入检查；只有 SHA-1 哈希的前五个字符会发送给 Have I Been Pwned，匹配在本地完成。

评论者仍认为该功能应当明确征得用户同意并显著提示。有人说用户期待的是家庭自动化系统，而不是扫描密码的工具；也有人把未经请求的外部通信称为对信任的背叛，并援引针对 k-匿名密码检查方案攻击的研究，认为截断哈希仍会泄露有用信号。也有人反过来追问：只发送五个哈希字符究竟有什么实际安全风险？还有用户表示，自己从未料到 Home Assistant 会在未配置的情况下联系外部服务。

评论来源：[frenck](https://news.ycombinator.com/item?id=50124797) · [infinite&#95;spin](https://news.ycombinator.com/item?id=50125188) · [rubinlinux](https://news.ycombinator.com/item?id=50126721) · [Arcuru](https://news.ycombinator.com/item?id=50125416) · [cbsks](https://news.ycombinator.com/item?id=50126879)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50124251>)
