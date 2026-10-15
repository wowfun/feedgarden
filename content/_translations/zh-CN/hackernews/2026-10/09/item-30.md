---
publish: true
content_type: "post"
title: "Cloudflare 使 1.1.1.1 免于盗版封锁，在法国躲过处罚"
description: "过去两年，法国法院命令越来越多的中介机构封锁盗版体育直播流的访问。除普通 ISP 外，这些命令如今还针对公共 DNS 解析器、VPN 服务、搜索引擎和 CDN 提供商，因为它们都能帮助用户绕过已有的封锁。 Cloudflare 已收到多份此类命令。今年 4 月，巴黎司法法院命令其封锁与盗版一级方程式直播相关的 21 个域名以及与 MotoGP 相关的 16 个域名，范围涵盖其 DNS 解析器和 CDN。这些命令并未规定具体方式，只要求“以任何有效手段”阻止来自法国的访问..."
date: "2026-10-08T18:32:52.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://torrentfreak.com/cloudflare-keeps-1-1-1-1-out-of-piracy-blocking-escapes-penalties-in-france/"
discussion_url: "https://news.ycombinator.com/item?id=50009965"
tags: ["source/hackernews","topics/industry","topics/security-privacy"]
---

## 正文提炼

过去两年，法国法院命令越来越多的中介机构封锁盗版体育直播流的访问。除普通 ISP 外，这些命令如今还针对公共 DNS 解析器、VPN 服务、搜索引擎和 CDN 提供商，因为它们都能帮助用户绕过已有的封锁。

Cloudflare 已收到多份此类命令。今年 4 月，巴黎司法法院命令其封锁与盗版一级方程式直播相关的 21 个域名以及与 MotoGP 相关的 16 个域名，范围涵盖其 DNS 解析器和 CDN。这些命令并未规定具体方式，只要求“以任何有效手段”阻止来自法国的访问。提出封锁请求的付费电视台 Canal+ 认为 Cloudflare 的措施不够到位，于是再次诉诸法院。

5 月，Canal+ 请求巴黎法院在 4 月的命令之上附加每日罚款：每个仍可访问的网站每天 5 万欧元，媒体监管机构 Arcom 向 Cloudflare 通报的每个新网站同样如此。Canal+ 声称 Cloudflare 故意不遵守命令，称仅通过 CDN 执行裁决导致法院列出的 21 个一级方程式域名中只有 3 个被封锁，MotoGP 则是 16 个中有 3 个。它还补充说，被封锁的三个网站中有两个在一周后重新上线，一个换用了其他 CDN，另一个使用了镜像站。

9 月 17 日，由三名法官组成的合议庭就两项罚款请求作出裁定，支持了 Cloudflare。法院指出，Cloudflare 仅通过 CDN 对使用该服务的网站实施封锁这一事实并无争议，而且法院明确让该公司自行选择使用哪些服务，只要它对打击盗版有实质性贡献。Cloudflare 向法院表示，CDN 封锁远比 DNS 封锁有效，而其公共 DNS 解析器的架构不允许进行封锁。Canal+ 称被命令封锁的域名中有 72.6% 已被封锁，法院将此视为 Cloudflare 确有诚意协助制止侵权的证据；裁决并未解释这一比例与前述“21 个中仅 3 个”的说法如何对应。

法院还认定，对于换用其他 CDN 或迁移到镜像站的网站，不能归咎于 Cloudflare；应当由 Canal+ 要求新的中介机构封锁它们，并向 Arcom 报告镜像站。合议庭不认同 Canal+ 对欧盟法院 UPC Telekabel Wien 案的解读，认为中介机构只需采取合理措施，而 CDN 封锁已满足这一要求。罚款请求因既不必要也不相称而被驳回，Canal+ 要求赔偿 2 万欧元诉讼费的请求也被拒绝。因此，Cloudflare 在这些命令下不会受到处罚。

## HN 热门讨论

根据 4 条选取的评论与回复整理。

评论者普遍欢迎这一裁决。有人表示，法国无权以打击盗版为名干涉全球 DNS 解析器，这样做主要是让媒体公司获利，同时反而损害了这些公司所依赖的 CDN。

另一位评论者将这场诉讼归因于 beIN Sports 董事长纳赛尔·阿尔赫莱菲，他同时是巴黎圣日耳曼俱乐部主席和卡塔尔体育投资公司董事长；该评论引用了其公开的收入与财富，并提到法国另一起案件中法官命令 VPN 封锁他希望封锁的网站。

第三位评论者把 DNS 解析器比作由去中心化名称服务器集群汇集而成的中继和缓存，并提问它是否应与 debrid 服务归为同类——后者即便串流受版权保护的作品也不惹上麻烦，因为它们只是下载和缓存。对此的一条回复称，这类区分对立法者而言过于复杂，并预测除非选民要求更具技术素养的代表，问题将持续存在——而这位回复者自己也认为这不太可能。

评论来源：[Zenul&#95;Abidin](https://news.ycombinator.com/item?id=50010755) · [miohtama](https://news.ycombinator.com/item?id=50012363) · [himata4113](https://news.ycombinator.com/item?id=50010806) · [richwater](https://news.ycombinator.com/item?id=50010965)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50009965>)

## 媒体

![图片: 50k requested by canal+](<https://torrentfreak.com/images/50k.png>)

[图片: 50k requested by canal+](<https://torrentfreak.com/images/50k.png>)

![图片: Not Cloudflare's responsibility](<https://torrentfreak.com/images/shot-cloudflare-not-responsible.png>)

[图片: Not Cloudflare's responsibility](<https://torrentfreak.com/images/shot-cloudflare-not-responsible.png>)

![图片: transparency report 1.1.1.1 not blocked](<https://torrentfreak.com/images/transparency-notblocked.png>)

[图片: transparency report 1.1.1.1 not blocked](<https://torrentfreak.com/images/transparency-notblocked.png>)
