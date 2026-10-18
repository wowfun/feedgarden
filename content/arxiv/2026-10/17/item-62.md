---
publish: true
content_type: "post"
title: "Disagreement-Guided Routing Escalates Weak Models Without Ground-Truth Labels"
description: "Small language models are increasingly deployed on edge devices and robotic systems to meet cost and latency limits, but their weaker capabilities make reliable deployment difficult. A stronger model can help when needed, yet deciding wh..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22245"
tags: ["source/arxiv","topics/inference","topics/models"]
---

Small language models are increasingly deployed on edge devices and robotic systems to meet cost and latency limits, but their weaker capabilities make reliable deployment difficult. A stronger model can help when needed, yet deciding when to escalate a weak-model response usually depends on signals of correctness, which are expensive or impossible to obtain at scale for open-ended and agentic tasks.

The authors revisit weak-to-strong routing and ask whether routing can be guided without ground-truth supervision. They characterize the optimal routing policy while allowing multiple weak-model responses from local inference, then derive an approximation based on model-to-model comparison. Their notion of model disagreement can be measured directly from generated responses. The approximation becomes more accurate as the strong model becomes a better proxy for the ground-truth distribution.

Across agentic and single-turn tasks, the approach navigates the trade-off between routing cost and response accuracy without ground-truth supervision. The authors also report that even when ground-truth correctness signals are available for training, disagreement-based routing can outperform methods trained directly to predict correctness. The abstract does not give specific accuracy or cost figures.
