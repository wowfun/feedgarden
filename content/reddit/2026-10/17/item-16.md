---
publish: true
content_type: "post"
title: "ORL pushes diffusion LLM decoding to 2,788 tokens/s on one RTX 5090"
description: "A research team introduced On-Policy Residual Learning (ORL), a post-training method for diffusion language models, and dlmrt, its inference engine. It reports 2,788 tokens/s on one RTX 5090 with LLaDA-2.1-mini in NVFP4 and 7,708 tokens/..."
date: "2026-10-16T19:33:04.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:47:52.494Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x7polk/research_2788_tokenss_on_a_single_rtx_5090_with_a/"
tags: ["source/reddit","topics/research","topics/inference","topics/models"]
---

A research team introduced On-Policy Residual Learning &#40;ORL&#41;, a post-training method for diffusion language models, and dlmrt, its inference engine. It reports 2,788 tokens/s on one RTX 5090 with LLaDA-2.1-mini in NVFP4 and 7,708 tokens/s on eight B200s with DiffusionGemma 26B MoE. QwenDLM-4B gets up to 6.9× higher end-to-end throughput at comparable or better quality. The authors stress these are single-request, batch-size-1 peak benchmark results, not averages, and that the models, training code, evaluation pipeline and engine are open source.

Instead of predicting everything from scratch at each denoising step, ORL carries previous predictions forward as residual context and refines them. Because these self-generated residuals shift in distribution during training, ORL trains on fresh trajectories from the current model, replaying the exact residual states encountered at inference. A second objective, Adjacent Entropy Contraction, encourages each step to reduce uncertainty relative to the previous one, with loss gating so already-confident predictions are not pushed further.

On QwenDLM-4B, tokens per forward pass rise up to 6.2× and HumanEval pass@1 improves from 82.9% to 89.6%. LLaDA-2.1-mini needs only 4.2M self-generated tokens and 36 H100 GPU-hours of post-training for up to 3× throughput at comparable quality. DiffusionGemma 26B MoE gains up to 1.2× more tokens per forward. On one H100, QwenDLM-4B + ORL reaches 1,298 tokens/s versus 746 for DFlash and 405 for EAGLE3 under relaxed verification at comparable measured accuracy, though the comparison pits dlmrt against vLLM.

dlmrt captures the entire denoising loop in a CUDA graph and runs it on the GPU; it supports NVFP4 on Blackwell, including the RTX 5090, and is 1.2–1.6× faster than SGLang/vLLM with identical settings in single-H100 tests. Training-side work includes efficient residual-state capture, specialized attention kernels and compute-balanced packing, speeding steps up to 5.2×.
