---
publish: true
content_type: "post"
title: "Three 4x R9700 inference builds with $127 used EPYCs at about $10.7k per machine"
description: "A user described building three GPU servers for their business, USA Arms, which organizes tens of thousands of firearms-related businesses (dealers, ammo sellers, ranges) and needs constantly updated data. The models check source facts, ..."
date: "2026-10-15T00:31:42.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:03:08.362Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x67qeu/4x_r9700_builds_with_127_used_epycs_107k_allin/"
tags: ["source/reddit","topics/hardware","topics/inference","topics/industry"]
---

A user described building three GPU servers for their business, USA Arms, which organizes tens of thousands of firearms-related businesses &#40;dealers, ammo sellers, ranges&#41; and needs constantly updated data. The models check source facts, reconcile business identities and extract details such as services and hours; every answer is verified against what the agent actually saw, and the documentation is stored so larger models can audit the work. The author says they moved the majority of their work to local AI sooner than planned because hosted models began refusing normal research tasks roughly two to three weeks earlier — for example declining to identify a gun dealer because the license holder might be an individual, or refusing to view an ammo dealer's website — which broke their harness in unpredictable ways.

Cost per box averaged &#36;10,733.91 including tax and shipping across the three machines, totaling 384GB of VRAM. Breakdown: 4x ASRock Radeon AI PRO R9700 Creator 32GB &#40;128GB VRAM&#41; at &#36;7,244.58 with each card capped at 210W; a used AMD EPYC 7452 &#40;32 cores&#41; at &#36;127.17; ASRock Rack ROMED8-2T/BCM at &#36;1,162.39 &#40;sourced from Helsinki during a global shortage&#41;; 8x 16GB DDR4-2666 ECC RDIMM using all eight channels at &#36;860.59; SilverStone HELA 2050R Platinum at &#36;578.92; SilverStone RM44 4U chassis at &#36;388.40; Samsung 990 PRO 1TB at &#36;254.39; and coolers/fans for &#36;117.48. The GPUs are about two-thirds of the cost. The boxes also run the business's CI/CD; the author reports that Rust builds run fine if tuned to prioritize inference, with no measurable throughput change and builds only 3–8% slower.

Software: vLLM-Radiance 1.0.387 &#40;vLLM 0.30.0, ROCm 7.14&#41;, Qwen/Qwen3.8-27B-FP8 with FP8 KV cache and the model's own MTP head with 8 draft tokens. Two engines per box at TP=2 each, 8 sequences per engine, 256K max context, about 488K tokens of KV cache per engine. Against several tested models, GLM gave the best results and Qwen the best cost-to-performance.

Benchmarks &#40;vllm bench serve, one box, 2x TP2&#41;: 1 user on MT-Bench 53.1 tok/s with TTFT p50 125 ms; 16 users 484 tok/s aggregate, about 40 tok/s per user; 16 users random 1024-in/512-out 623 tok/s aggregate at 837W average for the four cards; 32 users 603 tok/s. MTP acceptance varies with text: 83% of drafts accepted &#40;7.6 tokens per step&#41; on JSON extraction versus 39% &#40;2.7 per step&#41; on MT-Bench, so MT-Bench undersells structured output. Long-prompt prefill of 8 unique real-text prompts &#40;4 per engine&#41; scaled from 7,044 tok/s at 4K to 5,961 tok/s at 64K, with 4x 128K &#40;TP=4&#41; at 3,344 tok/s and 4x 256K at 2,719 tok/s; every prompt was unique with 0% prefix cache hits.

## Media

![Image: 4x R9700 builds with &#36;127 used EPYCs: &#36;10.7k all-in per machine. I built three &#40;384GB VRAM&#41;](<https://preview.redd.it/ok6jarmvzivh1.jpg?width=140&height=105&auto=webp&s=9695a3c78461da07086c738e105c7e5a6e9ff5d5>)

[Image: 4x R9700 builds with &#36;127 used EPYCs: &#36;10.7k all-in per machine. I built three &#40;384GB VRAM&#41;](<https://preview.redd.it/ok6jarmvzivh1.jpg?width=140&height=105&auto=webp&s=9695a3c78461da07086c738e105c7e5a6e9ff5d5>)
