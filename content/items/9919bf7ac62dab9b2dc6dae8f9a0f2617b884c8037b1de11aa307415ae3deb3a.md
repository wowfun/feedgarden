---
publish: true
content_type: "post"
title: "OmniCapBench: Deep-Structured Evaluation for Fine-Grained Audio-Visual Captioning"
description: "Multimodal large language models (MLLMs) are moving toward continuous audio-visual reasoning, creating an urgent need for evaluations that expose their capability limits. Audio-visual captioning is seen as an ideal diagnostic task, but curr"
date: "2026-10-08T17:59:21.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:59.851Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12458v1"
tags: ["source/arxiv","topics/evaluation","topics/models","topics/research"]
---

Multimodal large language models &#40;MLLMs&#41; are moving toward continuous audio-visual reasoning, creating an urgent need for evaluations that expose their capability limits. Audio-visual captioning is seen as an ideal diagnostic task, but current benchmarks face a coupled trade-off: whole-caption scores provide coverage without localization, local probes provide localization without coverage, and unconstrained LLM judges introduce instability. The authors introduce OmniCapBench, which reframes audio-visual caption evaluation as a deep-structured diagnostic framework.

OmniCapBench shifts the prediction target from free-form text to sets of atomic, verifiable evaluation units across three tracks: entity references, visual shots and audio events. This design enables reliable scoring with deterministic constraint checks plus localized LLM-based semantic comparisons. The benchmark includes 786 densely annotated videos.

The evaluation shows OmniCapBench can distinguish specific MLLM perception errors, including temporal grounding failures, identity drift, cross-modal misalignment and hallucinated descriptions. Evaluating frontier MLLMs reveals strong local perception but weak long-horizon audio-visual reasoning, particularly in identity drift and cross-modal misalignment. The authors present these findings as a fine-grained roadmap for omnimodal development.
