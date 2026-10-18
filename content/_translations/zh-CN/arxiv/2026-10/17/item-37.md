---
publish: true
content_type: "post"
title: "以可解释语义表征分解大脑与大语言模型的对齐"
description: "大语言模型能在自然语言理解任务中预测神经反应，但这种“大脑—模型”对齐背后的语言信息难以解释。Camila Kolling 与 Mariya Toneva 的研究以 SCRIBE 为透镜；SCRIBE 是一种可解释的上下文语义表征，覆盖 65 个有神经认知依据的语义属性。 作者对 LLaMA2-7B 与 SCRIBE 在 7 名被试收听 Moth Radio Hour 叙事故事时的自然 fMRI 数据上做方差分解，将两者共享的脑预测方差与各自独有的方差区分开来。结果显示..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21508"
tags: ["source/arxiv","topics/research","topics/models"]
---

大语言模型能在自然语言理解任务中预测神经反应，但这种“大脑—模型”对齐背后的语言信息难以解释。Camila Kolling 与 Mariya Toneva 的研究以 SCRIBE 为透镜；SCRIBE 是一种可解释的上下文语义表征，覆盖 65 个有神经认知依据的语义属性。

作者对 LLaMA2-7B 与 SCRIBE 在 7 名被试收听 Moth Radio Hour 叙事故事时的自然 fMRI 数据上做方差分解，将两者共享的脑预测方差与各自独有的方差区分开来。结果显示，共享方差在全脑和语言相关区域都占主导，同时两种表征仍保留显著的独有贡献。

随后作者考察单个语义属性的具体性（concreteness）与共享方差、SCRIBE 独有方差的关系。在全脑和多数考察区域内，具体属性与 LLaMA2-7B 的共享方差高于抽象属性；但抽象属性并未表现出更大的 SCRIBE 独有方差。对属性进行消融表明，语义贡献分布在多个维度上，并对共享方差和 SCRIBE 独有方差产生累积效应。

作者结论是：在该数据集上，对 LLaMA2-7B 而言，大脑—模型对齐的相当一部分与可解释的语义信息相关；同时分析也揭示了 LLaMA2-7B 表征之外的、具有互补性的脑预测语义信息。
