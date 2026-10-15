---
publish: true
content_type: "post"
title: "Qwen3.8-27B：R9700 上 159 tok/s，Strix Halo 上 64 tok/s"
description: "LemonSeed Studio 被描述为一款 iPad 上的编辑器／IDE，可在雷雳外接盒中的 AMD GPU 上做端侧推理。它把未经修改的上游 Linux amdgpu 与 amdkfd 驱动（mac_linuxgpu）作为 PCIDriverKit 扩展嵌入，并在 GPU 上运行 LemonSeed Engine（LSE）。演示配置为 iPad Pro 搭配 Sapphire Radeon AI PRO R9700，运行 Qwen3.8-27B Q4，配 Q8 D..."
date: "2026-10-09T01:20:39.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x18e95/qwen3827b_159_toks_on_r9700_64_toks_on_strix_halo/"
tags: ["source/reddit","topics/inference","topics/hardware","topics/models"]
---

LemonSeed Studio 被描述为一款 iPad 上的编辑器／IDE，可在雷雳外接盒中的 AMD GPU 上做端侧推理。它把未经修改的上游 Linux amdgpu 与 amdkfd 驱动（mac&#95;linuxgpu）作为 PCIDriverKit 扩展嵌入，并在 GPU 上运行 LemonSeed Engine（LSE）。演示配置为 iPad Pro 搭配 Sapphire Radeon AI PRO R9700，运行 Qwen3.8-27B Q4，配 Q8 DFlash2 草稿模型，上下文 131k。

LSE 在 Linux、macOS 和 iPadOS 上是同一个引擎：它把模型前向过程记录成图，融合算子，并为所运行的 GPU 生成 kernel；当某个 kernel 有多种布局时，会在设备上逐一测量并保留最快的。投机解码（MTP 与 DFlash2）根据实测的接受率和成本决定要验证多少个草稿 token。

Qwen3.8-27B Q4 在代码提示下的解码吞吐（基线 / MTP=3 / DFlash2，单位 tok/s）：
- iPadOS 上的 R9700：31.2 / 108.7 / 158.5
- macOS 上的 R9700：32.2 / 111.9 / 159.4
- Linux 上的 R9700：32.0 / 111.0 / 144.6
- Linux 上的 Strix Halo（Radeon 8060S）：14.0 / 47.8 / 64.4

4K token 的预填充报告为 1,636（iPadOS）、1,634（macOS）、1,418（Linux R9700）和 517（Strix Halo），在 32K 时仍分别为 1,395 / 1,401 / 1,226 / 462。0.5.8 版本默认开启 DFlash2 草稿树，当实测比链式更快时，用一次目标模型前向验证一棵草稿候选树；为 Strix Halo（gfx1151）加入预填充与解码支持，使用融合的 gate/up GEMM，并在预填充注意力中每个工作组处理两个 query tile；修复了启动时的 GPU 故障；Linux 发行包自带 HSA 运行时，因此只需具备 /dev/kfd 访问权限的 amdgpu 驱动；并新增命令，可从 Hugging Face 拉取模型及其 MTP 或 DFlash2 配套文件。项目还提供 OpenAI 兼容服务器、CLI 和 C 库（libLSE）。

## 媒体

![图片: Qwen3.8-27B: 159 tok/s on R9700, 64 tok/s on Strix Halo](<https://preview.redd.it/3pwkx9zjfcuh1.jpg?width=140&height=105&auto=webp&s=735c30ecfe38936d741d0093faa434aa9413d83d>)

[图片: Qwen3.8-27B: 159 tok/s on R9700, 64 tok/s on Strix Halo](<https://preview.redd.it/3pwkx9zjfcuh1.jpg?width=140&height=105&auto=webp&s=735c30ecfe38936d741d0093faa434aa9413d83d>)
