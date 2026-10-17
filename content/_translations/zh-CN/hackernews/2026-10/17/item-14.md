---
publish: true
content_type: "post"
title: "用 Claude 设计更高效的量子电路"
description: "Anthropic 称，仅向 Claude 提供自然语言规格说明，它便为八个量子电路给出了设计；这些任务来自化学、优化、物理模拟和数论。Anthropic 表示，这些设计优于已发表的最佳电路，部分情况下提升达一个数量级甚至更多。一个自动化评估器会检查每个设计是否正确并为其打分；Claude 基本自主工作，把电路当作代码来编写、运行和修改。该项目由 Andi Gu 在 Anthropic 的 STEM Fellows 项目中主导，Alek Kemeny 担任指导，并与哈佛..."
date: "2026-10-16T18:00:18.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:46:51.389Z"
date_basis: "published"
source_url: "https://www.anthropic.com/research/designing-efficient-quantum-circuits"
discussion_url: "https://news.ycombinator.com/item?id=50121939"
tags: ["source/hackernews","topics/quantum-physics","topics/agents","topics/research"]
---

## 正文提炼

Anthropic 称，仅向 Claude 提供自然语言规格说明，它便为八个量子电路给出了设计；这些任务来自化学、优化、物理模拟和数论。Anthropic 表示，这些设计优于已发表的最佳电路，部分情况下提升达一个数量级甚至更多。一个自动化评估器会检查每个设计是否正确并为其打分；Claude 基本自主工作，把电路当作代码来编写、运行和修改。该项目由 Andi Gu 在 Anthropic 的 STEM Fellows 项目中主导，Alek Kemeny 担任指导，并与哈佛大学的 Susanne Yelin 和 Mikhail Lukin（后者同时任职于 QuEra）合作；完整论文发布在 arXiv 上。

背景是资源稀缺。量子计算机用量子比特存储信息，并利用叠加等量子现象，但迄今建成的机器只有数百到数千个量子比特，且对热、振动甚至宇宙射线高度敏感，误差会不断累积。因此研究者重新设计算法，力求用更少的量子比特、在更短时间内完成计算。文章以固氮酶核心的铁硫簇 FeMoco 为例：2017 年的估计认为，计算其基态能量需要约 50 万亿个 Toffoli 门，这种门开销很高，其数量常被用来估算运行时间。经过一系列算法改进，这一估计已降至约 3.4 亿个门，减少约 15 万倍，相当于在未来约 300 万个物理量子比特的机器上计算数小时。这些下降主要来自电路重新设计，而非硬件进步。

Claude 适合这类任务，部分原因是量子算法以由门组成的电路实现，而电路可以用代码描述，因此其编程能力可用于编写、运行和改进设计。Anthropic 表示，此类改进会大幅降低有用应用所需的量子资源，实用量子计算机可能比此前预期更早到来。需要说明的是，比较对象是此前已发表的设计，收益仍取决于尚不存在的未来硬件；FeMoco 的门数下降来自此前的算法工作，并非本次实验的结果。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论者主要讨论方法为何有效以及比较是否公平。keeganryan 认为该工作建立在 Google 的 Kickmix 语言之上——一种面向可经典模拟量子电路的汇编语言，优化电路类似代码高尔夫；LLM 受益于闭环验证，能快速测试并放弃想法，他还称这类深度优化很适合自动化。jacquesm 用“信封原则”形容 AI 擅长填补已有知识范围内的空白。adastra22 质疑：去掉只处理极罕见输入所需的组件，是否还算执行同一计算？perching&#95;aix 回应称，文章已明确说明这类优化适用于哪些情况，且其中一个例子是用它节省内存而非计算量。cgio 问为何未引用 Bennet（1973）；whoishiding 则概括称，通过重建临时数据和替换为更好的算法，操作数最多降低 17 倍和 12 倍。

评论来源：[keeganryan](https://news.ycombinator.com/item?id=50122821) · [jacquesm](https://news.ycombinator.com/item?id=50123200) · [adastra22](https://news.ycombinator.com/item?id=50127006) · [perching&#95;aix](https://news.ycombinator.com/item?id=50127774) · [cgio](https://news.ycombinator.com/item?id=50127890) · [whoishiding](https://news.ycombinator.com/item?id=50122490)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50121939>)

## 媒体

![图片: Figure 2: Claude designed smaller and faster circuits across eight different quantum-circuit design tasks. Gray marks show the best previously published designs; orange marks and lines show Claude’s designs. Point addition, the eighth task,](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Fd5d27ec3f141696918c6bed3f6b887f5b84e75f0-3840x2430.png&w=3840&q=75>)

[图片: Figure 2: Claude designed smaller and faster circuits across eight different quantum-circuit design tasks. Gray marks show the best previously published designs; orange marks and lines show Claude’s designs. Point addition, the eighth task,](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Fd5d27ec3f141696918c6bed3f6b887f5b84e75f0-3840x2430.png&w=3840&q=75>)

![图片: Table 1: Resources for elliptic-curve point addition. Bold rows are Claude’s designs; the others are the best previously published designs. Sources: Schrottenloher &#40;2026&#41;, Luo et al. &#40;2026&#41;.](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F7e8a0d4b9d7e826f25379d351ee6d2cab3900f84-3840x1052.png&w=3840&q=75>)

[图片: Table 1: Resources for elliptic-curve point addition. Bold rows are Claude’s designs; the others are the best previously published designs. Sources: Schrottenloher &#40;2026&#41;, Luo et al. &#40;2026&#41;.](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F7e8a0d4b9d7e826f25379d351ee6d2cab3900f84-3840x1052.png&w=3840&q=75>)

![视频: Figure 1: Closed–loop quantum circuit optimization. Claude designs new implementations in Python, which are then sent to a programmatic evaluator. The evaluator checks whether the proposed implementation is correct, then scores it on the nu](<https://cdn.sanity.io/files/4zrzovbb/website/0e9f7b41ac662fb1b2544315dc7cae1967f1fff8.mp4>)

[视频: Figure 1: Closed–loop quantum circuit optimization. Claude designs new implementations in Python, which are then sent to a programmatic evaluator. The evaluator checks whether the proposed implementation is correct, then scores it on the nu](<https://cdn.sanity.io/files/4zrzovbb/website/0e9f7b41ac662fb1b2544315dc7cae1967f1fff8.mp4>)
