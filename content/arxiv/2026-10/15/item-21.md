---
publish: true
content_type: "post"
title: "One Task, Many Interfaces: Cross-Interface Consistency Training Improves Agent Robustness"
description: "Post-training tends to bind an LLM agent's competence to the exact interface it was trained on. Semantics-preserving perturbations of that interface, such as renaming an action or changing notation, leave the underlying task unchanged ye..."
date: "2026-10-14T17:56:06.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:29.710Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20576v1"
tags: ["source/arxiv","topics/agents","topics/coding","topics/evaluation"]
---

Post-training tends to bind an LLM agent's competence to the exact interface it was trained on. Semantics-preserving perturbations of that interface, such as renaming an action or changing notation, leave the underlying task unchanged yet degrade agent performance. Scoring each sample independently only broadens the dependence from a single interface to the training interface distribution, so out-of-distribution perturbations still hurt.

The authors propose Cross-Interface Policy Regularization &#40;CIPR&#41;, a self-supervised objective that replaces action names with uninformative identifiers and presents each training sample under two interfaces where equivalent actions are identified by construction. CIPR penalizes the KL divergence between the action distributions induced under the two interfaces, encouraging the policy to behave consistently across them.

CIPR is evaluated in both supervised and reinforcement-learning post-training, improving robustness in each. On agentic function calling, held-out interface perturbations reduce the accuracy of a post-trained agent by nearly 25%; CIPR recovers 10.5% while leaving accuracy on the unchanged interface intact.
