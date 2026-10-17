---
publish: true
content_type: "post"
title: "Jev 创造者 Diogo Almeida 谈决策模型，以及聊天模型为何无法可靠自动化"
description: "在本期 The MAD Podcast 中，主持人 Matt Turck 采访了 Diogo Almeida。他曾在 OpenAI 参与共同发明 RLHF，如今是 TypeSafe 的 CEO。本期的主题是 Jev：TypeSafe 将其描述为一种全新的“决策模型”，而不是写文本的模型。据节目介绍，Jev 能在软件内部做出快速、廉价且经过校准的决策；发布后几周内，它成为被广泛复制的模型，OpenAI、Cloudflare、Amazon 和 Databricks 都推出了..."
date: "2026-10-15T11:30:01.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:09:10.734Z"
date_basis: "published"
source_url: "https://podcasters.spotify.com/pod/show/firstmark/episodes/95-Einstein--5-Mr--Bean-Jevs-Creator-on-Why-AI-Cant-Automate-Anything-Reliably-Diogo-Almeida-e3qhl2u"
tags: ["source/podcast","topics/models","topics/agents","topics/inference"]
---

在本期 The MAD Podcast 中，主持人 Matt Turck 采访了 Diogo Almeida。他曾在 OpenAI 参与共同发明 RLHF，如今是 TypeSafe 的 CEO。本期的主题是 Jev：TypeSafe 将其描述为一种全新的“决策模型”，而不是写文本的模型。据节目介绍，Jev 能在软件内部做出快速、廉价且经过校准的决策；发布后几周内，它成为被广泛复制的模型，OpenAI、Cloudflare、Amazon 和 Databricks 都推出了各自的版本。TypeSafe 据称以 75 亿美元估值完成了 8.7 亿美元的 A 轮融资。

Almeida 的核心论点是对“系统一”与“系统二”行为的区分。他认为以推理为主的聊天模型不适合自动化，因为它们在任务层面并不可靠，他用一句话概括为“95% 是爱因斯坦，5% 是憨豆先生”。他把问题追溯到训练方式：RLHF 让模型学会取悦人类，他说这带来了谄媚与拒答，而 RLVR 提升了基准分数，却没有带来可靠的自动化。Jev 改用 RLCD，即面向校准决策的强化学习，去优化他所说的机器原生智能。

Almeida 谈到的具体细节包括：用概率和可调阈值让开发者保留控制权；Jev 建立在开放权重模型之上，训练数据由团队自己制作。他认为“只是个分类器”是一种称赞，分类本身就是 AI 完备的问题，而预训练是在浪费资源。他还解释了产品名背后基于杰文斯悖论的商业模式，表示自己对递归式自我改进持怀疑态度，并认为务实自动化或许能避免他曾担心的 AI 寒冬。此外他批评基准测试没有用处，并讨论了开放权重与 API 之间的取舍。

根据单集节目简介整理。

## 媒体

![音频: The MAD Podcast with Matt Turck: “95% Einstein, 5% Mr. Bean”: Jev’s Creator on Why AI Can’t Automate Anything Reliably &#40;Diogo Almeida&#41;](<https://anchor.fm/s/f2ee4948/podcast/play/127504926/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2026-9-15%2F434211563-44100-2-993520ae20687.mp3>)

[音频: The MAD Podcast with Matt Turck: “95% Einstein, 5% Mr. Bean”: Jev’s Creator on Why AI Can’t Automate Anything Reliably &#40;Diogo Almeida&#41;](<https://anchor.fm/s/f2ee4948/podcast/play/127504926/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2026-9-15%2F434211563-44100-2-993520ae20687.mp3>)
