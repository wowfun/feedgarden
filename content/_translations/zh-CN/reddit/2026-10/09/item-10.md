---
publish: true
content_type: "post"
title: "8 张 Radeon Pro V620 配定制 vLLM 分支，解码达 60-100 t/s"
description: "一位用户用八张 Radeon Pro V620 组了一台约 2,800 美元的机器。这些是较老的 RDNA2 企业级云游戏显卡，单卡 32GB 显存，合计 256GB。作者提醒标题中的价格略有误导，因为现在大概已经买不到每张 350 美元的价格。图中还可见一块 RTX 4090，但仅用于图像与视频生成模型，不跑 LLM。 这些卡最初是一次赌博式尝试，想用较低成本搭建大显存机器。llama.cpp 勉强能用但 prefill 很差（同一模型约 350-450 t/s），并..."
date: "2026-10-08T17:12:46.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0wnz1/2800_rig_with_8x_radeon_pro_v620_256_gb_vram/"
tags: ["source/reddit","topics/inference","topics/models"]
---

一位用户用八张 Radeon Pro V620 组了一台约 2,800 美元的机器。这些是较老的 RDNA2 企业级云游戏显卡，单卡 32GB 显存，合计 256GB。作者提醒标题中的价格略有误导，因为现在大概已经买不到每张 350 美元的价格。图中还可见一块 RTX 4090，但仅用于图像与视频生成模型，不跑 LLM。

这些卡最初是一次赌博式尝试，想用较低成本搭建大显存机器。llama.cpp 勉强能用但 prefill 很差（同一模型约 350-450 t/s），并发能力也糟糕，而 vLLM 在这些卡上完全跑不起来，作者一度准备卖掉它们。后来他让 Claude 写了一个定制 vLLM 分支，反复试验 RDNA2 内核，既解决了兼容性问题，也带来了远超预期的吞吐。

报告结果使用 orcarouter 的未审查版 Qwen3.8-Flash-Next，作者自行量化：路由专家为 W4A16，其余部分保持 BF16；vLLM 以 PP=4 运行、未启用张量并行，并发为 1，启用 MTP 且草稿 3 个 token：

- 解码吞吐 60-100 t/s，关闭 MTP 时为 40-50 t/s。
- prefill 超过 3,000 t/s，而 llama.cpp 下约为 350-450 t/s，作者称提升约 800%。

作者计划继续优化，并验证 DeepSeek 与 GLM-5.3-Flash 是否同样可用。这些均为单机自报的 llama-benchy 测量结果，并非独立评测。

## 媒体

![图片: &#36;2800 rig with 8x Radeon Pro V620 &#40;256 GB VRAM&#41; + custom vLLM fork = Qwen3.8-Flash-Next at 60 to 100 t/s decode and 3000+ t/s prefill](<https://preview.redd.it/wqt70wfzx9uh1.jpeg?width=640&crop=smart&auto=webp&s=b01f54c06793ca6dbd1cc9a3d18c1af0df4b68f8>)

[图片: &#36;2800 rig with 8x Radeon Pro V620 &#40;256 GB VRAM&#41; + custom vLLM fork = Qwen3.8-Flash-Next at 60 to 100 t/s decode and 3000+ t/s prefill](<https://preview.redd.it/wqt70wfzx9uh1.jpeg?width=640&crop=smart&auto=webp&s=b01f54c06793ca6dbd1cc9a3d18c1af0df4b68f8>)
