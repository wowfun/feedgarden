---
publish: true
content_type: "post"
title: "EngramEdit：通过条件记忆实现大语言模型的解耦知识更新"
description: "一篇新论文提出 EngramEdit，通过编辑条件记忆而非 Transformer 主干来更新大语言模型中的事实知识。 DeepSeek Engram 等条件记忆架构利用输入 n-gram 查询已学习的嵌入，以有限的额外计算扩展模型容量。作者认为，这种设计可以把事实知识存储与通用计算解耦，从而提供在保持主干不变的情况下更新事实的路径。难点在于：同一事实的不同表述可能激活不同的 n-gram 嵌入，而更新共享嵌入又可能无意中改变模型对其他事实的预测。 EngramEdit 首先"
date: "2026-10-09T06:45:52.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1eb7w/paper_engramedit_decoupled_knowledge_updates_in/"
tags: ["source/reddit","topics/research","topics/models"]
---

一篇新论文提出 EngramEdit，通过编辑条件记忆而非 Transformer 主干来更新大语言模型中的事实知识。

DeepSeek Engram 等条件记忆架构利用输入 n-gram 查询已学习的嵌入，以有限的额外计算扩展模型容量。作者认为，这种设计可以把事实知识存储与通用计算解耦，从而提供在保持主干不变的情况下更新事实的路径。难点在于：同一事实的不同表述可能激活不同的 n-gram 嵌入，而更新共享嵌入又可能无意中改变模型对其他事实的预测。

EngramEdit 首先计算目标记忆表示，使模型在多种表述下都预测更新后的事实。随后联合更新共享的 n-gram 嵌入，使其在多种表述和多次编辑中匹配这些目标，并对频繁复用的嵌入施以更强的更新惩罚，以保留无关知识。

实验结果显示，该方法通过条件记忆实现独立的事实知识更新，编辑成功率接近完美。修订后的知识可用于未见过的表述和多跳推理，在思维链提示下准确率接近最强基线的三倍。即使事实更新不断累积，无关知识和通用能力据称也基本得以保留。作者将这一结果视为把条件记忆转变为可编辑知识接口，使其作用超出模型规模化。源代码、论文 PDF 与项目资源见原帖链接。

## 图片与视频

- [图片: &#91;Paper&#93; EngramEdit: Decoupled Knowledge Updates in LLMs through Conditional Memory](<https://preview.redd.it/cv4ijqtw0euh1.png?width=140&height=57&auto=webp&s=a50e0150d8cfb6701ceaec3c3ac33887dde66670>)
