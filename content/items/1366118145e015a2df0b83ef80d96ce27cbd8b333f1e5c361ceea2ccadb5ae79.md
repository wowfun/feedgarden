---
publish: true
content_type: "post"
title: "LoRA over GGUF: training Qwen3.8-Flash-Next in 40 GiB VRAM"
description: "The author posted an update to a LoRA over GGUF series, sharing a recipe for training Qwen3.8-Flash-Next (a 125B-A6B model with a 51B engram) inside 40 GiB of VRAM, with no CPU offloading and with the engram stored on disk without reducing "
date: "2026-10-09T03:54:39.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1bdvl/lora_over_gguf_train_qwen38flashnext_in_40g_vram/"
tags: ["source/reddit","topics/models","topics/inference","topics/research"]
---

The author posted an update to a LoRA over GGUF series, sharing a recipe for training Qwen3.8-Flash-Next &#40;a 125B-A6B model with a 51B engram&#41; inside 40 GiB of VRAM, with no CPU offloading and with the engram stored on disk without reducing training speed.

Reported throughput on Strix Halo was a context chunk size of 2048 at 9.5 s/it, which the author describes as 200 tokens/s. They note there is still room to optimize, comparing it against more than 1,600 tokens/s achieved for prefill &#40;PP&#41;, and against the common expectation that LoRA training costs two to three times the work of prefill.

The author credits transformers 5.18 for merging initial support for modern GGUF and expects more work in that direction. They also preview GGTensile in the torch-ggml-ops repository, described as Tensile-like assembly-level optimization of MMQ kernels that is already faster than HIP in many cases, with a follow-up post planned once results are available.

As a side note, the author says they will skip DeepSeek-V4.1 unless someone can quantize or prune it below 125 GiB. The linked GitHub repository is transformers5-qwen3.5-recipe.
