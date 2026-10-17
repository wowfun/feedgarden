---
publish: true
content_type: "post"
title: "CoWorld Reasoner: Agentic Multimodal Reasoning with the Evolving Video World Model-Driven Harness"
description: "Vision-language models (VLMs) are increasingly asked to reason about motion, actions and view changes that go beyond what the input images show. Video world models (VWMs) can generate task-relevant visual content as extra evidence, but e..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21910"
tags: ["source/arxiv","topics/agents","topics/models","topics/agent-self-improvement"]
---

Vision-language models &#40;VLMs&#41; are increasingly asked to reason about motion, actions and view changes that go beyond what the input images show. Video world models &#40;VWMs&#41; can generate task-relevant visual content as extra evidence, but existing systems usually invoke them through fixed pipelines built around a predefined form of imagination such as novel-view synthesis.

CoWorld Reasoner is an agentic framework that treats a VWM as a unified visual reasoning engine. Its Video World Model-Driven Harness exposes multiple visual operations as tools and uses skills to guide the VLM in deciding whether to imagine, choosing an operation, constructing a generation request and interpreting the resulting visual evidence.

The authors also introduce VLM-VWM Harness Co-Evolution, which jointly revises tools, skills and execution code based on execution feedback while keeping both models' weights fixed. Across seven benchmarks covering spatial intelligence, temporal and causal reasoning, and perceptual reasoning, CoWorld Reasoner outperforms direct reasoning with the same VLM. The strongest variant improves all seven benchmarks, with relative accuracy gains of 11.8% on MMSI and 13.0% on ERQA, and beats all five evolving baselines with the same backbone on five benchmarks.
