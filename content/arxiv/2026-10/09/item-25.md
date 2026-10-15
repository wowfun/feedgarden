---
publish: true
content_type: "post"
title: "Predicting Alignment Generalization with Value Representations"
description: "LLM developers post-train models to exhibit prosocial values and behavioral traits enumerated in an alignment target, but training on sets of narrow behaviors still influences behavior in unseen contexts in unexpected ways. This paper es..."
date: "2026-10-08T17:47:26.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:47.674Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12410v1"
tags: ["source/arxiv","topics/research","topics/models","topics/evaluation"]
---

LLM developers post-train models to exhibit prosocial values and behavioral traits enumerated in an alignment target, but training on sets of narrow behaviors still influences behavior in unseen contexts in unexpected ways. This paper establishes the task of alignment generalization prediction: predicting how fine-tuning a model to follow a given value changes its behavior across a wide range of held-out values.

The authors conduct a large-scale analysis of alignment generalization effects across 66 values found in modern alignment targets, and benchmark representational techniques on this prediction task. Representations based on model activations when values are applied in context significantly outperform methods based on textual descriptions of the values: the best activation-based methods reach correlations of 0.45 with the generalization matrix, versus 0.05 for description-based baselines.

The paper then shows these representations can be applied downstream by using them to measure how similar the values in a multi-value alignment target are, which is significantly correlated with model robustness. It also offers initial evidence toward a shared, model-independent value space, used to develop what the authors describe as the first taxonomy of LLM values grounded in empirical generalization dynamics. The stated aim is more empirical design and training of model behavior.
