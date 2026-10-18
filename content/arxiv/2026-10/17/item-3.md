---
publish: true
content_type: "post"
title: "L2G-SR: Learning to Guide LLM-based Symbolic Regression"
description: "Symbolic regression searches for an equation that explains observed data. Numerical error is the usual search signal, but the authors note that it can favor an accurate surrogate over a candidate with the right structure. They propose L2..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20685"
tags: ["source/arxiv","topics/models","topics/research"]
---

Symbolic regression searches for an equation that explains observed data. Numerical error is the usual search signal, but the authors note that it can favor an accurate surrogate over a candidate with the right structure. They propose L2G-SR, which adds a learned structural verifier to guide an LLM-based search.

The verifier is trained with structural supervision built from tree edit distance, adjusted for commutative operators and alternative expression forms. The authors say this aims to compare equivalent but differently written expressions more fairly. The verifier first aligns numerical observations with formulas, then learns to score how structurally similar a candidate is to the target formula. At search time the target is hidden, and the verifier complements numerical error when selecting parents rather than replacing it. An analyst uses verifier feedback and diagnostic tools to propose revisions, which a generator converts into refined expressions.

On LLM-SRBench, L2G-SR achieved state-of-the-art numerical fit, equation-level accuracy and tree-edit-distance scores across the evaluated LLM backbones and domains, according to the paper. The authors present this as evidence that learned structural guidance is valuable for LLM-based symbolic regression.
