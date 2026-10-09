---
publish: true
content_type: "post"
title: "纯文本 Qwen3.5 2B、4B、9B MLX 4-bit 包，含 abliterated 变体"
description: "一位用户发布了适用于 Apple Silicon 本地推理的纯文本 Qwen3.5 MLX 4-bit 包，并表示在其他地方找不到相同配置和尺寸的版本。共六个包：2B、4B 和 9B，每个尺寸都包含原版 Qwen 版本与对应的 Huihui abliterated 版本。 这些模型为纯文本（移除了视觉能力）并采用 4-bit 量化，因此体积很小——2B 版本仅 1GB。作者称这适合常驻后台、资源占用很低的场景，并表示已在自己开发的写作软件 Minstrel 中用于摘要和上下文"
date: "2026-10-08T21:09:07.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x12vox/i_put_together_some_textonly_qwen35_2b_4b_and_9b/"
tags: ["source/reddit","topics/models","topics/inference","topics/coding"]
---

一位用户发布了适用于 Apple Silicon 本地推理的纯文本 Qwen3.5 MLX 4-bit 包，并表示在其他地方找不到相同配置和尺寸的版本。共六个包：2B、4B 和 9B，每个尺寸都包含原版 Qwen 版本与对应的 Huihui abliterated 版本。

这些模型为纯文本（移除了视觉能力）并采用 4-bit 量化，因此体积很小——2B 版本仅 1GB。作者称这适合常驻后台、资源占用很低的场景，并表示已在自己开发的写作软件 Minstrel 中用于摘要和上下文判断。

作者把功劳归于 Qwen、Huihui 以及各模型卡中链接的社区转换作者，并说明自己的贡献主要是纯文本打包与 MLX 转换。Huihui 4B 的 GGUF 原始版本本就是纯文本，因此只需转换。帖中未提供任何基准结果、准确率或速度数据，模型免费供所有人使用。
