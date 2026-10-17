---
publish: true
content_type: "post"
title: "CleanRM: Reward Modeling from Noisy Feedback with a Few Clean Feedback for RLHF"
description: "Preference data used for reward modeling is pervasively noisy because of subjective human judgments, annotation mistakes, and imperfect LLM judges. Standard reward modeling trained on such feedback yields a biased estimate of the clean r..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21138"
tags: ["source/arxiv","topics/research","topics/models"]
---

Preference data used for reward modeling is pervasively noisy because of subjective human judgments, annotation mistakes, and imperfect LLM judges. Standard reward modeling trained on such feedback yields a biased estimate of the clean risk. Classical denoising methods can be applied to noisy-feedback learning, but they generally assume a uniform noise ratio across samples, an assumption that fails for feedback data where noise is intrinsically sample-wise.

CleanRM addresses this by using a few clean feedback samples to calibrate sample-wise noise ratios through optimal transport. It aligns the joint distribution of preferences reverted from noisy feedback with that of clean feedback, then trains the reward model using a noise-corrected surrogate loss. The authors prove theoretically that the resulting objective is unbiased with respect to the clean risk.

In extensive experiments, CleanRM outperforms state-of-the-art denoising baselines and yields more effective downstream RLHF alignment. The work targets a practical bottleneck in RLHF pipelines: reward models are only as reliable as the preference labels they learn from, and calibrating heterogeneous per-sample noise with limited clean data offers a way to reduce that bias without discarding noisy feedback.
