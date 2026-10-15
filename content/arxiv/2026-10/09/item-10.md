---
publish: true
content_type: "post"
title: "From What to Which: Decoding Modifier Grounding in Frozen MLLMs"
description: "As multimodal large language models (MLLMs) describe ever more complex visual scenes, token-level grounding becomes important. When a model generates \"the yellow banana on the left\", established grounding approaches focus on what is in t..."
date: "2026-10-08T16:53:59.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:59.851Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12305v1"
tags: ["source/arxiv","topics/models","topics/research"]
---

As multimodal large language models &#40;MLLMs&#41; describe ever more complex visual scenes, token-level grounding becomes important. When a model generates "the yellow banana on the left", established grounding approaches focus on what is in the image &#40;"banana"&#41; but overlook tokens that specify which instance is meant &#40;"yellow", "left"&#41;. This work asks whether frozen MLLM representations contain decodable grounding information about the referred instance across generated tokens, extending to modifiers such as attributes, spatial expressions and relational or action terms.

To investigate, the authors introduce OTTER, a lightweight supervised probe over frozen MLLM representations that uses Optimal Transport &#40;OT&#41; to align generated tokens with visual regions and to produce compact grounding maps. The probe is trained on top of representations that are not themselves fine-tuned.

The results indicate four points: instance-discriminative visual information can be decoded from modifier tokens, with the clearest evidence for spatial terms; it is not confined to them, since contextualized object nouns also carry referential information; the recovered grounding remains informative under context perturbations, and the selected regions stay relevant to generation; and the learned OT-based grounding extends beyond the controlled setting to free generation and cross-dataset transfer. The paper frames these findings as evidence that grounding information distributed across generated tokens can be read out without modifying the underlying model.
