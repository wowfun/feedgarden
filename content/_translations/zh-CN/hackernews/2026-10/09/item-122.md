---
publish: true
content_type: "post"
title: "Hetzner Cloud 网络栈——历史与技术概览"
description: "评论者大多把这篇文章当作技术史来读。有人指出该架构类似基于 VXLAN 的 BGP EVPN，只不过 VTEP 下沉到虚拟机管理程序而非机架顶部交换机，这与 OpenStack 的网络架构相似。另一位评论者回忆自己在 2014 年前后实现过 Open vSwitch，并谈到为了让有状态中间件满足需求，不得不靠反向工程来收集需求。 另一条讨论线围绕存储盒吞吐量。一位使用 1000/400 光纤的用户称实际只有约 3 MB/s，导致分配到的 10 TB 几乎用不上；有回复认为问题"
date: "2026-10-09T12:20:55.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://www.hetzner.com/blog/the-hetzner-cloud-network-stack-history-and-technical-overview/"
discussion_url: "https://news.ycombinator.com/item?id=50019451"
tags: ["source/hackernews","topics/inference","topics/hardware","topics/communication"]
---

## HN 热门讨论

根据 8 条选取的评论与回复整理。

评论者大多把这篇文章当作技术史来读。有人指出该架构类似基于 VXLAN 的 BGP EVPN，只不过 VTEP 下沉到虚拟机管理程序而非机架顶部交换机，这与 OpenStack 的网络架构相似。另一位评论者回忆自己在 2014 年前后实现过 Open vSwitch，并谈到为了让有状态中间件满足需求，不得不靠反向工程来收集需求。

另一条讨论线围绕存储盒吞吐量。一位使用 1000/400 光纤的用户称实际只有约 3 MB/s，导致分配到的 10 TB 几乎用不上；有回复认为问题不在 Hetzner，而是部分 ISP 对 Hetzner 存储盒公网接口限速，并建议改用 Hetzner 服务器的直连通道，或通过家中 VPN、并发 WebDAV（HTTPS）来提升速度。还有评论者认为其虚拟机更便宜、配置更强，但也提到一次长达 13 小时的中断，并对照自己在 Digital Ocean 的 12 年经历。关于定价存在分歧，有回复认为不满价格的人直接换供应商即可。以上均为个人经验与观点，并非文章结论。

评论来源：[publlus&#95;enigma](https://news.ycombinator.com/item?id=50021051) · [jerrythegerbil](https://news.ycombinator.com/item?id=50022855) · [throw0101a](https://news.ycombinator.com/item?id=50020706) · [Lucasoato](https://news.ycombinator.com/item?id=50019954) · [segmondy](https://news.ycombinator.com/item?id=50022153) · [tasuki](https://news.ycombinator.com/item?id=50019925)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50019451>)
