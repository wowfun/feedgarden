---
publish: true
content_type: "post"
title: "Rubric Judgments Lack Uncertainty: Conformal Weighting for LLM Evaluation"
description: "Rubric-based evaluation is widely used to assess large language model outputs by decomposing quality into multiple criteria and assigning each a binary judgment from an LLM verifier. However, judgment certainty varies substantially acros..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21214"
tags: ["source/arxiv","topics/evaluation","topics/research"]
---

Rubric-based evaluation is widely used to assess large language model outputs by decomposing quality into multiple criteria and assigning each a binary judgment from an LLM verifier. However, judgment certainty varies substantially across criteria. Existing methods uniformly aggregate these judgments into a final score, implicitly treating every criterion as equally certain and overlooking this heterogeneity. As a result, uncertain judgments remain incorporated into reward estimation without distinction, potentially yielding misleading training signals for downstream reinforcement learning.

Uncertainty-aware Rubric Weighting &#40;URW&#41; is a training-free framework that quantifies criterion-level judgment uncertainty via conformal calibration. It elicits a soft uncertainty signal from a fixed pool of paraphrased judgment templates and converts that signal into a per-criterion weight using split-conformal p-values with provable coverage guarantees.

Extensive experiments show that URW consistently improves pairwise preference accuracy and delivers stronger downstream RL alignment. The method is intended as a lightweight addition to rubric-based pipelines: rather than discarding uncertain rubric judgments or treating them like confident ones, it reweights criteria according to calibrated uncertainty so that reward estimates better reflect the reliability of each judgment.
