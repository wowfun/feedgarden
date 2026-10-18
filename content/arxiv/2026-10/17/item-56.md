---
publish: true
content_type: "post"
title: "CART: Compatible Routing for Multimodal Continual Instruction Tuning"
description: "Multimodal large language models (MLLMs) gain strong capabilities through instruction tuning, but real-world use often requires them to acquire new abilities from sequential tasks, a setting called Multimodal Continual Instruction Tuning..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22137"
tags: ["source/arxiv","topics/models","topics/research"]
---

Multimodal large language models &#40;MLLMs&#41; gain strong capabilities through instruction tuning, but real-world use often requires them to acquire new abilities from sequential tasks, a setting called Multimodal Continual Instruction Tuning &#40;MCIT&#41;. In typical MLLMs, a projector aligns visual representations with the language model. Existing continual methods mainly protect the language model from forgetting while the projector keeps updating across tasks. The authors argue this asymmetric adaptation causes substantial representation drift in the projector, increasing mismatch with the language model and worsening catastrophic forgetting.

CART &#40;Compatible Routing&#41; explicitly coordinates adaptation of the projector and the language model. It maintains task-specific experts for both modules and combines them through weighted mixtures. The weights are inferred jointly from expert relevance and cross-module compatibility, so the two modules adapt in a coordinated way. To limit model growth, CART adds relevance-guided expert consolidation, which merges experts with similar relevance profiles across samples within each module.

Extensive experiments show that CART achieves state-of-the-art performance, according to the authors. The abstract does not name the benchmarks, base models or specific gains, so the reported advantage is not quantified in the available text.
