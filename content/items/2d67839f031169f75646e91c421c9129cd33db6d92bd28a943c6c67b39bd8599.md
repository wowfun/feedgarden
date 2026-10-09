---
publish: true
content_type: "post"
title: "SiGMA: Multi-Agent Spatially Grounded Anomaly Understanding in Industry"
description: "A single multimodal large language model (MLLM) struggles to excel at detection, localization, description and reasoning at the same time in multimodal industrial anomaly understanding (MM-IAU). The authors show in-domain training does not "
date: "2026-10-08T16:59:29.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:59.851Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12310v1"
tags: ["source/arxiv","topics/evaluation","topics/models","topics/agents"]
---

A single multimodal large language model &#40;MLLM&#41; struggles to excel at detection, localization, description and reasoning at the same time in multimodal industrial anomaly understanding &#40;MM-IAU&#41;. The authors show in-domain training does not close the gap: on MMAD, a widely used MM-IAU benchmark, trained specialists reach at most 75.5% accuracy in defect localization, versus 92.3% for human experts, and they even detect anomalies less accurately than their own untrained base model. Different MLLMs offer complementary strengths but share this fine-grained perception weakness, so simply combining them cannot remove it.

The authors therefore propose SiGMA, a spatially grounded multi-agent framework that divides labor between heterogeneous MLLM agents and a dedicated visual defect expert. A multimodal searcher supplies industrial knowledge and normal references; the defect expert converts query-reference comparison into calibrated anomaly evidence; and a label-free reliability controller weighs each source by task-wise competence and query-level evidence quality.

SiGMA reaches 85.2% average accuracy on MMAD, 4.0% above the strongest trained specialist and Gemini-2.5-Pro, and within 1.5% of human experts. Even with three agents of at most 9B parameters it reaches 84.4%, and new MLLMs can join without retraining, which the authors present as evidence that the framework's division of labor, rather than raw model scale, drives the gains.
