---
publish: true
content_type: "post"
title: "From Unreliable to Usable: Failure Modes and Confidence Signals in LLM Entity Extraction"
description: "Audits of large language model extraction from full-length documents report severe unreliability, leaving open what the failures consist of and whether confidence signals can make unreliable output usable. The authors run a preregistered..."
date: "2026-10-14T16:13:09.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:29.710Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20417v1"
tags: ["source/arxiv","topics/evaluation","topics/security-privacy","topics/research"]
---

Audits of large language model extraction from full-length documents report severe unreliability, leaving open what the failures consist of and whether confidence signals can make unreliable output usable. The authors run a preregistered, fully frozen evaluation of two low-cost new-generation models &#40;DeepSeek-V4-Flash, GLM-5.3-Flash&#41; with a flagship-tier control &#40;GPT-6.1-Sol&#41; on a public cyber threat intelligence corpus of 354 incident campaigns, 315 unique reports and 630 model-report evaluations, scoring extraction quality against gold, confidence calibration and robustness to single-sentence perturbations.

Three findings emerge. First, unreliability persists across tiers: micro precision is 0.03-0.34 and verbalized calibration error &#40;ECE&#41; 0.53-0.94 across both splits, and the gap does not close at the flagship tier. Second, the dominant failure is not hallucination. A full mention census plus a three-tier annotation of 360 sampled candidates, using two independent LLM annotators from vendors outside the evaluated set &#40;Cohen's kappa 0.79 on the preregistered acceptance line&#41;, back-projects to 65.6% background mentions and 19.9% gold-scope gaps, with only 1.2% unsupported candidates. Third, confidence ranks but does not verify: zero-cost self-consistency-frequency tiering passed a preregistered top-30% precision-gain bar in all six test-split model-type cells but only 4/6 on train, while a zero-cost text-frequency times SC-frequency combination won 3, tied 2 and lost 1 cell. Relation-level counterfactuals on all 45 targets show a single misattribution sentence flips high-confidence judgments in 95.6-100% of cases, and even a background sentence explicitly marked unrelated still binds a fake vulnerability in up to 26.7% of them.

The authors conclude with a deployment boundary: confidence tiering may set review priorities, never truth.
