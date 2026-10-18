---
publish: true
content_type: "post"
title: "The Density of Thought: Predicting and Steering Reasoning in LLMs"
description: "The paper asks whether differences in information density across chain-of-thought (CoT) steps predict whether an answer is correct, and whether density can be steered at inference time. Frozen pretrained models solve problems via CoT, an..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21286"
tags: ["source/arxiv","topics/models","topics/inference","topics/research"]
---

The paper asks whether differences in information density across chain-of-thought &#40;CoT&#41; steps predict whether an answer is correct, and whether density can be steered at inference time. Frozen pretrained models solve problems via CoT, and each reasoning step is scored with two independent metrics: LP variance, the variance in mean per-token negative log-likelihood, which captures how unevenly information is spread across steps, and the Caveman compression ratio.

Experiments cover six model scales, two training paradigms and 60 GSM8K problems and yield four main findings. First, lower LP variance predicts correctness in supervised fine-tuned &#40;SFT&#41; models, but the relationship weakens with scale and reverses in reinforcement-learning-distilled models, suggesting the training paradigm shapes density behaviour more than model size does. Second, synthetic experiments show an intrinsic complexity preference: models trained on uniformly distributed data learn complexity-favouring distributions 2.0 to 2.6 times more accurately than simplicity-favouring ones.

Third, steering density directly at inference time reduces accuracy from 60.0% to 8.3%, indicating that natural density patterns matter functionally for reasoning. Fourth, a pre-generation nudge that combines hint injection with contrastive KV-cache steering raises accuracy by 13.3 percentage points, consistent across both metrics.

The authors also introduce Entropy-Gated Density Routing &#40;EGDR&#41;, a self-supervised method that uses token-level Shannon entropy to gate proportional KV-cache adjustments during generation; it improves accuracy by 10.0 percentage points without external guidance.
