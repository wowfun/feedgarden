---
publish: true
content_type: "post"
title: "IneqAgent：结合符号计算的 Lean 智能体不等式证明"
description: "论文提出 IneqAgent，一个将大语言模型推理与符号计算结合、用于在 Lean4 中证明不等式的框架。引理级蒙特卡洛树搜索协调三项工作：构造引理、改写目标以及选择符号计算后端。平方和、Bernstein 和逐次差分代换三种后端生成精确证书，并转化为局部 Lean 证明。智能体再将这些证明与大语言模型生成的步骤结合，利用 Lean 的反馈组装完整证明，并对照原始定理陈述而非仅中间目标进行检查。 在四个基准上，使用 DeepSeek-V4-Flash 的 IneqAge..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20681"
tags: ["source/arxiv","topics/agents","topics/research"]
---

论文提出 IneqAgent，一个将大语言模型推理与符号计算结合、用于在 Lean4 中证明不等式的框架。引理级蒙特卡洛树搜索协调三项工作：构造引理、改写目标以及选择符号计算后端。平方和、Bernstein 和逐次差分代换三种后端生成精确证书，并转化为局部 Lean 证明。智能体再将这些证明与大语言模型生成的步骤结合，利用 Lean 的反馈组装完整证明，并对照原始定理陈述而非仅中间目标进行检查。

在四个基准上，使用 DeepSeek-V4-Flash 的 IneqAgent 解决了 186 道题中的 175 道，成功率为 94.09%，在受评测方法中总体成功率最高。作者报告，在四个骨干模型上，它在较低的大语言模型推理成本阈值下取得了高于同骨干 Direct Agent 的成功率，并且在各自成功运行中的平均推理成本更低。

该工作还给出了 Dittert 猜想在四维和五维的、经 Lean 验证的加强形式，并证明了 Holens–Djokovic &#40;4,4&#41; 不等式，从而推出四维的 Merris 猜想。结果表明，精确的符号证书可以与 LLM 证明步骤集成，而不是被其替代。
