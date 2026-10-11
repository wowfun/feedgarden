---
publish: true
content_type: "post"
title: "用新的索引策略扩展并压测关键消息总线"
description: "本文是 Jane Street 2026 年暑期实习项目系列文章之一。Aria 是该公司内部的通信框架与托管系统，每天处理数 TB 数据，客户端可以订阅实时消息流。随着使用量快速增长，团队需要重新架构以应对数据量和吞吐的上升。实习生 Theodor Totev 今年的重点是降低客户端只读取部分消息的成本，他的优化在生产负载上带来了 30% 的 CPU 使用率下降，同时保持了此类关键系统对正确性的极高要求。 问题出在 tip recovery（追平游标）上。Aria 通过 TC"
date: "2026-10-08T17:39:26.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://blog.janestreet.com/scaling-and-benchmarking-a-critical-message-bus/"
discussion_url: "https://news.ycombinator.com/item?id=50009066"
tags: ["source/hackernews","topics/coding","topics/research"]
---

## 正文提炼

本文是 Jane Street 2026 年暑期实习项目系列文章之一。Aria 是该公司内部的通信框架与托管系统，每天处理数 TB 数据，客户端可以订阅实时消息流。随着使用量快速增长，团队需要重新架构以应对数据量和吞吐的上升。实习生 Theodor Totev 今年的重点是降低客户端只读取部分消息的成本，他的优化在生产负载上带来了 30% 的 CPU 使用率下降，同时保持了此类关键系统对正确性的极高要求。

问题出在 tip recovery（追平游标）上。Aria 通过 TCP 向客户端投递消息，并把最近的消息流（称为 stream tip）保存在内存环形缓冲区中，以便落后的客户端请求近期消息、追上进度。但 Aria 存储的是完整消息流，而客户端往往只关心其中很小的子集。消息流按主题划分，形成类似文件系统的层级命名空间，客户端既可订阅单个主题，也可订阅某个主题子树（类似 globstar）。Aria 最初用简单的线性遍历过滤整个流：虽然算法上低效，但线性循环对 CPU 缓存友好，速度尚可。随着执行追平的客户端增多，一些服务器的 CPU 利用率达到 100%，客户端因此“掉出 tip”而无法追上。增加服务器只是临时措施，追平相关代码最终必须重写。

解决方案是引入用于过滤的索引数据结构。由于单个 Aria 实例可能拥有近百万个主题，为每个主题建索引不可行；团队改为按 topic partition 建索引，一个 partition 指共享相同两段前缀的所有主题，其中一段是主题名中以斜杠分隔的一个部分，因此 app/codestore/commits 和 app/codestore/features 同属 app/codestore 这个 partition。每个 partition 的索引记录其消息在 Aria 流中的位置；当客户端请求消息时，Aria 用最小堆对这些索引做 n 路归并，从而按顺序仅针对这些 partition 重建消息流。基准测试被放在首位：实习生写了一个工具来剖析各种追平场景，调整 topic partition 数量、交错程度和读者数量等变量。对初版实现的分析显示，最小堆是最大的瓶颈，文章在此继续展开后续内容。

## HN 热门讨论

根据 4 条选取的评论与回复整理。

评论者总体认可这一方案，同时补充了保留意见。有人指出其中的巧合：金融机构的面试常常涉及最小堆问题，因此这支团队对该任务是异常“有备而来”。另一位赞同按前缀分区并用 1024 条目的池化块，以避免最坏情况下约 2 GB 的索引膨胀。一条回复同意线性扫描在规模下会失效，但认为取舍因场景而异：如果能证明无法优于线性扫描，而线性扫描的准确度在业务上又有价值，那么选择极其简单、对 CPU 友好的算法可能是更好的决定。第四位评论者提醒，消息总线类似单点故障；把所有内容发布到总线上或许没问题，但应尽量减少订阅者数量。

评论来源：[rtpg](https://news.ycombinator.com/item?id=50016325) · [soltanov](https://news.ycombinator.com/item?id=50016064) · [hansvm](https://news.ycombinator.com/item?id=50016269) · [jgalt212](https://news.ycombinator.com/item?id=50019616)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50009066>)

## 图片与视频

- [图片](<https://blog.janestreet.com/scaling-and-benchmarking-a-critical-message-bus/image2.png>)
- [图片](<https://blog.janestreet.com/scaling-and-benchmarking-a-critical-message-bus/image6.png>)
