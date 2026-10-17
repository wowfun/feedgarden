---
publish: true
content_type: "post"
title: "Are You Sure Your LLM Is Sure? Repairing and Auditing Confidence"
description: "Confidence scores shape whether an LLM answer is accepted, reviewed or regenerated, but scalar recalibration can only correct errors that are visible through the score itself. The authors introduce RADAR (Repair, Adopt, and Diagnose Afte..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22139"
tags: ["source/arxiv","topics/evaluation","topics/models"]
---

Confidence scores shape whether an LLM answer is accepted, reviewed or regenerated, but scalar recalibration can only correct errors that are visible through the score itself. The authors introduce RADAR &#40;Repair, Adopt, and Diagnose After Recalibration&#41;, a reliability framework that separates three questions: how to repair confidence, whether to deploy a repair, and how to audit the errors that remain.

Under squared loss, RADAR decomposes prediction risk into outcome noise, information hidden by the score, and mapping error; restricting repair to order-preserving maps adds a pooling gap. For repair, Probe-Anchored Isotonic Calibration &#40;PAIC&#41; learns a monotone map from correctness-probe predictions on unlabeled target prompts. The authors show PAIC's excess risk depends on the probe's score-conditional bias and fitting error rather than its overall accuracy. For adoption, a paired procedure provides finite-sample control of false improvements. For auditing, a prompt-clustered kernel test detects feature-aligned residual errors while accounting for dependent answers to the same prompt.

Across multiple LLM checkpoints, benchmarks and distribution shifts, richer predictors can improve confidence estimation, but projecting their information back to a scalar score can lose those gains, and lower prediction risk need not produce better review decisions. Across 47,400 replayed raw-score allocations, paired betting adopts candidates with lower held-out test risk in 42.95% of allocations, versus 15.09% for one-sided empirical Bernstein. Code and data are to be released upon acceptance.
