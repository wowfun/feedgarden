---
publish: true
content_type: "post"
title: "前沿级漏洞：在（或许）变好之前会先更糟"
description: "这是一篇对 Assetnote 联合创始人所做分析的概述，主题是前沿 AI 模型如何改变了攻击性安全。根据该叙述，Claude Opus 4.6–4.8 让研究人员的产出提升到十倍的量级，但前提是进行细致的引导。据说一位哈佛物理学家把 Claude 评为大致相当于二年级研究生的水平。据称于 2026 年 7 月发布的 GPT 5.6 Sol 更进一步，能在几乎没有监督的情况下发现复杂的严重漏洞。 文中举出的一个例子是 wp2shell，即 WordPress Core 中的一"
date: "2026-10-09T07:00:21.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1eje6/frontier_class_vulnerabilities_it_gets_worse/"
tags: ["source/reddit","topics/security-privacy","topics/evaluation","topics/research"]
---

这是一篇对 Assetnote 联合创始人所做分析的概述，主题是前沿 AI 模型如何改变了攻击性安全。根据该叙述，Claude Opus 4.6–4.8 让研究人员的产出提升到十倍的量级，但前提是进行细致的引导。据说一位哈佛物理学家把 Claude 评为大致相当于二年级研究生的水平。据称于 2026 年 7 月发布的 GPT 5.6 Sol 更进一步，能在几乎没有监督的情况下发现复杂的严重漏洞。

文中举出的一个例子是 wp2shell，即 WordPress Core 中的一个预认证远程代码执行漏洞；据称该模型在一个改编自 OpenAI 数学工作的提示下，独自工作 6–10 小时后发现了它。团队如今会在攻击者之前主动搜寻它所说的“让互联网熔化的漏洞”。

作者预计未来数年都会出现令人担忧的漏洞，理由是旧软件长期存在，而漏洞类别很少彻底消失。文章也提出一种可能：用 AI 构建的新软件最终也许会更加安全。需要说明的是，本文中的模型名称、版本号和日期都相当不寻常，属于所链接讨论中的说法，而非已核实的事实。
