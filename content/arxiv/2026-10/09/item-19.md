---
publish: true
content_type: "post"
title: "Cited but Not Consulted: A Counterfactual Audit of Legal Chain-of-Thought Faithfulness"
description: "Large language models increasingly justify legal decisions by naming the statute or precedent behind a verdict, and this citation is treated as evidence that the decision follows from it. The authors test that directly: holding case facts f"
date: "2026-10-08T17:26:17.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:47.674Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12361v1"
tags: ["source/arxiv","topics/evaluation","topics/research","topics/industry"]
---

Large language models increasingly justify legal decisions by naming the statute or precedent behind a verdict, and this citation is treated as evidence that the decision follows from it. The authors test that directly: holding case facts fixed, they substitute the named legal authority with an unrelated one and decode the model's evolving verdict from its hidden states.

Across seven open-weight models &#40;8B–70B&#41; and four benchmarks spanning judicial and contractual reasoning, when explicitly required to justify a verdict by naming the governing authority, models name the correct one in 66.7%–100% of generations. But verdicts changing when the authority changes is far less consistent: 0.0%–21.7% on CaseHOLD, 30.0%–76.7% on ECHR and SCOTUS, and 43.3%–50.0% on ContractNLI. Neither scale nor a purpose-built legal-reasoning model &#40;a best-effort LoRA reproduction&#41; closes this gap.

A red-teaming evaluation on five core models finds compliance with an adversarial instruction hidden in the case facts &#40;73.3%–96.4%&#41; exceeds verdict-swap sensitivity by a wide margin, holding without exception across model rankings. Naming a legal authority is thus a poor proxy for a verdict's dependence on it, while the same verdict remains separately vulnerable to adversarial manipulation. Both findings replicate across checks ruling out prompt-wording noise and confounded sampling, and bear directly on the use of generated legal explanations as compliance or audit artefacts.
