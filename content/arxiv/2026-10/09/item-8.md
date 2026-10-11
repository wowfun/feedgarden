---
publish: true
content_type: "post"
title: "Learning Probabilistic Logic Programs with Functional Gradient Guided Language Models"
description: "Declarative logic programs offer a powerful and interpretable abstraction for encoding relational structure and neurosymbolic reasoning by expressing dependencies as weighted compositional rules. However, inducing them from data remains fun"
date: "2026-10-08T16:53:32.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:47.674Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12303v1"
tags: ["source/arxiv","topics/research","topics/models","topics/agents"]
---

Declarative logic programs offer a powerful and interpretable abstraction for encoding relational structure and neurosymbolic reasoning by expressing dependencies as weighted compositional rules. However, inducing them from data remains fundamentally hard, bottlenecked by the combinatorial explosion of symbolic search spaces. Large language models have emerged as powerful hypothesis generators, but used in isolation they lack the systematic inductive reasoning needed to reliably synthesize valid programs that fit complex relational distributions.

The authors introduce grasp &#40;Gradient-boosted Synthesis of Probabilistic logic programs&#41;, a neurosymbolic framework that casts relational structure learning as functional gradient boosting, where the weak learner is a first-order rule and the intractable inner search is delegated to an LLM proposal oracle.

They evaluate grasp on four relational benchmarks spanning molecular toxicity prediction &#40;Tox21&#41;, mutagenesis and citation matching &#40;Cora&#41;. The method improves over purely symbolic, neural and LLM-based baselines while producing interpretable weighted rule ensembles. The authors argue that by replacing combinatorial search with gradient-guided LLM hypothesis generation, grasp retains boosting guarantees without sacrificing the transparency of symbolic outputs.
