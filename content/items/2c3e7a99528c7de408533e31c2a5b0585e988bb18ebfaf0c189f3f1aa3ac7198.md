---
publish: true
content_type: "post"
title: "TokenRouter: Efficient Serving System for Token-Level LLM Routing"
description: "LLM routing distributes inference work across models to advance the cost-quality Pareto frontier of serving. Coarse-grained routing at the session or query level is widely used in production, while recent algorithmic work shows fine-grained"
date: "2026-10-08T16:21:50.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:52.195Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12242v1"
tags: ["source/arxiv","topics/inference","topics/products"]
---

LLM routing distributes inference work across models to advance the cost-quality Pareto frontier of serving. Coarse-grained routing at the session or query level is widely used in production, while recent algorithmic work shows fine-grained token-level routing can yield substantial efficiency and quality gains. Serving token-level routed inference efficiently is hard, however: systems built on single-LLM assumptions suffer severe step desynchronization and frequent batch admission delays under token-level routing, and they impose high implementation complexity on developers.

TokenRouter addresses this with the principle of request-centric programming, model-centric execution. Developers describe routing logic from the perspective of a single request, while the runtime launches a subserver for each LLM and dispatches requests asynchronously. Each subserver uses a delayed-batching scheduler whose optimal hyperparameters are derived from a mathematical throughput model of the system.

Across diverse routing algorithms, workloads and model pairs, TokenRouter achieves 2.01–64.15x higher decoding throughput than existing systems. The authors say this substantially advances the serving efficiency of token-level LLM routing, and release code at https&#58;//github.com/thu-nics/TokenRouter.
