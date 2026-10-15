---
publish: true
content_type: "post"
title: "在AI数学进展加速之际，Vitalik Buterin 支持加密行业进入“地堡模式”"
description: "以太坊联合创始人 Vitalik Buterin 支持了以太坊研究员 Justin Drake 提出的警告：人工智能的进展可能会比量子计算机更早地削弱当今区块链所依赖的密码学。Drake 呼吁行业为“地堡模式”做准备，认为 AI 最终可能使破解用于保护加密货币钱包的椭圆曲线数字签名算法（ECDSA）成为可能，并建议将资产有序迁移到公钥尚未暴露的新地址。 Drake 将其担忧归因于 OpenAI 周二发布了涵盖代数、理论计算机科学与数学逻辑等领域的数百项新数学发现。他还提..."
date: "2026-10-08T19:17:51.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://cointelegraph.com/news/justin-drake-urges-crypto-bunker-mode-as-ai-could-break-wallet-security-within-months"
discussion_url: "https://news.ycombinator.com/item?id=50010656"
tags: ["source/hackernews","topics/security-privacy","topics/research","topics/industry"]
---

## 正文提炼

以太坊联合创始人 Vitalik Buterin 支持了以太坊研究员 Justin Drake 提出的警告：人工智能的进展可能会比量子计算机更早地削弱当今区块链所依赖的密码学。Drake 呼吁行业为“地堡模式”做准备，认为 AI 最终可能使破解用于保护加密货币钱包的椭圆曲线数字签名算法（ECDSA）成为可能，并建议将资产有序迁移到公钥尚未暴露的新地址。

Drake 将其担忧归因于 OpenAI 周二发布了涵盖代数、理论计算机科学与数学逻辑等领域的数百项新数学发现。他还提到，最近有一支由 1 万名自主 AI 智能体组成的团队并行工作，仅用 88 小时就解出了被描述为数学与物理学中最著名未解难题之一的纳维-斯托克斯方程。Drake 说：“近期的进展让人类的数学直觉感到谦卑。”他补充说，椭圆曲线可能格外脆弱，因为它们承载着丰富的结构，而哈希函数恰恰被设计为尽量减少代数结构。

Buterin 表示，他不建议任何人现在就急着转移资金，但认为应当认真对待 AI 加速数学给密码学带来的风险。他还把担忧从椭圆曲线扩展到了基于格的密码学，警告那些被认为可抵御量子攻击的系统同样可能被削弱：大多数人一直假设“椭圆曲线已被攻破、哈希安全、格安全”，但未来两年的 AI 数学很可能会严重冲击格密码的具体安全性。他说，这正是以太坊精简路线图走向“仅哈希”方向的一大原因。Dragonfly 管理合伙人 Haseeb Qureshi 称 Drake 的警告是“一次非常清醒的呼吁”，认为风险并非来自量子，而是常规数学推翻了尚未证明的密码学困难性假设。

在具体防范措施上，Drake 建议启动一次可控的资产大规模迁移至新地址，大型且技术成熟的持有者应率先迁移，并建议在完成一笔交易签名后把剩余资金也转到新地址。Buterin 支持这一做法，前提是操作起来并不困难；他说，把资金放在尚未用于交易的地址里是个好主意。但两人都提醒迁移本身存在风险：Buterin 表示，他个人在失败的迁移中损失的钱比所有黑客攻击加起来还多；Drake 则警告，仓促迁移弊大于利。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论者大多把讨论从数学转向了别处。simonw 认为密码学真正的软肋是终端用户的密钥安全：几十年的经验表明，人们无法保护好自己的密钥，而操作系统、浏览器、钱包和个人智能体中又不断涌现大量新漏洞；有回复贴出了相关的 xkcd 漫画。

提议的出处也引发了质疑。int32&#95;64 指出“地堡模式”出自一位以太坊研究员之手，并回想起 DAO 事件时期的链重组，质疑如果领导者可以重组链，强密码学原语还有什么价值。kinakomochidayo 反驳这一说法，称那是由节点运营者同意的、一次不寻常的智能合约状态变更，并补充说中本聪在 2010 年也曾因漏洞多印 1840 亿 BTC 而回滚过链。

也有人质疑事情的严重性和技术判断。gumby 问，若真发生，除了个人损失之外是否会有宏观后果，并说自己把钱放在宽基指数基金里；DaveFr 回应称伊朗用加密货币对通过霍尔木兹海峡的油轮征税，因此确实存在实际影响。notnullorvoid 认为在数学不断进步的情况下把安全性押在哈希上是更糟的选择，而 MattPalmer1086 反驳说哈希的代数结构更少，这正是“抗数学”所需的性质。j2kun 表示，针对后量子密码所依赖的格问题，AI 攻击方面已投入大量努力却毫无成果，他不明白为何现在偏偏担心格问题，除非有内部消息。

评论来源：[simonw](https://news.ycombinator.com/item?id=50011665) · [int32&#95;64](https://news.ycombinator.com/item?id=50011945) · [kinakomochidayo](https://news.ycombinator.com/item?id=50015982) · [gumby](https://news.ycombinator.com/item?id=50012628) · [DaveFr](https://news.ycombinator.com/item?id=50013232) · [j2kun](https://news.ycombinator.com/item?id=50011732)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50010656>)
