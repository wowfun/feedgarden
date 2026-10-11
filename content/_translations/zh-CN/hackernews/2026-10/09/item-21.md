---
publish: true
content_type: "post"
title: "Serverless 恐怖故事：10,811.41 美元"
description: "一位开发者称，因某个项目中的 Durable Object 定时器陷入死循环，收到了 Cloudflare 开出的 10,811.41 美元账单。据帖子描述，该循环不断重新调度自身，在账单到来前产生了约 6 万亿次读写。 作者把这归咎于「氛围编程」（vibe coding），并表示这笔账单已全额支付、并未退款。申请减免的工单只得到循环的机器人回复，通过 X 等渠道联系到的客服人员表示只能「看一下」。作者称将把所有项目从 Cloudflare 迁到自建 VPS。 作者指出的结构"
date: "2026-10-08T18:12:49.000Z"
updated: "2026-10-10T06:19:28.614Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://serverlesshorrors.com/all/cloudflare-108k/"
discussion_url: "https://news.ycombinator.com/item?id=50009654"
tags: ["source/hackernews","topics/inference","topics/security-privacy","topics/industry"]
---

## 正文提炼

一位开发者称，因某个项目中的 Durable Object 定时器陷入死循环，收到了 Cloudflare 开出的 10,811.41 美元账单。据帖子描述，该循环不断重新调度自身，在账单到来前产生了约 6 万亿次读写。

作者把这归咎于「氛围编程」（vibe coding），并表示这笔账单已全额支付、并未退款。申请减免的工单只得到循环的机器人回复，通过 X 等渠道联系到的客服人员表示只能「看一下」。作者称将把所有项目从 Cloudflare 迁到自建 VPS。

作者指出的结构性问题是：Cloudflare 没有硬性消费上限，因此没有任何机制限制或中止这轮失控用量。帖子把这件事定位为一次昂贵的教训——把云资源配置与监控交给自己没有完整审查过的代码生成。

## HN 热门讨论

根据 8 条选取的评论与回复整理。

评论者大体认同：云厂商应提供硬性消费上限，对个人账户最好默认开启。有人建议按 10、50、100、500 美元等阈值设置告警与「防火隔离」，用户若一两天不响应就自动停机，同时允许全部关闭。也有人反驳厂商所说的「实现太难」或「万一突然爆红」，认为常规指标监控加余额充值即可解决。一位评论者认为应立法禁止不提供费用上限的云服务，有回复则主张应由市场来解决。实践方面：一位把个人项目放在 6–12 美元的虚拟机上，这样出错最多只损失这么多钱，并称免费额度是陷阱；另一位报告遇到过同样的 Durable Object 重复触发问题，靠 Claude 查看日志在几分钟内发现。

评论来源：[joshstrange](https://news.ycombinator.com/item?id=50010355) · [traceroute66](https://news.ycombinator.com/item?id=50010571) · [moritzwarhier](https://news.ycombinator.com/item?id=50010580) · [mjd](https://news.ycombinator.com/item?id=50010913) · [SwellJoe](https://news.ycombinator.com/item?id=50011353) · [zmj](https://news.ycombinator.com/item?id=50012056)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50009654>)
