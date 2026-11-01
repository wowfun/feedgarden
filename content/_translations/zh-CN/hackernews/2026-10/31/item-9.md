---
publish: true
content_type: "post"
title: "Bunny CDN 安全事件"
description: "Bunny CDN 上周披露了一起安全事件，起因是其基础设施提供商 Gcore 报告称，涉及第三方服务器管理软件的未授权访问事件。位于亚美尼亚的一个 CDN 节点托管在该供应商的服务器上受到影响。Bunny 工程团队在 20 分钟内采取行动：停止向该节点路由流量、保留相关安全日志以供调查、安全擦除服务器、撤销其对其他系统的访问权限，并将该服务器永久从基础设施中移除。 双方调查均未发现 Bunny 服务器或其数据遭到未授权访问的证据，但也无法完全排除这种可能性。如果确实发..."
date: "2026-10-30T19:05:22.000Z"
updated: "2026-11-01T15:39:43.305Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://status.bunny.net/incidents/p6gf1by9kr7m"
discussion_url: "https://news.ycombinator.com/item?id=50308697"
tags: ["source/hackernews","topics/security-privacy","topics/cloud-computing"]
---

## 正文提炼

Bunny CDN 上周披露了一起安全事件，起因是其基础设施提供商 Gcore 报告称，涉及第三方服务器管理软件的未授权访问事件。位于亚美尼亚的一个 CDN 节点托管在该供应商的服务器上受到影响。Bunny 工程团队在 20 分钟内采取行动：停止向该节点路由流量、保留相关安全日志以供调查、安全擦除服务器、撤销其对其他系统的访问权限，并将该服务器永久从基础设施中移除。

双方调查均未发现 Bunny 服务器或其数据遭到未授权访问的证据，但也无法完全排除这种可能性。如果确实发生访问，可能暴露的信息包括临时缓存的 CDN 内容、Pull Zone 配置以及存储在服务器上的 TLS 证书。作为预防措施，Bunny 已撤销并重新颁发了 bunny.net 平台域名（b-cdn.net 和 bunny.run）的所有 TLS 证书，目前正在为自管的自定义域名重新颁发证书，预计很快完成。对于自行管理 TLS 证书的客户，Bunny 建议使用新的私钥撤销并重新颁发证书。受影响服务器上并未存储账户数据、内部系统或其他客户数据。

此次事件仅限于一个 POP 节点，根源是第三方供应商的系统被入侵，而非 Bunny 自身系统出现漏洞。Bunny 表示将持续监控基础设施并与该供应商合作调查，如有新进展将通过邮件和状态页面及时更新。

## HN 热门讨论

根据 9 条选取的评论与回复整理。

讨论集中在责任归属和客户影响上。一位评论者澄清，事故源自亚美尼亚的基础设施提供商 Gcore，而非 Bunny 本身，指出标题可能具有误导性。其他人则关注实际后果，尤其是使用自管 TLS 证书的客户需要主动撤销并重新颁发证书以作预防。有技术背景的评论者认为，响应时应更注重全面保留取证证据，而不是过早擦除服务器；另一位评论者则称赞 Bunny 的响应迅速且专业。这些观点既体现了对事件范围的安抚，也反映了客户对自身补救措施的担忧。

评论来源：[eraclide](https://news.ycombinator.com/item?id=50309394) · [ptsneves](https://news.ycombinator.com/item?id=50309480) · [evan&#95;a&#95;a](https://news.ycombinator.com/item?id=50310944) · [colonCapitalDee](https://news.ycombinator.com/item?id=50309403)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50308697>)
