---
publish: true
content_type: "post"
title: "DocPilot: Interactive Agent Orchestration and Training for Long Visual Document Understanding"
description: "Answering questions over long multimodal documents requires models to find sparse evidence across many pages and modalities, understand heterogeneous content and reason over what they collect. Even advanced vision-language models can ove..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21327"
tags: ["source/arxiv","topics/agents","topics/models"]
---

Answering questions over long multimodal documents requires models to find sparse evidence across many pages and modalities, understand heterogeneous content and reason over what they collect. Even advanced vision-language models can overlook sparse evidence and struggle with cross-modal reasoning in a single pass. Existing document agents add multi-step interaction, but some depend on predefined workflows or coarse-grained actions, limiting the flexibility and granularity of their reasoning.

DocPilot is an agentic document framework designed to support expressive orchestration and to make complex document solving learnable by small language models. It seeks evidence through page-level navigation and fine-grained evidence localization, and combines local visual inspection, code-based numerical reasoning and cross-modal reasoning for multimodal understanding.

To transfer these capabilities to small models, the authors propose curriculum-based agentic training that moves from learning single abilities to adaptive orchestration, supervised by data-grounded reasoning traces and executable interaction trajectories. Across MMLongBench-Doc, DocBench, FinRAGBench-V and MADQA, DocPilot achieves strong gains with frontier VLM backbones, while DocPilot-4B delivers performance competitive with substantially larger models, indicating effectiveness and generalization across diverse long-document reasoning settings.
