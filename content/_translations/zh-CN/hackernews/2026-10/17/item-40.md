---
publish: true
content_type: "post"
title: "为什么智能体运行框架对能源（与 token）效率很重要"
description: "讨论围绕运行框架给模型带来了什么展开。一位评论者认为，未经框架包装的 LLM 只是文本进、文本出；框架给它一套可执行离散动作的“外骨骼”和上下文管理策略，才使大型代码库上的工作变得可行。另一位评论者反对过度追逐缓存命中率，认为这是“古德哈特定律”式的指标偏移：答案准确性更重要，子智能体本就是为了给模型一份干净、无干扰的上下文，即便牺牲缓存也值得。文章作者回应说准确性确实第一，但任务能够完成后，吞吐和成本就成为考虑因素；他把低缓存率主要归因于记忆系统——它们用稳定的前缀换..."
date: "2026-10-16T21:01:23.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:46:51.389Z"
date_basis: "published"
source_url: "https://neuralwatt.com/news/why-harnesses-matter-for-energy-efficiency"
discussion_url: "https://news.ycombinator.com/item?id=50124642"
tags: ["source/hackernews","topics/inference","topics/agents"]
---

## HN 热门讨论

根据 8 条选取的评论与回复整理。

讨论围绕运行框架给模型带来了什么展开。一位评论者认为，未经框架包装的 LLM 只是文本进、文本出；框架给它一套可执行离散动作的“外骨骼”和上下文管理策略，才使大型代码库上的工作变得可行。另一位评论者反对过度追逐缓存命中率，认为这是“古德哈特定律”式的指标偏移：答案准确性更重要，子智能体本就是为了给模型一份干净、无干扰的上下文，即便牺牲缓存也值得。文章作者回应说准确性确实第一，但任务能够完成后，吞吐和成本就成为考虑因素；他把低缓存率主要归因于记忆系统——它们用稳定的前缀换取每轮新增的记忆内容。他引用公司的测量数据称，不同客户的未缓存输入占比在 1.6% 到 11.1% 之间；几乎全未缓存的请求能耗约为同等大小缓存请求的两倍；在 128k token 以上，一轮重读超过一半提示词的预填充开销约等于该深度下 600 个普通轮次。他表示实验室里每一次缓存失效都源于框架改动了已经发送过的内容，例如系统提示中的日期。一位业余框架开发者则希望有廉价的 API 来估算能耗。

评论来源：[ccgibson](https://news.ycombinator.com/item?id=50124690) · [zby](https://news.ycombinator.com/item?id=50125407) · [ccgibson](https://news.ycombinator.com/item?id=50126050) · [ccgibson](https://news.ycombinator.com/item?id=50126038) · [randysalami](https://news.ycombinator.com/item?id=50125355) · [dilippkumar](https://news.ycombinator.com/item?id=50127283)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50124642>)
