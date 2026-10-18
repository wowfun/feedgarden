---
publish: true
content_type: "post"
title: "EliteReplay Preserves Solution Diversity in RL Post-Training"
description: "Reinforcement learning is a common post-training method for improving LLM accuracy on verifiable tasks, but it can narrow the set of solutions a model produces. Several approaches try to counter this behavior-sharpening effect, yet they ..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22290"
tags: ["source/arxiv","topics/models","topics/research"]
---

Reinforcement learning is a common post-training method for improving LLM accuracy on verifiable tasks, but it can narrow the set of solutions a model produces. Several approaches try to counter this behavior-sharpening effect, yet they often optimize metrics that do not reflect the diversity of correct solutions. The authors argue the goal should be a model that can produce multiple good solutions, not just one reliable one.

EliteReplay pairs GRPO with an elite archive built through quality-diversity search. Before training, the frozen base model collects solutions spanning distinct approaches; during training, GRPO is combined with a replay loss on this archive. The archive is meant to retain elite solutions that cover different approaches rather than only the highest-scoring one. This improves accuracy while preserving more of the base model's solution diversity.

On multiple text-to-SQL tasks, EliteReplay achieved a higher pass@128 than all baselines, producing up to 77% more distinct correct strategies than the strongest baselines, and it preserved most of the base model's correct strategies, outperforming existing methods on strategy retention. The diversity also helped on ambiguous questions: on AmbiQT, EliteReplay covered both interpretations nearly twice as often as the strongest baseline. The abstract reports results on text-to-SQL and AmbiQT; it does not describe gains on other task types or the computational cost of building the archive.
