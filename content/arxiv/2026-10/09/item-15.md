---
publish: true
content_type: "post"
title: "VFold: Symmetry-Aware Cross-Layer Value Cache Compression"
description: "Caching key-value (KV) states accelerates LLM decoding, but at long context lengths the cache can dominate memory usage. One approach is to compress that memory by exploiting inter-layer cache similarities, yet most existing techniques r..."
date: "2026-10-08T17:14:28.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:52.195Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12338v1"
tags: ["source/arxiv","topics/inference"]
---

Caching key-value &#40;KV&#41; states accelerates LLM decoding, but at long context lengths the cache can dominate memory usage. One approach is to compress that memory by exploiting inter-layer cache similarities, yet most existing techniques require architectural changes to the LLM and incur substantial overhead.

The paper proposes a symmetry-aware value cache merging strategy that reduces cache memory while avoiding both harmful performance degradation and architectural overhead during decoding. The authors further show the approach can be used alongside existing cache compression techniques, composing with high-ratio quantization or key cache pruning to reach compression ratios neither method reaches alone, at minimal additional cost.

The stated conclusion is that this reveals a major source of underutilized capacity in the value cache, offering a simple but highly effective direction for scaling context windows under memory constraints.
