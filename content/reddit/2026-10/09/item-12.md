---
publish: true
content_type: "post"
title: "Mixed results testing llama.cpp's MoE expert host-memory cache on an 8GB GPU"
description: "A user with an 8 GB RTX 4060 and 32 GB of DDR5-5600 memory tested the feature added in llama.cpp PR #29887, which keeps MoE experts in a host-memory GPU cache, using build b11491 and a Qwen3.6-35B-A3B model in IQ4_XS quantization. They repo"
date: "2026-10-08T17:23:57.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0wyge/probably_im_doing_something_wrong_using_pr29887/"
tags: ["source/reddit","topics/inference","topics/evaluation"]
---

A user with an 8 GB RTX 4060 and 32 GB of DDR5-5600 memory tested the feature added in llama.cpp PR &#35;29887, which keeps MoE experts in a host-memory GPU cache, using build b11491 and a Qwen3.6-35B-A3B model in IQ4&#95;XS quantization. They report not getting the throughput they expected and ask whether they are configuring it wrongly, and invite others with limited VRAM to share their tokens-per-second figures.

Prompt-eval and generation results reported across configurations:

- -cmoe with a fixed cache and llama-server defaults: prompt eval 45.32 t/s, generation 23.36 t/s over 1,750 tokens.
- -cmoe --moe-cache-mib 1536: 28.70 t/s prompt eval, 15.02 t/s generation.
- -cmoe --moe-cache-mib 2048: 22.65 t/s prompt eval, 13.40 t/s generation.
- -cmoe --moe-cache-mib 4096: 17.37 t/s prompt eval, 19.60 t/s generation.
- -cmoe --moe-cache-mib 8192: 12.30 t/s prompt eval, 12.04 t/s generation.
- -cmoe --moe-cache-mib 2048 with a 131,072-token context: 26.14 t/s prompt eval, 15.30 t/s generation.
- --moe-cache-mib 2048 without -cmoe &#40;fit enabled by default&#41;: 65.62 t/s prompt eval, 24.20 t/s generation.
- Adding -b 2048 -ub 2048 without -cmoe: 63.11 t/s prompt eval, 24.62 t/s generation.

The post is a request for help rather than a controlled experiment, and the run conditions are not fully specified, so the comparisons are suggestive rather than conclusive. The data nevertheless suggests that enabling the cache option in these configurations reduced throughput rather than improving it, and that the largest cache sizes performed worst.
