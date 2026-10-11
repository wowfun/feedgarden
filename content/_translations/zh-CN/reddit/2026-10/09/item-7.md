---
publish: true
content_type: "post"
title: "在同一块 RTX 4090 上对比四款开源决策模型"
description: "一位用户在租用的同一块 RTX 4090（驱动 580.119.02，32 vCPU）上评测了近期发布的四款开源“决策”模型，使用 llama.cpp b11495 构建（commit 37ac63456，CUDA 12.8），参数为 -ngl 99，其余保持默认。任务是逐词读取九篇关于蜈蚣的维基百科文章（9,534 词），标记出每个指称蜈蚣的词；每个词发起一次 /v1/systemone 调用，拿到答案后立刻发送下一个词。延迟由同一台机器上的 Python 客户端经 loc"
date: "2026-10-08T17:04:32.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0wg85/running_decision_model_locally_on_an_rtx_4090_to/"
tags: ["source/reddit","topics/evaluation","topics/inference","topics/models"]
---

一位用户在租用的同一块 RTX 4090（驱动 580.119.02，32 vCPU）上评测了近期发布的四款开源“决策”模型，使用 llama.cpp b11495 构建（commit 37ac63456，CUDA 12.8），参数为 -ngl 99，其余保持默认。任务是逐词读取九篇关于蜈蚣的维基百科文章（9,534 词），标记出每个指称蜈蚣的词；每个词发起一次 /v1/systemone 调用，拿到答案后立刻发送下一个词。延迟由同一台机器上的 Python 客户端经 localhost 端到端测量。

报告结果（单词 p50 延迟、32 秒内处理词数、准确率、命中蜈蚣名称比例、误判数）：

- Laya（Laya-BF16.gguf，llama.cpp）：3.9 毫秒，7,980 词，准确率 97.4%，命中 70%，误判 98 次。
- d1 3B（d1-3B-AD-Q4&#95;K&#95;M.gguf，llama.cpp）：6.0 毫秒，5,306 词，96.5%，命中 51%，误判 51 次。
- Clef-Flash 9B（Clef-Flash-Q8&#95;0.gguf，llama.cpp）：24.4 毫秒，1,292 词，97.2%，命中 36%，误判 2 次。
- Lev 4B（interfaze-ai/lev bf16，自有 lev serve + PyTorch）：51.0 毫秒，626 词，98.9%，命中 83%，误判 4 次。

作者提醒，准确率存在虚高：回答“否”也算正确，而指称蜈蚣的词本就稀少，因此任务相关的命中率更能反映能力。Lev 命中最多，但比 Laya 慢约 13 倍，部分原因是它跑在自有的 PyTorch 服务器上而非 llama.cpp；作者在另一块 4090 上测得 68 毫秒，说明它对 CPU 也敏感。模型规模被指出是重要但非唯一的因素。作者最终推荐 Laya，理由是速度快、易于针对特定用途微调，不过该结论仅基于一项任务和一套硬件配置。

## 图片与视频

- [图片: Running decision model locally on an RTX 4090 to find out which one is the fastest](<https://external-preview.redd.it/M2F5N2Q4NHl5OXVoMfURPj1VUjR_LLxIDVHzPfgGD8G3mPOdqioS8x-hwSV8.png?width=640&crop=smart&auto=webp&s=71d097399779e063f49dc47fa3afab062b3fa375>)
