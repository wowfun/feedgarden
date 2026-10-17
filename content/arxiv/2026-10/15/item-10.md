---
publish: true
content_type: "post"
title: "Decoupled Marginal Sharpening for Training-Free Inference-Time Scaling"
description: "This paper targets a specific setting: improving large language model reasoning at inference time without updating weights and without an external reward model. Prior reward-free power-sampling methods define a sequence-level target prop..."
date: "2026-10-14T16:55:22.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:39.611Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20483v1"
tags: ["source/arxiv","topics/inference","topics/models","topics/evaluation"]
---

This paper targets a specific setting: improving large language model reasoning at inference time without updating weights and without an external reward model. Prior reward-free power-sampling methods define a sequence-level target proportional to p0&#40;y&#124;x&#41;^alpha with alpha greater than 1, which raises the relative probability of completions already likely under the base model. Existing approaches approximate sampling from that target with Metropolis-Hastings or Sequential Monte Carlo.

The authors identify two failure modes at different levels. At the target level, sharpening the full sequence can concentrate probability on a few exact reasoning-answer trajectories, suppressing alternative paths that reach the same answer. At the sampler level, finite-particle SMC can suffer path collapse when repeated resampling duplicates a few high-weight prefixes.

Their proposal, Decoupled Marginal Sharpening &#40;DMS&#41;, separates how strongly the model favors particular reasoning paths from how strongly it favors final answers after aggregating support across paths. It first samples from a sharpened reasoning distribution, then marginalizes the model's answer probabilities over the resulting weighted reasoning population and sharpens that induced answer marginal. Separate exponents allow mild reasoning sharpening to encourage diverse exploration, followed by stronger answer-marginal sharpening to favor answers with broad aggregate support.

For the sampler, the authors develop Fully Adapted Annealed SMC, combining an annealed sequence of power targets with locally fully adapted proposals and predictive ancestor resampling. Experiments on MATH500, GPQA-Diamond, HumanEval, and AIME24/25 across three base models report that DMS achieves the highest mean pass@1 among the compared methods on all tasks.
