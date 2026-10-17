---
publish: true
content_type: "post"
title: "ReaDy: Recurrent States as Dynamic Context for Speculative Drafting in Hybrid Linear Attention LLMs"
description: "Speculative decoding accelerates autoregressive generation by drafting multiple tokens per step, yet feature-based drafters rely on target hidden features whose contextual emphasis may not align with the needs of subsequent draft positio..."
date: "2026-10-14T17:08:52.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:35.641Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20503v1"
tags: ["source/arxiv","topics/inference","topics/models","topics/hardware"]
---

Speculative decoding accelerates autoregressive generation by drafting multiple tokens per step, yet feature-based drafters rely on target hidden features whose contextual emphasis may not align with the needs of subsequent draft positions. Hybrid linear attention &#40;HLA&#41; models maintain compact recurrent states that accumulate historical associations, offering an efficient source of complementary context for drafting.

The paper introduces ReaDy, described as the first speculative decoding method to leverage HLA recurrent states for position-specific context retrieval during drafting. ReaDy equips each draft position with a learned query to retrieve supplementary context directly from the target's committed recurrent states. A lightweight state reader integrates this context into draft representations through residual updates, while low-rank state reads and fused operators keep additional computation and I/O overhead low. Building on DSpark's parallel backbone and sequential prediction head, ReaDy uses a lightweight two-stage adaptation strategy, with reader capacity, state sources and residual placement examined through ablations.

Across seven benchmarks spanning mathematics, code generation and dialogue, ReaDy achieves an average 3.16× decoding speedup over autoregressive decoding with Qwen3.8-27B on a single NVIDIA B200 GPU. It outperforms DSpark on every benchmark, improving throughput by 7.97% and acceptance length by 8.50% on average. Code is available on GitHub.
