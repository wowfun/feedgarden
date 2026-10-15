---
publish: true
content_type: "post"
title: "Benchmarking four open decision models on one RTX 4090"
description: "A user benchmarked four recently released open \"decision\" models on the same rented RTX 4090 (driver 580.119.02, 32 vCPU), using llama.cpp build b11495 (commit 37ac63456, CUDA 12.8) with -ngl 99 and otherwise default settings. The task: ..."
date: "2026-10-08T17:04:32.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0wg85/running_decision_model_locally_on_an_rtx_4090_to/"
tags: ["source/reddit","topics/evaluation","topics/inference","topics/models"]
---

A user benchmarked four recently released open "decision" models on the same rented RTX 4090 &#40;driver 580.119.02, 32 vCPU&#41;, using llama.cpp build b11495 &#40;commit 37ac63456, CUDA 12.8&#41; with -ngl 99 and otherwise default settings. The task: read nine Wikipedia articles about centipedes &#40;9,534 words&#41; word by word and flag every word naming a centipede, one /v1/systemone call per word, with the next word sent as soon as the answer returned. Latency was end-to-end from a Python client on the same box over localhost.

Reported results &#40;per-word p50 latency, words processed in 32 seconds, accuracy, share of centipede names caught, wrong picks&#41;:

- Laya &#40;Laya-BF16.gguf, llama.cpp&#41;: 3.9 ms, 7,980 words, 97.4% accuracy, 70% of names caught, 98 wrong picks.
- d1 3B &#40;d1-3B-AD-Q4&#95;K&#95;M.gguf, llama.cpp&#41;: 6.0 ms, 5,306 words, 96.5%, 51% caught, 51 wrong picks.
- Clef-Flash 9B &#40;Clef-Flash-Q8&#95;0.gguf, llama.cpp&#41;: 24.4 ms, 1,292 words, 97.2%, 36% caught, 2 wrong picks.
- Lev 4B &#40;interfaze-ai/lev bf16, lev serve on PyTorch&#41;: 51.0 ms, 626 words, 98.9%, 83% caught, 4 wrong picks.

The author cautions that accuracy is inflated because answering "no" also counts as correct and centipede-naming words are rare, so task-specific catch rate matters more. Lev caught the most names but was about 13x slower than Laya, partly because it runs in its own PyTorch server rather than llama.cpp; the author also measured 68 ms for it on a different 4090, suggesting CPU sensitivity. Model size is noted as a major but not sole factor. The author's pick is Laya, citing speed and ease of fine-tuning, though the conclusion rests on a single task and one hardware configuration.

## Media

![Image: Running decision model locally on an RTX 4090 to find out which one is the fastest](<https://external-preview.redd.it/M2F5N2Q4NHl5OXVoMfURPj1VUjR_LLxIDVHzPfgGD8G3mPOdqioS8x-hwSV8.png?width=640&crop=smart&auto=webp&s=71d097399779e063f49dc47fa3afab062b3fa375>)

[Image: Running decision model locally on an RTX 4090 to find out which one is the fastest](<https://external-preview.redd.it/M2F5N2Q4NHl5OXVoMfURPj1VUjR_LLxIDVHzPfgGD8G3mPOdqioS8x-hwSV8.png?width=640&crop=smart&auto=webp&s=71d097399779e063f49dc47fa3afab062b3fa375>)
