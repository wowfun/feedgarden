---
publish: true
content_type: "post"
title: "将我们的数据仓库迁离 DuckDB"
description: "PostHog 解释了为何在五个月前将数据仓库从 ClickHouse 重建到 DuckDB 之后，现在又把面向客户的数仓产品迁离 DuckDB。此前的切换为每个客户提供了独立的 DuckDB 实例，并允许 dbt 等工具通过 Postgres 连接，但公司低估了客户工作负载的规模与复杂度。现在它希望数仓能在任何规模下以公平价格提供最佳体验，因此花费三个月重新架构，这次不再使用 DuckDB。文章称赞 DuckDB 可能是分析海量数据的最佳单节点工具，可靠且内存不足时可..."
date: "2026-11-02T16:02:26.000Z"
updated: "2026-11-04T14:11:39.510Z"
first_seen: "2026-11-04T14:11:54.614Z"
date_basis: "published"
feed_source: "hackernews"
feed_source_id: "50338747"
source_url: "https://posthog.com/blog/moving-off-duckdb"
discussion_url: "https://news.ycombinator.com/item?id=50338747"
tags: ["source/hackernews","topics/databases","topics/cloud-computing"]
---

## 正文提炼

PostHog 解释了为何在五个月前将数据仓库从 ClickHouse 重建到 DuckDB 之后，现在又把面向客户的数仓产品迁离 DuckDB。此前的切换为每个客户提供了独立的 DuckDB 实例，并允许 dbt 等工具通过 Postgres 连接，但公司低估了客户工作负载的规模与复杂度。现在它希望数仓能在任何规模下以公平价格提供最佳体验，因此花费三个月重新架构，这次不再使用 DuckDB。文章称赞 DuckDB 可能是分析海量数据的最佳单节点工具，可靠且内存不足时可溢写到磁盘，但认为这些本地优势在云端变成负担。单节点引擎必须在查询到达前确定资源规模，而预测特定查询的 CPU 与内存更难；用户不应为此操心。其他瓶颈包括从 S3 大量取数却缺乏异步拉取（DuckDB 近期才加入），以及 DuckLake 湖仓扩展。DuckLake 默认安装，意在让 DuckDB 成为完整数仓。它在一定规模内运行良好，但到了 PostHog 的规模，其需跨多种 SQL 数据库保持可移植的目录 schema 限制了引擎特定优化：单表写入可能超过三分钟，因为每次提交都要重读整个目录的统计信息。目录统计行中超过 99% 属于已删除的表；清理后写入速度提升 30 到 50 倍，但行数会重新增长。元数据数据库的连接数在共享 Postgres 上也有成本。该部署规模约 2 PB，约 1 万亿行与 1530 万快照，出现了难以在 DuckLake 范围内修复的问题；团队在 fork 中维护补丁，失去了社区协作的主要好处。文章还指出，通过 5432 端口提供直接 Postgres 连接比 HTTP 更难扩展，原因包括重连缺失、大规模管理 TTL 与空闲连接困难，以及 pgwire 负载均衡工具稀缺。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论者质疑迁移的反复：Aurornis 指出 PostHog 五个月前从 ClickHouse 迁到 DuckDB，如今似乎又要再迁，希望文章展示迁移前的测试及新方案是否奏效。0c3ca83 认为文章缺乏技术细节与测量。Deukhoofd 担心「两次重写」的信息会让产品用户不安。bitpush 质疑在结果未定前发文，并链接到早先的胜利宣言帖。hasyimibhar 建议利用 ClickHouse 改进的 Iceberg 支持回归 ClickHouse。作者 roboben 澄清这是面向客户的产品，PostHog 内部数仓仍运行在 ClickHouse 上。

评论来源：[Aurornis](https://news.ycombinator.com/item?id=50339465) · [0c3ca83](https://news.ycombinator.com/item?id=50339238) · [Deukhoofd](https://news.ycombinator.com/item?id=50340905) · [bitpush](https://news.ycombinator.com/item?id=50339412) · [hasyimibhar](https://news.ycombinator.com/item?id=50339977) · [roboben](https://news.ycombinator.com/item?id=50341880)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50338747>)
