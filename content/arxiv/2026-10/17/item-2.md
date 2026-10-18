---
publish: true
content_type: "post"
title: "IneqAgent: Agentic Inequality Proving in Lean with Symbolic Computation"
description: "The paper presents IneqAgent, a framework that combines LLM reasoning with symbolic computation to prove inequalities in Lean4. Lemma-level Monte Carlo tree search coordinates three activities: constructing lemmas, reformulating goals an..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20681"
tags: ["source/arxiv","topics/agents","topics/research"]
---

The paper presents IneqAgent, a framework that combines LLM reasoning with symbolic computation to prove inequalities in Lean4. Lemma-level Monte Carlo tree search coordinates three activities: constructing lemmas, reformulating goals and choosing a symbolic backend. Three backends—sum of squares, Bernstein and successive difference substitution—produce exact certificates that are turned into local Lean proofs. The agent combines those proofs with LLM-generated steps and uses Lean feedback to assemble complete proofs checked against the original theorem statements rather than only intermediate goals.

On four benchmarks, IneqAgent with DeepSeek-V4-Flash solved 175 of 186 problems, or 94.09%, the highest overall success rate among the evaluated methods. Across four backbone models, it achieved higher success rates at low LLM inference-cost thresholds than Direct Agent using the same backbone, and it had lower mean inference costs over each method's successful runs, according to the authors.

The work also reports Lean-verified strengthenings of Dittert's conjecture in dimensions four and five, and a certificate for the Holens–Djokovic &#40;4,4&#41; inequality that implies Merris's conjecture in dimension four. These results show exact symbolic certificates being integrated with LLM proof steps rather than replacing them.
