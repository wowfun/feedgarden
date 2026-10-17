---
publish: true
content_type: "post"
title: "ORL 让扩散语言模型在单张 RTX 5090 上达到每秒 2,788 个 token"
description: "一个研究团队提出了面向扩散语言模型的后训练方法 On-Policy Residual Learning（ORL），并配套开发了推理引擎 dlmrt。他们报告称，LLaDA-2.1-mini 加 ORL 在单张 RTX 5090 上以 NVFP4 达到每秒 2,788 个 token；DiffusionGemma 26B MoE 加 ORL 在 8 张 B200 上达到每秒 7,708 个 token。由 Qwen3-4B 转换而来的 QwenDLM-4B 在质量相当或更..."
date: "2026-10-16T19:33:04.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:47:52.494Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x7polk/research_2788_tokenss_on_a_single_rtx_5090_with_a/"
tags: ["source/reddit","topics/research","topics/inference","topics/models"]
---

一个研究团队提出了面向扩散语言模型的后训练方法 On-Policy Residual Learning（ORL），并配套开发了推理引擎 dlmrt。他们报告称，LLaDA-2.1-mini 加 ORL 在单张 RTX 5090 上以 NVFP4 达到每秒 2,788 个 token；DiffusionGemma 26B MoE 加 ORL 在 8 张 B200 上达到每秒 7,708 个 token。由 Qwen3-4B 转换而来的 QwenDLM-4B 在质量相当或更好时，端到端吞吐最高提升约 6.9 倍。作者强调这些都是单请求、批大小为 1 的峰值基准结果，而非平均值，并且模型、训练代码、评测流程和推理引擎均已开源。

ORL 不在每个去噪步骤从零预测，而是把先前的预测作为残差上下文保留并继续精炼。由于这些由模型自身生成的残差在训练中分布会变化，ORL 直接在当前模型生成的新轨迹上训练，重放推理时遇到的精确残差状态。第二个目标是相邻熵收缩（Adjacent Entropy Contraction），鼓励每一步相对上一步降低不确定性，同时用损失门控避免继续推动已经高置信度的预测。

在 QwenDLM-4B 上，每次前向可多产出最多 6.2 倍的 token，HumanEval pass@1 从 82.9% 升至 89.6%。LLaDA-2.1-mini 仅需 420 万自生成 token 和 36 个 H100 GPU 小时的后训练，便在质量相当下实现最高 3 倍吞吐。DiffusionGemma 26B MoE 每次前向的 token 数最多再提高 1.2 倍。在单张 H100 上，QwenDLM-4B + ORL 达到每秒 1,298 个 token，DFlash 为 746、EAGLE3 为 405；这是在放宽验证且实测精度相当的情况下，不过比较中 ORL 使用 dlmrt，而投机解码器使用 vLLM。

dlmrt 把整个去噪循环捕获进一个 CUDA 图并在 GPU 上执行，支持 Blackwell 上的 NVFP4（包括 RTX 5090）；在模型和解码设置相同时，其单张 H100 测试比 SGLang/vLLM 快 1.2–1.6 倍。训练侧还采用高效残差状态捕获、专用注意力内核和计算均衡打包，使训练步骤最高加速 5.2 倍。
