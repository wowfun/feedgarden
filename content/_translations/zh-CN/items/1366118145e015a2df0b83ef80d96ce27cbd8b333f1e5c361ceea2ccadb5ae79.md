---
publish: true
content_type: "post"
title: "基于 GGUF 的 LoRA：在 40 GiB 显存中训练 Qwen3.8-Flash-Next"
description: "作者发布了 LoRA over GGUF 系列的更新，分享了一套在 40 GiB 显存内训练 Qwen3.8-Flash-Next（125B-A6B，外加 51B engram）的方案：无需 CPU offload，engram 放在磁盘上且不会降低训练速度。 在 Strix Halo 上的实测吞吐为上下文分块大小 2048、9.5 s/it，作者称相当于 200 token/s。他们指出仍有优化空间，并对比了已实现的超过 1600 token/s 的预填充（PP）速度，以及"
date: "2026-10-09T03:54:39.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1bdvl/lora_over_gguf_train_qwen38flashnext_in_40g_vram/"
tags: ["source/reddit","topics/models","topics/inference","topics/research"]
---

作者发布了 LoRA over GGUF 系列的更新，分享了一套在 40 GiB 显存内训练 Qwen3.8-Flash-Next（125B-A6B，外加 51B engram）的方案：无需 CPU offload，engram 放在磁盘上且不会降低训练速度。

在 Strix Halo 上的实测吞吐为上下文分块大小 2048、9.5 s/it，作者称相当于 200 token/s。他们指出仍有优化空间，并对比了已实现的超过 1600 token/s 的预填充（PP）速度，以及业界普遍认为 LoRA 训练工作量约为 PP 的 2–3 倍的经验。

作者将现代 GGUF 初步支持的合入归功于 transformers 5.18，并预期这一方向会有更多进展。他还预告了 torch-ggml-ops 仓库中的 GGTensile：类似 Tensile 的 MMQ 内核汇编级优化，在许多情况下已快于 HIP，待有结果后将另发帖说明。

补充一点，作者表示将跳过 DeepSeek-V4.1，除非有人能把它量化或剪枝到 125 GiB 以下。所附 GitHub 仓库为 transformers5-qwen3.5-recipe。
