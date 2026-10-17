---
publish: true
content_type: "post"
title: "Tracing where LLM \"slop\" style lives in the model and which training stage installs it"
description: "The author set out to locate the recognizable assistant writing style — em dashes, \"it's not X, it's Y\" constructions, lists of three, buzzwords, markdown formatting — inside a model, and to identify which training stage installs it. On ..."
date: "2026-10-14T22:08:02.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:03:12.259Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x64lbk/tracing_where_llm_slop_style_comes_from_in_the/"
tags: ["source/reddit","topics/research","topics/models","topics/generative-media"]
---

The author set out to locate the recognizable assistant writing style — em dashes, "it's not X, it's Y" constructions, lists of three, buzzwords, markdown formatting — inside a model, and to identify which training stage installs it.

On where it lives: in Qwen3-4B-Instruct, a difference-in-means direction computed from the model's own exaggerated versus plain writing separates 64 hand-written minimal pairs, and correlates up to 0.82 with a trope-based slop score on normal output. Logit-lens readouts reveal a register axis contrasting grand, abstract vocabulary with plain hedges such as "really," "basically" and "stuff." Per-trope directions appear cross-lingual: the "not X, but Y" trope promotes the Chinese 而是, meaning "but rather."

On where it comes from: the base model contains the same direction &#40;cosine similarity 0.90 to 0.97 at middle layers&#41; but writes near the plain end. On OLMo 2 1B, measured at every released stage, supervised fine-tuning introduces the rhetorical structures, while DPO doubles the slop score through buzzwords and markdown formatting. Scoring OLMo's preference data, the chosen response is the sloppier of the pair in 57% of 3,000 pairs.

On removal: directional ablation increases slop by up to 89% because clean text projects negatively onto the axis. Fixed-vector subtraction at layers 12 to 23 stays within a narrow KL budget &#40;roughly 0.4 nats per token on human text&#41; and reduces structural tropes that token bans cannot touch. Distilled into a rank-16 LoRA, it cuts the slop score by 83% with no system prompt, at lower KL than steering itself and with no drop on a small question-answering check.

Caveats: the slop scorer is the author's own regex detector, the main results rest on one 4B model plus OLMo 2 1B, and there is no human evaluation yet. The work is explicitly positioned as complementary to Antislop &#40;Paech et al., 2025&#41;: Antislop addresses slop at the token level, while this work operates on the representation side.
