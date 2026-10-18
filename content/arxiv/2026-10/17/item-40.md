---
publish: true
content_type: "post"
title: "Functional Subnetwork Localization for Efficient Continual Learning in Large Language Models"
description: "Biological intelligence keeps adapting to new information while retaining earlier skills through localized plasticity, whereas continual learning in large language models remains vulnerable to catastrophic forgetting. A promising route i..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21537"
tags: ["source/arxiv","topics/models","topics/research"]
---

Biological intelligence keeps adapting to new information while retaining earlier skills through localized plasticity, whereas continual learning in large language models remains vulnerable to catastrophic forgetting. A promising route is to find functionally specialized subnetworks inside LLMs so that adaptation can be targeted and resource-efficient.

Using gradient-attribution profiling, the authors localize cognition-associated functional subnetworks that show extremely low mutual overlap. On that basis they propose Function-isolated Memory-Efficient Optimization &#40;CiMEO&#41;, a continual learning framework that routes each training example to its corresponding functional subnetwork and restricts parameter updates and optimizer states to the selected regions.

Across 1.4 million sequential instructions, CiMEO achieved the highest average performance among the compared methods on five generative benchmarks covering programming, examination-style tasks and mathematical reasoning, while mitigating catastrophic forgetting. Subspace-overlap and principal-angle analyses further indicate that localized updates help preserve pre-trained representations.

The authors present functional subnetwork localization as a practical approach to efficient and stable continual learning in LLMs. The work is by Shuoran Jiang and colleagues.
