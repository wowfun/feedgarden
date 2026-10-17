---
publish: true
content_type: "post"
title: "追踪大模型“口水话”风格在模型中的位置及其产生于哪个训练阶段"
description: "作者的目标是定位那种可识别的助手文风——破折号、“不是 X，而是 Y”句式、三点并列、流行套话、Markdown 排版——在模型内部的位置，并找出是哪个训练阶段把它装了进去。 关于位置：在 Qwen3-4B-Instruct 中，用模型自身夸张写法与朴素写法做均值差得到的方向向量，能分开 64 对手写的最小对立句，且与基于套路（trope）的“口水话”评分在正常输出上相关性最高达 0.82。对数几率透镜（logit lens）读出结果显示出一种“语域轴”，一端是宏大、抽..."
date: "2026-10-14T22:08:02.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:03:12.259Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x64lbk/tracing_where_llm_slop_style_comes_from_in_the/"
tags: ["source/reddit","topics/research","topics/models","topics/generative-media"]
---

作者的目标是定位那种可识别的助手文风——破折号、“不是 X，而是 Y”句式、三点并列、流行套话、Markdown 排版——在模型内部的位置，并找出是哪个训练阶段把它装了进去。

关于位置：在 Qwen3-4B-Instruct 中，用模型自身夸张写法与朴素写法做均值差得到的方向向量，能分开 64 对手写的最小对立句，且与基于套路（trope）的“口水话”评分在正常输出上相关性最高达 0.82。对数几率透镜（logit lens）读出结果显示出一种“语域轴”，一端是宏大、抽象的词汇，另一端是“really”“basically”“stuff”之类的朴素语气词。各套路的向量方向具有跨语言性：“不是 X 而是 Y”这一套路会提升中文“而是”的概率。

关于来源：基座模型已具备同一方向（中间层余弦相似度 0.90 至 0.97），但写作时接近朴素一端。在 OLMo 2 1B 上逐阶段测量发现，监督微调（SFT）引入了这些修辞结构，而 DPO 通过流行套话和 Markdown 排版使口水话评分翻倍。对 OLMo 偏好数据打分，在 3,000 对中有 57% 的被选回答是更“口水”的那一个。

关于消除：方向消融（directional ablation）反而使口水话增加最多 89%，因为干净文本在该轴上的投影为负。在 12 至 23 层做固定向量相减，可保持较小的 KL 预算（在人类文本上约每 token 0.4 nats），并能减少 token 禁用方法无法触及的结构性套路。将其蒸馏为 rank-16 LoRA 后，在无系统提示的情况下把口水话评分降低 83%，KL 比直接引导更低，在一个小型问答检查上也没有下降。

注意事项：口水话评分器是作者自己写的正则检测器；主要结果只基于一个 4B 模型加 OLMo 2 1B；尚无人工评估。作者明确将该工作与 Antislop（Paech 等，2025）定位为互补关系：Antislop 在 token 层面处理口水话，而本工作在表征层面处理。
