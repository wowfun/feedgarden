---
publish: true
content_type: "post"
title: "装机者详解基于 Epyc 的推理主机升级：72GB 显存"
description: "在早前发帖求助后，一位 Reddit 用户已下单采购基于 Epyc 的本地推理系统配件，并列出了此次升级预期带来的变化。订单包括 Epyc 7443 CPU（24 核 48 线程、128 条通道）、H12SSL-NT-B 主板（带两个 10Gb 网口的版本），以及 256GB 2666MHz 2Rx4 内存。 四块 GPU 将提供合计 72GB 显存：一块 RTX 3090（24GB）、一块 RTX 5070 Ti（16GB），以及两块 RTX 5060 Ti（各 16GB）"
date: "2026-10-09T13:27:55.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1ld3q/epyc_inference_rigs/"
tags: ["source/reddit","topics/hardware","topics/inference"]
---

在早前发帖求助后，一位 Reddit 用户已下单采购基于 Epyc 的本地推理系统配件，并列出了此次升级预期带来的变化。订单包括 Epyc 7443 CPU（24 核 48 线程、128 条通道）、H12SSL-NT-B 主板（带两个 10Gb 网口的版本），以及 256GB 2666MHz 2Rx4 内存。

四块 GPU 将提供合计 72GB 显存：一块 RTX 3090（24GB）、一块 RTX 5070 Ti（16GB），以及两块 RTX 5060 Ti（各 16GB）。

预期收益包括：
- 四块 GPU 的 PCIe 带宽大致翻倍——5060 Ti 从 x4 提升到 x8，另外两块从 x8 提升到 x16——而且它们都将走真正的 CPU 通道，而不再依赖芯片组通道和临时拼凑的 M.2 转接。
- 内存带宽至少提升 50%，从理论 96GB/s 提高到 170GB/s，实际约为 140GB/s。
- 总内存增加 192GB，从 64GB 提升至 256GB，并且平台为日后加装更多 GPU 留出了空间。

这位装机者预计对稠密模型影响不大，但希望凭借更高的链路带宽在提示词处理上获得可观提升；他对总计 328GB 的内存池感到兴奋，因为这样可以跑 GLM5.3-flash 以及 Qwen3.8-flash-next 的更大量化版本。主板需要等两周。他询问是否有人做过类似配置，以及这类系统如何处理能完整放进内存与显存的大型 MoE 模型。
