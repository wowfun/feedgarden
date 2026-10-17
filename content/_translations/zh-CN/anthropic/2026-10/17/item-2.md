---
publish: true
content_type: "post"
title: "用 Claude 设计更高效的量子电路"
description: "量子计算机需要在仍有噪声、只有数百到数千个量子比特的硬件上运行有用算法，而热量、振动等干扰带来的微小误差会不断累积，因此电路设计至关重要。Anthropic 用自然语言向 Claude 描述了八个电路的设计规格，分别来自化学、优化、物理模拟和数论，并提供一个自动评估器来检查和打分。Claude 基本独立工作，给出的设计优于已发表的最佳电路，部分提升达一个数量级甚至更多。这类改进能显著降低有用应用所需的量子资源，使实用量子计算机可能比此前预期更早到来。 该工作由 Andi..."
date: "2026-10-16T17:29:00.000Z"
updated: "2026-10-17T04:55:05.144Z"
first_seen: "2026-10-17T04:47:21.425Z"
date_basis: "published"
source_url: "https://www.anthropic.com/research/designing-efficient-quantum-circuits"
tags: ["source/anthropic","topics/quantum-physics","topics/research","topics/coding"]
---

量子计算机需要在仍有噪声、只有数百到数千个量子比特的硬件上运行有用算法，而热量、振动等干扰带来的微小误差会不断累积，因此电路设计至关重要。Anthropic 用自然语言向 Claude 描述了八个电路的设计规格，分别来自化学、优化、物理模拟和数论，并提供一个自动评估器来检查和打分。Claude 基本独立工作，给出的设计优于已发表的最佳电路，部分提升达一个数量级甚至更多。这类改进能显著降低有用应用所需的量子资源，使实用量子计算机可能比此前预期更早到来。

该工作由 Andi Gu 在 Anthropic 的 STEM Fellows 项目中主导，由公司量子物理学家 Alek Kemeny 指导，并与哈佛大学的 Susanne Yelin、Mikhail Lukin 合作（Lukin 同时任职于 QuEra Computing）；完整论文已发布在 arXiv。

量子硬件的现实让门数量成为关键指标。Toffoli 门是最昂贵的门之一，因此常用来估算计算所需时间。以固氮酶核心的铁硫簇 FeMoco 为例，2017 年研究者估计计算其基态能量需要约 50 万亿个 Toffoli 门；一系列算法改进已把这一数字降到约 3.4 亿个，约 15 万倍的缩减，相当于在未来约 300 万物理量子比特的机器上运行数小时，而这些缩减主要来自电路重新设计，而非硬件提升。Claude 适合这项任务，是因为量子电路可以用代码描述，从而能像普通程序一样编写、运行和修改设计。
