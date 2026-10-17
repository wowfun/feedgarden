---
publish: true
content_type: "post"
title: "DropKV: Decoupling Residual-Output Perturbation for Near-Optimal KV-Cache Eviction"
description: "Key-value (KV) cache management is a critical bottleneck for scaling LLMs to long-context use because memory grows linearly. Recent eviction methods have moved beyond simple attention-score heuristics by incorporating value representatio..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22130"
tags: ["source/arxiv","topics/inference","topics/models"]
---

Key-value &#40;KV&#41; cache management is a critical bottleneck for scaling LLMs to long-context use because memory grows linearly. Recent eviction methods have moved beyond simple attention-score heuristics by incorporating value representations, but they face a trade-off: minimizing output perturbation is an NP-hard combinatorial problem, which leads to mathematically suboptimal heuristics or implementations that are difficult to kernelize.

DropKV is a simple, principled eviction framework based on Decoupled Residual-Output Perturbation. It decouples the joint eviction decision into independent per-token scoring, avoiding combinatorial intractability. Under a cone condition that the authors empirically verify on three long-context LLMs, DropKV admits a provable constant-factor approximation guarantee. To make the method practical, the authors provide an implementation using fused Triton kernels that avoid materializing the full attention matrix.

That implementation delivers a 19.8x speedup in the scoring kernel, which translates into up to a 9.9% matched-batch end-to-end prefill speedup. On the RULER and LongBench benchmarks, DropKV consistently outperforms state-of-the-art baselines at equivalent cache budgets, according to the paper, while also achieving the lowest inference latency among eviction methods and remaining faster than the dynamic cache baseline. The abstract does not report absolute quality or latency figures.
