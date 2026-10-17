---
publish: true
content_type: "post"
title: "GeoThinker-F: Endogenous Predictive World Representations for Fast Spatial Intelligence"
description: "Geometry-aware multimodal large language models increasingly rely on external 3D encoders to supply structural priors, but running those additional encoder paths at inference adds substantial latency and computational overhead. The autho..."
date: "2026-10-14T17:59:03.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:43.420Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20592v1"
tags: ["source/arxiv","topics/inference","topics/models","topics/hardware"]
---

Geometry-aware multimodal large language models increasingly rely on external 3D encoders to supply structural priors, but running those additional encoder paths at inference adds substantial latency and computational overhead.

The authors propose GeoThinker-F, an efficient framework that internalizes spatiotemporal perception by transforming causal MLLM hidden states into predictive latent world representations. The core claim is that intermediate semantic representations already contain enough information to predict useful representations of current geometry and future semantics, without exactly reproducing features from a dedicated 3D encoder.

To realize this, GeoThinker-F uses a decoupled two-stage training strategy. In stage one, the MLLM backbone is frozen while lightweight Latent Frame Prediction &#40;LFP&#41; heads learn from an offline 3D geometry expert and from next-frame semantic targets. In stage two, the external expert is removed and the model is jointly optimized to generate and selectively integrate its self-predicted priors through a specialized Spatial-Grounded Temporal &#40;SGT&#41; Fusion module.

The reported evaluations show GeoThinker-F eliminates runtime dependence on external 3D geometry encoders while maintaining competitive performance across diverse spatial intelligence benchmarks. It achieves up to a 3.6x inference speedup, reducing latency from 1.45 seconds to 0.40 seconds, while retaining strong spatial reasoning performance.
