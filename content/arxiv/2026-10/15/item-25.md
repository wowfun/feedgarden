---
publish: true
content_type: "post"
title: "CommerceGen-Studio: An End-to-End Framework for Commercial-Grade Main-Image Generation"
description: "CommerceGen-Studio is an end-to-end framework for generating commercial-grade main images for e-commerce Stock Keeping Units (SKUs). It is organized as a three-stage pipeline of information extraction, semantic rewriting, and multi-condi..."
date: "2026-10-14T17:59:48.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:43.420Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20603v1"
tags: ["source/arxiv","topics/products","topics/generative-media","topics/industry"]
---

CommerceGen-Studio is an end-to-end framework for generating commercial-grade main images for e-commerce Stock Keeping Units &#40;SKUs&#41;. It is organized as a three-stage pipeline of information extraction, semantic rewriting, and multi-condition generation.

The first component, the Prompt-Eval-Refine-Loop Agent &#40;PERL-Agent&#41;, distills heterogeneous SKU metadata into concise selling-point text lists using an iterative closed loop of vision-language and language model roles scored by a reference-free rubric. Layout Thinker Optimization &#40;LTO&#41; then aligns the rewriter with both caption quality and rendered-image quality through alternating domain-specific policy optimization. SKU-DiT, trained under a Reinforce-Distill-Reinforce &#40;RDR&#41; progressive schedule, conditions jointly on the white-background product image, the trademark crop, and the structured layout so that subject fidelity, trademark integrity, and character-level text accuracy are held together.

The authors report that the framework runs in production at a scale of millions of main images per day with a latency of a few seconds per image, which they believe makes it among the first systems of this kind to operate at commercial scale.

They also release CommerceGen-Bench, a benchmark of hard cases collected from live traffic across all product categories. On it, the framework achieves the highest overall scores among the evaluated open-source baselines on both editing tracks, with and without prompt enhancement. It also matches much larger closed-source models and beats several of them on Instruction Following and Product Integration, the two properties that determine whether an image can be published.
