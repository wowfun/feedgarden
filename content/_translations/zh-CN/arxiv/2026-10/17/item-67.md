---
publish: true
content_type: "post"
title: "为连续扩散语言模型设计 Transformer 架构"
description: "连续扩散语言模型（CDLM）提供了一条并行生成文本的路径，但现有研究大多直接套用因果大语言模型或图像扩散 Transformer（DiT）的架构，而这些架构并未针对 CDLM 优化。论文系统研究了适用于 CDLM 的 Transformer 架构，并提出 Language Diffusion Transformer（LangDiT）。 LangDiT 结合了特征归一化与查询—键归一化、更宽的噪声条件注入、似然捷径梯度路由与校准，以及置信度门控的训练自条件机制。作者将 L..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22330"
tags: ["source/arxiv","topics/models","topics/research","topics/inference"]
---

连续扩散语言模型（CDLM）提供了一条并行生成文本的路径，但现有研究大多直接套用因果大语言模型或图像扩散 Transformer（DiT）的架构，而这些架构并未针对 CDLM 优化。论文系统研究了适用于 CDLM 的 Transformer 架构，并提出 Language Diffusion Transformer（LangDiT）。

LangDiT 结合了特征归一化与查询—键归一化、更宽的噪声条件注入、似然捷径梯度路由与校准，以及置信度门控的训练自条件机制。作者将 LangDiT 作为 LangFlow（一种代表性的 CDLM）的即插即用骨干网络进行评估，在与 LangFlow 匹配的对比中显著降低了生成困惑度，并在不同模型形式下刷新了连续语言生成的当前最佳水平。

在 OpenWebText 数据集上对 1,024 个 token 序列做无条件生成时，LangDiT 在使用 1,024 次函数评估（NFE）时达到 21.72 的生成困惑度（GenPPL），使用 128 次 NFE 时为 44.72。将其适配到 Plaid 风格的 CDLM 形式后，使用 1,024 次去噪 NFE 时 GenPPL 为 11.33，使用 128 次去噪 NFE 时为 27.51。

作者强调，这些提升是在保留各模型底层表示、训练目标和推理采样器的前提下取得的，因此可以把改进归因于 Transformer 架构本身。摘要没有报告实际耗时、模型规模，也没有与自回归语言模型进行比较；证据限于无条件生成任务上的困惑度。
