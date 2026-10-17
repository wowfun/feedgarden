---
publish: true
content_type: "post"
title: "PerSo: Investigating Facets of LLMs' Social Intelligence in Real-World Persuasion Scenarios"
description: "Understanding the social intelligence of large language models is increasingly important for applications involving human-AI interaction and multi-agent environments. The authors decompose it into two aspects: cognitive intelligence, the..."
date: "2026-10-14T17:39:35.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:29.710Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20548v1"
tags: ["source/arxiv","topics/evaluation","topics/communication","topics/research"]
---

Understanding the social intelligence of large language models is increasingly important for applications involving human-AI interaction and multi-agent environments. The authors decompose it into two aspects: cognitive intelligence, the ability to infer others' mental states, and behavioral intelligence, the ability to select appropriate social actions based on those inferences to achieve social goals. Persuasion is a natural testbed where both aspects are simultaneously at play, yet prior benchmarks typically evaluate them in isolation using synthetic scenarios.

The paper introduces PerSo, a benchmark that evaluates both aspects on real-world persuasion dialogues from Reddit's ChangeMyView community. Evaluation tasks are constructed with an LLM-in-the-loop pipeline and validated through human annotation.

Evaluating diverse LLMs shows that performance generally scales with model size but varies across dimensions. On the behavioral task, the strongest LLM slightly surpasses the best observed human performance, while on the cognitive task the best human participant remains ahead.
