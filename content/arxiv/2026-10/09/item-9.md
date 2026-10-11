---
publish: true
content_type: "post"
title: "Looking Inside LLMs: Small-World Connectivity as a Signature of Reasoning Performance"
description: "Understanding large language model reasoning requires looking beyond behavioral performance to how reasoning ability is reflected in internal organization. Inspired by neuroscience findings linking higher intelligence to stronger small-worl"
date: "2026-10-08T16:53:45.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:47.674Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12304v1"
tags: ["source/arxiv","topics/research","topics/evaluation","topics/models"]
---

Understanding large language model reasoning requires looking beyond behavioral performance to how reasoning ability is reflected in internal organization. Inspired by neuroscience findings linking higher intelligence to stronger small-world organization in functional brain networks, the authors investigate small-world connectivity as a structural signature of LLM reasoning.

They construct functional graphs from attention-head activation similarities and find that a higher small-world index &#40;SWI&#41;, which captures local clustering and short global paths, consistently correlates with better fluid reasoning performance across models and training checkpoints. Because local clustering is central to small-world organization, they further examine how heads important for model performance connect within and across communities: these heads tend to hold a larger share of connection weight within their own communities &#40;high core scores&#41; and a more concentrated weight distribution across communities &#40;low bridge scores&#41;. The authors hypothesize that high core and low bridge scores are structural indicators of head importance for reasoning.

They validate this through pruning by introducing Small-World Allocation &#40;SWA&#41;, a hierarchical sparsity allocation method guided by these scores. Across six LLMs, SWA better preserves small-world organization and model performance than competing allocation strategies, reducing WikiText perplexity by up to 20%. The authors conclude that small-world functional connectivity is a measurable signature of LLM reasoning performance, complementing behavioral evaluation with a structural perspective.
