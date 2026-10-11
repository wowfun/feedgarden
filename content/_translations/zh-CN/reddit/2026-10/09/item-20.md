---
publish: true
content_type: "post"
title: "你用什么跑 NVFP4，体验如何？"
description: "一位在多 GPU 上运行 NVFP4 量化模型的用户询问大家都在用什么方案，并表示自己唯一能跑起来的是 Unsloth。该用户称 vLLM 太慢、加载耗时极长，而 TensorRT-LLM 问题太多。 他还询问 NVFP4 与 Q4 GGUF 在 Qwen 3.8 级别模型上的对比，以及 NVFP4 是否比 Q4 GGUF 更接近 Q6 GGUF。 他测试了 Qwen3.8-27B 的 NVFP4 模型（neroued/Qwen3.8-27B-nvfp4-NInfer）搭配 "
date: "2026-10-08T18:38:24.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0yxrf/what_are_you_using_for_nvfp4_and_do_you_like_it/"
tags: ["source/reddit","topics/inference","topics/hardware","topics/models"]
---

一位在多 GPU 上运行 NVFP4 量化模型的用户询问大家都在用什么方案，并表示自己唯一能跑起来的是 Unsloth。该用户称 vLLM 太慢、加载耗时极长，而 TensorRT-LLM 问题太多。

他还询问 NVFP4 与 Q4 GGUF 在 Qwen 3.8 级别模型上的对比，以及 NVFP4 是否比 Q4 GGUF 更接近 Q6 GGUF。

他测试了 Qwen3.8-27B 的 NVFP4 模型（neroued/Qwen3.8-27B-nvfp4-NInfer）搭配 neroued/ninfer 运行时。初步测试在代码方面表现不佳，但视觉与工具调用被评价为非常出色。在复杂场景的简短测试中，效果略好于他此前使用 Q6 GGUF 的体验，但他计划在花了大量时间把 ninfer 接入前端之后再重新评估。

在 2x5060ti 上速度被形容为极快，上下文达 197k，模型加载仅需 4-6 秒。发帖者强调这只是早期定性测试，没有任何基准数据，再次评估后主观感受可能改变。
