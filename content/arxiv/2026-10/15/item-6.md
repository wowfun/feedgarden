---
publish: true
content_type: "post"
title: "Same Claim, Different Interpretations: How LLM Agents Resolve Ambiguity in Scientific Claims"
description: "Co-scientists and agentic scientific claim verifiers are increasingly used to assess claims across the sciences. Natural-language scientific claims written for human experts are often underspecified and admit several defensible interpret..."
date: "2026-10-14T16:42:05.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:35.641Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20457v1"
tags: ["source/arxiv","topics/agents","topics/research","topics/evaluation"]
---

Co-scientists and agentic scientific claim verifiers are increasingly used to assess claims across the sciences. Natural-language scientific claims written for human experts are often underspecified and admit several defensible interpretations. Such verifiers usually pick one, often tacitly, and benchmarks score their verdicts against expert labels without recording either the expert's or the verifier's interpretation in comparable form. This produces disagreements with expert labels that cannot be traced to evidence or interpretation, and compute spent on unchecked interpretations.

To make interpretations explicit, the authors introduce Claim Cards. A card records a verifier's interpretation as nine fields before evidence gathering, each marked stated, inferred or default. To test whether an agent's interpretation can change its verdict, a GPT-5.4 agent ran five times on each of 60 expert-labeled materials-science and biomedical claims - with a card, without one, and with one card frozen across runs &#40;900 runs total&#41;.

Over 40% of card fields were not marked stated, and adding a card increased a run's GPT-5.4 tokens and time by about a tenth without measurably changing agreement with expert labels. The agent's own interpretations varied between runs, though within a claim this variation did not measurably track the verdict. Deliberately changing one field of the frozen card, however - making the quantifier universal or the support threshold stricter - changed the verdict on about a third of claims, versus about one in seven expected by chance &#40;p &lt; 0.001 for each edit&#41;. On 24 materials-science claims run with computational tools, the stricter threshold also changed what the agent asked those tools to compute. The authors argue verdicts should be reported with their interpretations, and that benchmarks could publish the interpretation behind each label.
