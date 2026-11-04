---
publish: true
content_type: "post"
title: "Ubuntu 仍未为 Linux 0day RCE 漏洞发布补丁，近三周无更新"
description: "Ubuntu 尚未为 CVE-2026-98432 发布修补内核，该漏洞被评定为 CVSS 9.8 级别严重漏洞，导致 22.04、24.04 和 26.04 LTS 版本在披露近三周后仍无官方更新。运行这些版本的用户没有可关闭该漏洞的官方内核软件包。暴露风险在依赖 Ubuntu LTS 内核进行隔离与权限边界的面向互联网及多租户自托管系统中最突出；在更新包出现之前，这些主机仍可能遭受该 CVE 所允许的远程或本地攻击。Ubuntu 尚未公布修复时间表。在此期间，管理员..."
date: "2026-11-02T18:39:38.000Z"
updated: "2026-11-04T14:11:39.510Z"
first_seen: "2026-11-04T14:11:54.614Z"
date_basis: "published"
feed_source: "hackernews"
feed_source_id: "50341462"
source_url: "https://freenode.net/article/ubuntu-lts-kernels-still-unfixed-for-critical-cve-2026-98432"
discussion_url: "https://news.ycombinator.com/item?id=50341462"
tags: ["source/hackernews","topics/linux","topics/security-privacy"]
---

## 正文提炼

Ubuntu 尚未为 CVE-2026-98432 发布修补内核，该漏洞被评定为 CVSS 9.8 级别严重漏洞，导致 22.04、24.04 和 26.04 LTS 版本在披露近三周后仍无官方更新。运行这些版本的用户没有可关闭该漏洞的官方内核软件包。暴露风险在依赖 Ubuntu LTS 内核进行隔离与权限边界的面向互联网及多租户自托管系统中最突出；在更新包出现之前，这些主机仍可能遭受该 CVE 所允许的远程或本地攻击。Ubuntu 尚未公布修复时间表。在此期间，管理员需自行决定是继续使用原厂内核、在存在的情况下应用内核外缓解措施，还是将工作负载迁移至已包含补丁的版本或内核。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论者围绕 Ubuntu 的延迟是否可接受以及用户在此期间能做什么展开讨论。debinguy 提出在 raw PREROUTING 中使用 iptables/nftables 的 U32 丢包规则作为临时缓解；lambdaone 回应称 Linux 管理员虽可自行缓解，但发行版的本意是让用户不必承担这种负担。lambdaone（50350034）认为仅此一次失败就足以将 Ubuntu 排除为可行发行版，因为志愿者驱动的发行版能比资金充裕的公司更快打补丁。c0l0 要求官方解释延迟原因，wolvoleo 猜测 Ubuntu 在等待补丁窗口，组织治理拖慢了响应。majorchord 指出 RHEL 记录了仅能降低暴露的缓解措施，而 Ubuntu 未提供任何缓解。样本显示在厂商责任问题上存在分歧，部分用户考虑转向 Debian，且对自应用变通方案能否替代厂商补丁并无共识。

评论来源：[debinguy](https://news.ycombinator.com/item?id=50346903) · [lambdaone](https://news.ycombinator.com/item?id=50350053) · [lambdaone](https://news.ycombinator.com/item?id=50350034) · [c0l0](https://news.ycombinator.com/item?id=50343405) · [wolvoleo](https://news.ycombinator.com/item?id=50347675) · [majorchord](https://news.ycombinator.com/item?id=50341463)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50341462>)
