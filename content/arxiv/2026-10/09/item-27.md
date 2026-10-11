---
publish: true
content_type: "post"
title: "A Unified Bellman Operator for Safety-Critical Reinforcement Learning"
description: "Reinforcement learning in safety-critical domains must maximize task performance while strictly honoring safety constraints. Existing safe RL paradigms typically force a trade-off: they either require a priori knowledge to give strict safet"
date: "2026-10-08T17:53:02.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:55.758Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12420v1"
tags: ["source/arxiv","topics/research"]
---

Reinforcement learning in safety-critical domains must maximize task performance while strictly honoring safety constraints. Existing safe RL paradigms typically force a trade-off: they either require a priori knowledge to give strict safety guarantees, as with safety filters, or they allow joint learning but satisfy safety constraints only in expectation on average. This work proposes a novel Bellman operator that unifies performance and safety objectives into a single joint value function.

The authors show that temporal difference learning with the joint Bellman operator converges under a two-timescale stochastic approximation framework. On the fast timescale the safety value of the learning joint policy is estimated, while the joint value is estimated on the slow timescale. Convergence is established by formulating the limiting dynamics as an occupation-averaged differential inclusion and showing that it asymptotically converges to a set of limiting optimal safety-constrained task value functions.

Theoretically, the authors state that once converged, the resulting optimal policy maximizes task return while maintaining safety at all times. Empirical evaluation on continuous control tasks with neural approximations demonstrates stable convergence with near-zero safety violations at test time. The source reports these results without additional domain-specific deployment details.
