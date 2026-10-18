---
publish: true
content_type: "post"
title: "ORL：单张 RTX 5090 上扩散语言模型解码达 2,788 tokens/s"
description: "ORL（On-Policy Residual Learning，在策略残差学习）项目称，该方法能在不牺牲生成质量的前提下加速扩散语言模型（dLLM），并已开源模型、训练代码、评测流程以及自研推理引擎 dlmrt。 扩散语言模型可并行细化多个 token，但收敛较慢。ORL 让模型把此前预测作为残差上下文保留下来逐步修正，而不是在每个去噪步骤从头预测。由于这些残差由模型自身生成、其分布在训练过程中会变化，ORL 直接用当前模型生成的新轨迹训练，重放推理时遇到的残差状态，以..."
date: "2026-10-16T20:03:32.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:47:56.708Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x7qgr0/research_2788_tokenss_on_a_single_rtx_5090_with_a/"
tags: ["source/reddit","topics/research","topics/inference","topics/models"]
---

ORL（On-Policy Residual Learning，在策略残差学习）项目称，该方法能在不牺牲生成质量的前提下加速扩散语言模型（dLLM），并已开源模型、训练代码、评测流程以及自研推理引擎 dlmrt。

扩散语言模型可并行细化多个 token，但收敛较慢。ORL 让模型把此前预测作为残差上下文保留下来逐步修正，而不是在每个去噪步骤从头预测。由于这些残差由模型自身生成、其分布在训练过程中会变化，ORL 直接用当前模型生成的新轨迹训练，重放推理时遇到的残差状态，以避免陈旧离线残差造成的不匹配。另一项“相邻熵收缩”（Adjacent Entropy Contraction）鼓励每个去噪步骤相对上一步降低不确定性，并对损失做门控，避免继续推动已经高置信的预测。

公布的单项请求（batch size 1）结果包括：
- 在单张 RTX 5090 上，LLaDA-2.1-mini 配合 ORL 与 NVFP4 达到 2,788 tokens/s；在 8× B200 上，DiffusionGemma 26B MoE 配合 ORL 与 NVFP4 达到 7,708 tokens/s。
- QwenDLM-4B 每次前向的 token 数最高提升 6.2 倍，借助 dlmrt 的端到端吞吐约提升 6.9 倍；HumanEval pass@1 从 82.9% 升至 89.6%。
- LLaDA-2.1-mini 仅用 420 万自生成训练 token 和 36 个 H100 GPU 小时的后训练，就在质量相当的情况下把吞吐提升至多 3 倍。

在单张 H100 上，QwenDLM-4B 配合 ORL 达到 1,298 tokens/s，DFlash 为 746、EAGLE3 为 405，测得精度相当；不过 ORL 使用 dlmrt，投机解码器使用 vLLM。dlmrt 把整个去噪循环捕获为 CUDA 图并在 GPU 上执行，支持 Blackwell（含 RTX 5090）上的 NVFP4，在单 H100 对比中比 SGLang/vLLM 快 1.2–1.6 倍。作者强调，这些数字是 batch size 为 1 的峰值基准成绩，并非任意提示的平均值，也不是并发请求下的总吞吐。
