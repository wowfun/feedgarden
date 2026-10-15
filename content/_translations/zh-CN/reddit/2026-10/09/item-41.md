---
publish: true
content_type: "post"
title: "URM 和 UT 是否已被整合进前沿模型？还是被丢进了被遗忘论文的故纸堆？[D]"
description: "r/MachineLearning 上的一篇讨论帖询问，通用 Transformer（Universal Transformer，UT）和通用推理模型（Universal Reasoning Model，URM）背后的思路是否已被前沿实验室采用，还是仍属于被忽视的研究。帖子附有论文、一篇简化解读博客和一段视频演讲的链接。 帖子复述了 UT 的机制：UT 不堆叠 L 个不同的 Transformer 层，而是反复应用同一个转换模块来不断精炼 token 表示。从嵌入矩阵 ..."
date: "2026-10-08T20:28:20.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:47.429Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x11ufl/have_urms_and_uts_been_integrated_into_frontier/"
tags: ["source/reddit","topics/research","topics/models"]
---

r/MachineLearning 上的一篇讨论帖询问，通用 Transformer（Universal Transformer，UT）和通用推理模型（Universal Reasoning Model，URM）背后的思路是否已被前沿实验室采用，还是仍属于被忽视的研究。帖子附有论文、一篇简化解读博客和一段视频演讲的链接。

帖子复述了 UT 的机制：UT 不堆叠 L 个不同的 Transformer 层，而是反复应用同一个转换模块来不断精炼 token 表示。从嵌入矩阵 H0 出发，它在 T 个步骤中通过层归一化、多头注意力和一个共享的逐位置转换函数（可以是前馈网络或可分离卷积）更新状态。二维正弦嵌入同时编码 token 位置和精炼深度。

关于 URM，帖子引用的图把标准 Transformer 层级堆叠与一种循环设计并列展示：后者包含固定循环、ACT（自适应计算时间）循环和 ConvSwiGLU 模块，并使用作者提出的“跨循环截断反向传播”（TBPTL）训练。帖子称，基于 UT 的小模型在这些任务上从零开始训练、不使用互联网规模预训练，却仍显著优于大多数标准 Transformer 大语言模型；并询问大型前沿实验室是否已实现这些改进。

注意：性能主张和整体表述来自发帖人；来源没有提供独立的基准数值或采用情况的证据。

## 媒体

![视频: https&#58;//www.youtube.com/watch?v=RxNPFCYCFBU](<https://www.youtube.com/watch?v=RxNPFCYCFBU>)

[视频: https&#58;//www.youtube.com/watch?v=RxNPFCYCFBU](<https://www.youtube.com/watch?v=RxNPFCYCFBU>)
