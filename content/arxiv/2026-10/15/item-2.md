---
publish: true
content_type: "post"
title: "When Does Momentum Help in Reinforcement Learning with Verifiable Rewards?"
description: "Momentum is a classical tool for accelerating convex optimization and a standard part of modern large language model training, yet recent empirical work has questioned whether first-moment momentum helps in reinforcement learning with ve..."
date: "2026-10-14T16:11:14.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:29.710Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20413v1"
tags: ["source/arxiv","topics/models","topics/research","topics/evaluation"]
---

Momentum is a classical tool for accelerating convex optimization and a standard part of modern large language model training, yet recent empirical work has questioned whether first-moment momentum helps in reinforcement learning with verifiable rewards &#40;RLVR&#41;. This paper studies the question through a bandit formulation of RLVR with bias-corrected exponential moving average &#40;EMA&#41; momentum, where the coefficient beta controls how quickly the weights on past gradients decay.

When policy gradients are evaluated exactly, the authors prove that increasing beta strictly accelerates optimization within a range that prevents overshoot. When gradients are estimated from sampled responses, a positive expected gain can be hidden by sampling fluctuations. The analysis shows that as the learning rate eta decreases, the expected gain at fixed beta vanishes faster than those fluctuations, whereas raising beta so that eta/&#40;1-beta&#41; stays in the safe regime preserves a nonvanishing gain that eventually dominates. Bandit simulations validate these predictions quantitatively.

RLVR experiments on Qwen3-4B-Base using SGD with EMA and AdamW support choosing larger coefficients in practical post-training. On Qwen2.5-32B with AdamW, simply increasing beta&#95;1 improved mean validation accuracy by nearly 2 percentage points over the conventional choice, evidence that the principle holds at larger scale.
