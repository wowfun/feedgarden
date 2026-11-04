---
publish: true
content_type: "post"
title: "用于超长上下文的新稀疏注意力方法"
description: "一个开源研究项目背后的团队介绍了新的注意力机制方法。他们报告称，可以在不观察到准确率损失的情况下对 Qwen 3.8 27B 的注意力进行稀疏化；将上下文扩展到 1000 万 token 会在某些特定任务上降低准确率，但大多数任务（如 NIAH）仍然表现正常。他们还报告称，稀疏注意力可以仅通过 next-token prediction loss 进行原生训练，并达到与完整注意力相同的验证损失，但速度更快。该工作主要面向 H200/B300 GPU 和更大规模的系统，作..."
date: "2026-11-02T22:24:18.000Z"
updated: "2026-11-04T16:00:39.769Z"
first_seen: "2026-11-04T16:00:42.305Z"
date_basis: "published"
feed_source: "reddit"
feed_source_id: "t3_1xmbj0v"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1xmbj0v/new_sparse_attention_method_for_ultralong_context/"
tags: ["source/reddit","topics/models","topics/inference"]
---

一个开源研究项目背后的团队介绍了新的注意力机制方法。他们报告称，可以在不观察到准确率损失的情况下对 Qwen 3.8 27B 的注意力进行稀疏化；将上下文扩展到 1000 万 token 会在某些特定任务上降低准确率，但大多数任务（如 NIAH）仍然表现正常。他们还报告称，稀疏注意力可以仅通过 next-token prediction loss 进行原生训练，并达到与完整注意力相同的验证损失，但速度更快。该工作主要面向 H200/B300 GPU 和更大规模的系统，作者表示它也可以应用于小型开源权重模型，以降低本地硬件上长上下文的成本。内核、SGLang 集成、论文和详细信息均已开放。
