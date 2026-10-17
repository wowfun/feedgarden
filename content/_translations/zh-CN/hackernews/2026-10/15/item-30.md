---
publish: true
content_type: "post"
title: "LFM2.5-24B-A2B：为快速端侧智能体而打造"
description: "sebmellen 认为宣传的吞吐量数字很亮眼：端侧比同类 MoE 快至多 1.7 倍，Apple M5 Max 上达到 184 tokens/s，单张 NVIDIA B300 上输出可达 2.1 万 tokens/s。但他表示不清楚 AutomationBench 到底测的是什么，因为该模型在其他基准上似乎与别的本地模型相近。 hypfer 表示模型在 4090 上非常快，但「也非常笨」，并认为这是危险的组合，因为它会以 250 tokens/s 的速度删掉生产环境。..."
date: "2026-10-14T23:59:37.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://www.liquid.ai/blog/lfm2-5-24b-a2b"
discussion_url: "https://news.ycombinator.com/item?id=50097369"
tags: ["source/hackernews","topics/models","topics/agents","topics/inference"]
---

## HN 热门讨论

根据 10 条选取的评论与回复整理。

sebmellen 认为宣传的吞吐量数字很亮眼：端侧比同类 MoE 快至多 1.7 倍，Apple M5 Max 上达到 184 tokens/s，单张 NVIDIA B300 上输出可达 2.1 万 tokens/s。但他表示不清楚 AutomationBench 到底测的是什么，因为该模型在其他基准上似乎与别的本地模型相近。

hypfer 表示模型在 4090 上非常快，但「也非常笨」，并认为这是危险的组合，因为它会以 250 tokens/s 的速度删掉生产环境。Tuna-Fish 回复称，如果智能体拥有删除生产环境的权限，问题就不在模型是否聪明。

sorenjan 询问人们到底如何使用这类为智能体场景训练的本地方模型：当作助手、当作调用编码子智能体的快速调度器，还是与云端模型配合。james2doyle 说自己在 OpenCode 中通过 OpenRouter 用它执行大模型写好的计划，效果并不好，大量工具调用卡住，希望调整系统提示能有所改善。

此前使用 Gemma 4 12B 的 MatthiasPortzel 打算测试 Unsloth 量化版本，并指出其许可证中的非商业条款难以执行，令人困惑。

评论来源：[sebmellen](https://news.ycombinator.com/item?id=50097492) · [hypfer](https://news.ycombinator.com/item?id=50101497) · [Tuna-Fish](https://news.ycombinator.com/item?id=50101799) · [sorenjan](https://news.ycombinator.com/item?id=50103653) · [james2doyle](https://news.ycombinator.com/item?id=50104032) · [MatthiasPortzel](https://news.ycombinator.com/item?id=50098829)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50097369>)
