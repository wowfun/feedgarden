---
publish: true
content_type: "post"
title: "GRADS: Graph-Regulated Agentic Data Synthesis with Controllable Difficulty"
description: "Deep research agents are increasingly deployed to retrieve precise information from large corpora, yet multi-hop, long-horizon tasks remain challenging. Synthetic data generation has emerged as a scalable solution, but existing pipelines..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21167"
tags: ["source/arxiv","topics/agents","topics/research"]
---

Deep research agents are increasingly deployed to retrieve precise information from large corpora, yet multi-hop, long-horizon tasks remain challenging. Synthetic data generation has emerged as a scalable solution, but existing pipelines typically expand seed tasks to increase their apparent depth and breadth. That expansion does not reliably translate into necessary reasoning: newly introduced evidence may be only weakly coupled to the answer, creating a mismatch between intended and empirical difficulty.

GRADS is a graph-guided agentic data synthesis framework with explicit difficulty control. It runs a closed loop of seed selection, evidence expansion, question-answer construction, and verification while maintaining a graph of the evidence and inference dependencies required to derive each answer. At each step, generation is conditioned on a relevant subgraph, preserving indispensable inference without accumulating irrelevant context.

Experiments across security, software-engineering, and scientific-document domains show that GRADS consistently generates verified tasks with empirically separated difficulty distributions, as measured by independent solvers. Under matched training budgets, post-training on this data delivers consistent gains at every level. Supervised fine-tuning raises the solution-termination rate to over 95% while cutting tool calls and turns by up to 75%. Reinforcement learning trims tool use by up to a further 19.5%. On held-out, domain-specific benchmarks, the resulting 4B model matches Sonnet 4 on software engineering and surpasses it on the scientific and security domains.
