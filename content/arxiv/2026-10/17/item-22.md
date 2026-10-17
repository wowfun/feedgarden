---
publish: true
content_type: "post"
title: "Bias Control and Injection for Multi-Agent Aggregation"
description: "When several large language model agents reason about the same problem, disagreement raises a basic question for collective decision-making: whose decision should be trusted? The authors argue that resolving such disagreements is hard be..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21290"
tags: ["source/arxiv","topics/agents","topics/evaluation"]
---

When several large language model agents reason about the same problem, disagreement raises a basic question for collective decision-making: whose decision should be trusted? The authors argue that resolving such disagreements is hard because agents' choices are susceptible to non-semantic biases, such as majority pressure and preferences for particular response styles, which can obscure the quality of the underlying reasoning.

Their analysis shows that bias can be both mitigated and exploited. Bias control improves the initial selection of answers, while bias injection produces decision instability that can serve as a reliability signal. Building on this, they introduce a test-time aggregation framework that needs neither validation data nor prior knowledge of the relative strength of the models involved. Bias control is implemented by presenting one style-normalized reasoning trace for each distinct answer; bias injection places each aggregating agent's initially selected answer in the minority.

Across three mathematical reasoning benchmarks and four heterogeneous LLM combinations, the framework achieves higher average accuracy and better token efficiency than competing non-oracle aggregation methods. It also improves final-answer accuracy when applied to multi-agent debate and Mixture-of-Agents, without changing those methods' interaction or synthesis processes.
