---
publish: true
content_type: "post"
title: "8x Radeon Pro V620 rig with a custom vLLM fork serves Qwen3.8-Flash-Next at 60-100 t/s decode"
description: "A user assembled a roughly $2,800 machine from eight Radeon Pro V620 cards, older RDNA2 enterprise cloud-gaming GPUs with 32 GB of VRAM each, for a total of 256 GB of VRAM. The author notes the headline price is slightly misleading since..."
date: "2026-10-08T17:12:46.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0wnz1/2800_rig_with_8x_radeon_pro_v620_256_gb_vram/"
tags: ["source/reddit","topics/inference","topics/models"]
---

A user assembled a roughly &#36;2,800 machine from eight Radeon Pro V620 cards, older RDNA2 enterprise cloud-gaming GPUs with 32 GB of VRAM each, for a total of 256 GB of VRAM. The author notes the headline price is slightly misleading since the cards can likely no longer be found at &#36;350 each. An RTX 4090 visible in the setup is used only for image and video generation, not for LLMs.

The cards were bought as a gamble on building a large-VRAM rig cheaply. llama.cpp worked but delivered poor prefill &#40;roughly 350-450 t/s on the same model&#41; and poor concurrency, and vLLM did not work on these cards at all, so the author was close to selling them. Instead, they had Claude write a custom vLLM fork with hand-iterated RDNA2 kernels, which resolved compatibility and produced much better throughput than expected.

Reported results with the orcarouter uncensored Qwen3.8-Flash-Next, self-quantized to W4A16 for routed experts with everything else left at BF16, run under vLLM with PP=4 and no tensor parallelism, concurrency 1, and MTP enabled with 3-token drafting:

- Decode throughput of 60 to 100 t/s, versus 40-50 t/s with MTP disabled.
- Prefill above 3,000 t/s, versus roughly 350-450 t/s under llama.cpp, which the author characterizes as about 800% faster.

The author plans to keep optimizing and to verify that DeepSeek and GLM-5.3-Flash also work. These are single-rig, self-reported llama-benchy measurements, not independent evaluations.

## Media

![Image: &#36;2800 rig with 8x Radeon Pro V620 &#40;256 GB VRAM&#41; + custom vLLM fork = Qwen3.8-Flash-Next at 60 to 100 t/s decode and 3000+ t/s prefill](<https://preview.redd.it/wqt70wfzx9uh1.jpeg?width=640&crop=smart&auto=webp&s=b01f54c06793ca6dbd1cc9a3d18c1af0df4b68f8>)

[Image: &#36;2800 rig with 8x Radeon Pro V620 &#40;256 GB VRAM&#41; + custom vLLM fork = Qwen3.8-Flash-Next at 60 to 100 t/s decode and 3000+ t/s prefill](<https://preview.redd.it/wqt70wfzx9uh1.jpeg?width=640&crop=smart&auto=webp&s=b01f54c06793ca6dbd1cc9a3d18c1af0df4b68f8>)
