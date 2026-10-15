---
publish: true
content_type: "post"
title: "GeoReform: Reflective Formalization Evolution for Multimodal Geometry Problem Solving"
description: "Multimodal large language models (MLLMs) often struggle to identify and use geometric relations in diagrams. A common remedy is to convert geometric entities, relations and constraints into explicit text the model can reason over, but th..."
date: "2026-10-08T17:39:12.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:47.674Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12391v1"
tags: ["source/arxiv","topics/models","topics/research"]
---

Multimodal large language models &#40;MLLMs&#41; often struggle to identify and use geometric relations in diagrams. A common remedy is to convert geometric entities, relations and constraints into explicit text the model can reason over, but the paper argues effective formalization is far from trivial: on Geometry3K, structure injection fixes 28 errors while introducing 13 new ones among 200 examples. Redundant relations can distract the model, and ambiguous references to diagram elements can lead it to apply constraints incorrectly.

The claim is therefore that the key challenge is not extracting more geometric facts but organizing them into representations that support downstream reasoning. The authors propose GeoReform, a reflective formalization evolution framework that treats formalization as an optimizable policy rather than fixed parser output. GeoReform runs the full reasoning pipeline, collects failed rollouts, diagnoses defects in the current representation, and mutates the policy so it better selects, grounds, groups and presents geometric entities, relations, constraints and targets.

On Geometry3K, GeoReform raises Qwen3VL-2B accuracy from 42.0% to 56.0%. The authors report extensive experiments and analyses across geometry reasoning benchmarks supporting the conclusion that effective formalization is crucial for improving multimodal geometry reasoning.
