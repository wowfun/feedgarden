---
publish: true
content_type: "post"
title: "Show HN：通过存储 KV 状态为 LLM 提供长期记忆与 5000 万 token 窗口"
description: "该帖子介绍了一个记忆层，以公开软件包 galahad-kv 的形式发布。它把每个约 16,000 token 的块的键值（KV）状态保存到本机加密 NVMe 磁盘上，之后再按字节精确地加载回来，而不必重新计算。其出发点是：模型只能使用放得进上下文窗口的文本，而且每次发送提示都要重新计算 KV 状态。 作者在 5000 万个真实公开文本 token 上运行了该记忆层，通过 vLLM 在单张 NVIDIA H100 上服务，模型为 Gemma 4 12B 和 Gemma 4 31"
date: "2026-10-09T09:35:33.000Z"
updated: "2026-10-10T05:10:37.706Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://huggingface.co/papers/2610.10845"
discussion_url: "https://news.ycombinator.com/item?id=50018178"
tags: ["source/hackernews","topics/inference","topics/models","topics/open-source"]
---

## 正文提炼

该帖子介绍了一个记忆层，以公开软件包 galahad-kv 的形式发布。它把每个约 16,000 token 的块的键值（KV）状态保存到本机加密 NVMe 磁盘上，之后再按字节精确地加载回来，而不必重新计算。其出发点是：模型只能使用放得进上下文窗口的文本，而且每次发送提示都要重新计算 KV 状态。

作者在 5000 万个真实公开文本 token 上运行了该记忆层，通过 vLLM 在单张 NVIDIA H100 上服务，模型为 Gemma 4 12B 和 Gemma 4 31B。在 0 到 5000 万 token 的各深度上，抽检的每个块都从加密存储中加载回来且无需重算（两个模型均为 100 次全中）。据报告，加载一个块比重算快 2.8 到 4.3 倍，GPU 能耗低 8.8 到 12.3 倍，而 GPU 内存在整个 5000 万 token 流中保持平稳。在被问及数百万 token 之前埋入的事实时，12B 模型 100 次中答对 82 次，31B 模型 100 次中答对 98 次；两个模型都没有编造答案。

作者说明的局限是：这只是对已存储状态的复用，而非更宽的注意力窗口；一次只加载一个块，回答质量取决于模型。写入记忆是一次性成本，而该存储需要数 TB 的本机 NVMe 磁盘。作者描述了其测试协议，该协议旨在抵御常见的“刷分”长上下文基准测试手法，并提供了一个单 GPU 复现方案，使用公开软件以及该软件包的免费许可。

## HN 热门讨论

根据 1 条选取的评论与回复整理。

一位评论者 Wetime 给出了该项目的 GitHub 仓库 github.com/corbenicai/galahad，并指出单张 GPU 可免费使用。这是提供的唯一一条评论，因此它只是提供了一个实用入口，并未对报告的数字作出独立评估。

评论来源：[Wetime](https://news.ycombinator.com/item?id=50019751)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50018178>)
