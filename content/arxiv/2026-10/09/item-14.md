---
publish: true
content_type: "post"
title: "SparseDecoding: Decoding-Aware Pruning for Accurate and Efficient LLM Inference"
description: "The decoding stage of LLM inference is memory-bound and therefore slow. Layer-wise, training-free pruning guided by the Hessian has been a prominent fix, because pruning reduces the nonzero parameters read from memory during decoding. Bu..."
date: "2026-10-08T17:06:32.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:52.195Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12327v1"
tags: ["source/arxiv","topics/inference","topics/hardware"]
---

The decoding stage of LLM inference is memory-bound and therefore slow. Layer-wise, training-free pruning guided by the Hessian has been a prominent fix, because pruning reduces the nonzero parameters read from memory during decoding. But such methods typically compute the Hessian from pre-collected natural sequences, whereas during decoding the model is fed self-generated tokens, creating a distribution shift. The Hessian computed on natural text differs from that computed on generated text, and the authors observe that this discrepancy pushes the generation-time activation distribution away from the one used for pruning, hurting the pruned model's quality. They also note most existing pruning methods that deliver real speedup target sparse matrix-matrix multiplication, with limited support for the sparse matrix-vector &#40;SpMV&#41; operations that dominate decoding.

SparseDecoding is a decoding-aware pruning framework. Algorithmically, it builds calibration matrices from layer-wise activations collected during dense-model autoregressive generation, excluding prefill, aligning the pruning objective with decoding activations. System-wise, it implements an optimized N:M sparse matrix-vector kernel with bitmask indexing and fixed-step traversal.

On Llama-3.1-8B, Llama-3.3-70B and Qwen3-14B/32B, the method consistently outperforms standard fixed-text calibration on long-form generation benchmarks and achieves up to 1.48x end-to-end wall-clock decoding speedup on A100 GPUs.
