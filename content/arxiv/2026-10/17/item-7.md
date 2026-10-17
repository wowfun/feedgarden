---
publish: true
content_type: "post"
title: "MSP: Modality Self-Play for Training Multimodal LLMs Without Paired Cross-Modal Data"
description: "Large multimodal models have improved by scaling capacity and training on massive paired multimodal data. The authors argue that this creates a bottleneck: aligned multimodal datasets are expensive to curate, hard to scale across modalit..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20965"
tags: ["source/arxiv","topics/models","topics/research"]
---

Large multimodal models have improved by scaling capacity and training on massive paired multimodal data. The authors argue that this creates a bottleneck: aligned multimodal datasets are expensive to curate, hard to scale across modality combinations and increasingly constrain progress.

They introduce Modality Self-Play &#40;MSP&#41;, a training framework based on proxy-mediated modality composition. Instead of paired cross-modal data, MSP uses anchor-supporting proxy textual descriptions of unseen modalities as semantic bridges. Given an observed modality such as an image or audio, the model generates proxy descriptions of complementary unseen modalities. These descriptions are encoded and aligned with the observed modality through learned bridges, allowing cross-modal interaction without real paired non-text supervision. The central hypothesis is that proxy text, together with contrastively trained pretrained encoders, supplies enough semantic structure for multimodal composition to emerge.

The authors report zero-shot modality composition: models trained with a real anchor modality and proxy descriptions can integrate and reason over multiple modalities at inference time despite never observing real paired non-text data during training. MSP achieved state-of-the-art or competitive results on several multimodal benchmarks, according to the paper. Ablations indicated that learned bridges improve alignment and that anchor-supporting proxy descriptions enable effective composition. The method still relies on modality-text pairs, pretrained contrastive encoders and calibration of the bridges to modality distributions; it removes the need for real paired non-text supervision such as audio-vision pairs.
