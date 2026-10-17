---
publish: true
content_type: "post"
title: "Bayesian Learning to Select Fair Classifiers"
description: "Evaluations of classifiers, whether AI systems, human labelers, or agents, often assume a batch setting in which every agent labels every example in a test set. The authors note that this can be expensive or impractical, which motivates ..."
date: "2026-10-14T17:16:28.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:39.611Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20514v1"
tags: ["source/arxiv","topics/evaluation","topics/ethics-compute-access","topics/research"]
---

Evaluations of classifiers, whether AI systems, human labelers, or agents, often assume a batch setting in which every agent labels every example in a test set. The authors note that this can be expensive or impractical, which motivates online policies that adaptively choose which agent to query as examples arrive and update those policies as outcomes are observed.

The paper studies selecting, in an online stream, the agent that best balances two objectives: predictive performance and subgroup fairness with respect to a sensitive attribute. The setting also allows delayed observations of the true class labels, so feedback about an agent's accuracy may arrive well after the query.

The authors formulate this as a Bayesian multi-armed bandit problem and use Thompson Sampling to explicitly trade off accuracy against fairness. Their theoretical contributions include guarantees on the performance of the selected agent that incorporate both the accuracy and fairness aspects of the problem.

Empirical evaluations use real-world datasets spanning tabular classifiers, large language models, and human labelers. Across these settings the method shows substantial reductions in regret relative to the baselines compared.
