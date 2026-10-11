---
publish: true
content_type: "post"
title: "Qwen3.8-27B: 159 tok/s on R9700, 64 tok/s on Strix Halo"
description: "LemonSeed Studio is described as an iPad editor and IDE with on-device inference on an AMD GPU held in a Thunderbolt enclosure. It embeds the unmodified upstream Linux amdgpu and amdkfd driver as a PCIDriverKit extension and runs LemonSeed "
date: "2026-10-09T01:20:39.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x18e95/qwen3827b_159_toks_on_r9700_64_toks_on_strix_halo/"
tags: ["source/reddit","topics/inference","topics/hardware","topics/models"]
---

LemonSeed Studio is described as an iPad editor and IDE with on-device inference on an AMD GPU held in a Thunderbolt enclosure. It embeds the unmodified upstream Linux amdgpu and amdkfd driver as a PCIDriverKit extension and runs LemonSeed Engine &#40;LSE&#41; on the GPU. The demonstration uses an iPad Pro with a Sapphire Radeon AI PRO R9700, running Qwen3.8-27B Q4 with a Q8 DFlash2 draft and 131k context.

LSE is the same engine across Linux, macOS and iPadOS. It records the model's forward pass as a graph, fuses operations, and generates kernels for the GPU it is running on; where a kernel has several layouts it measures each on the device and keeps the fastest. Speculative decoding with MTP and DFlash2 chooses how many draft tokens to verify based on measured acceptance and cost.

Reported decode throughput for Qwen3.8-27B Q4 with a code prompt, shown as baseline / MTP=3 / DFlash2 in tok/s:
- R9700 on iPadOS: 31.2 / 108.7 / 158.5
- R9700 on macOS: 32.2 / 111.9 / 159.4
- R9700 on Linux: 32.0 / 111.0 / 144.6
- Strix Halo &#40;Radeon 8060S&#41; on Linux: 14.0 / 47.8 / 64.4

Prefill at 4K tokens is reported as 1,636 &#40;iPadOS&#41;, 1,634 &#40;macOS&#41;, 1,418 &#40;Linux R9700&#41; and 517 &#40;Strix Halo&#41;, holding up at 32K with 1,395 / 1,401 / 1,226 / 462. Version 0.5.8 turns on DFlash2 draft trees by default, so one target pass verifies a tree of draft candidates when that measures faster than a chain; adds Strix Halo &#40;gfx1151&#41; prefill and decode with a fused gate/up GEMM and two query tiles per workgroup in prefill attention; fixes a startup GPU fault; bundles its own HSA runtime in the Linux archive so only the amdgpu driver with /dev/kfd access is needed; and adds a command to pull Hugging Face models with their MTP or DFlash2 companions. There is an OpenAI-compatible server, a CLI and a C library &#40;libLSE&#41;.

## Images and video

- [Image: Qwen3.8-27B: 159 tok/s on R9700, 64 tok/s on Strix Halo](<https://preview.redd.it/3pwkx9zjfcuh1.jpg?width=140&height=105&auto=webp&s=735c30ecfe38936d741d0093faa434aa9413d83d>)
