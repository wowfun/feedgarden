---
publish: true
content_type: "post"
title: "Cortex: Consolidating Context into Parametric Memory"
description: "Context can improve large language model performance, but those gains may vanish once the context is removed. Inspired by biological memory consolidation, the authors formulate Memory Consolidation (MC) as internalizing context-induced g..."
date: "2026-10-14T16:03:01.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:29.710Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20399v1"
tags: ["source/arxiv","topics/models","topics/research","topics/inference"]
---

Context can improve large language model performance, but those gains may vanish once the context is removed. Inspired by biological memory consolidation, the authors formulate Memory Consolidation &#40;MC&#41; as internalizing context-induced gains while preserving non-target capabilities, tying together context-specified editing, skill learning and behavioral steering under one objective.

They build a five-task-family testbed that measures consolidation and retention under single, batch and sequential updates, and propose Cortex. Cortex generates prospective queries to anticipate how a given context will be used, then distills context-conditioned outputs into mergeable low-rank or structural feed-forward network updates. Across 4B to 120B dense and mixture-of-experts backbones, covering text-only and multimodal models, Cortex sits on the empirical consolidation-retention Pareto frontier in most evaluated settings.

One concrete number illustrates the trade-off: after 50 sequential factual edits on a 14B model, Cortex-Structural recovers 88.9% of the context-induced gain while retaining 99.8% of original non-target performance.
