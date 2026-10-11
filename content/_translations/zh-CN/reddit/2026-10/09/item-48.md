---
publish: true
content_type: "post"
title: "将量化权重暂存为 FP8 而非 FP16：M6 上 2 倍矩阵路径，MLX 预填充提升 40%（M5 上用 int8）"
description: "一个实验性的 MLX 分支改变了量化权重在矩阵乘法前暂存时所使用的数据格式。标准 MLX 量化矩阵乘法会先把操作数反量化到 FP16 再做乘法。如果改为暂存到 FP8，就能在苹果新一代 M6 芯片上使用快 2 倍的 FP8 矩阵路径。 同样的思路可以移植到 M5 系列：在矩阵乘法前把 4 比特仿射权重暂存为 int8，在 M5 和 M6 上都能获得相近的预填充提升。报告的提升幅度大约是 Qwen3-8B 预填充 +40%，Qwen3.8-27B +50%。解码阶段差异不大，因"
date: "2026-10-08T21:31:17.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x13fo2/staging_quantized_weights_to_fp8_instead_of_fp16/"
tags: ["source/reddit","topics/inference","topics/hardware","topics/models"]
---

一个实验性的 MLX 分支改变了量化权重在矩阵乘法前暂存时所使用的数据格式。标准 MLX 量化矩阵乘法会先把操作数反量化到 FP16 再做乘法。如果改为暂存到 FP8，就能在苹果新一代 M6 芯片上使用快 2 倍的 FP8 矩阵路径。

同样的思路可以移植到 M5 系列：在矩阵乘法前把 4 比特仿射权重暂存为 int8，在 M5 和 M6 上都能获得相近的预填充提升。报告的提升幅度大约是 Qwen3-8B 预填充 +40%，Qwen3.8-27B +50%。解码阶段差异不大，因为它受带宽限制，所以作者建议解码侧继续使用默认的 FP16 暂存。

质量经过了测量，最坏情况下困惑度上升不到约 1%。FP8 的性能提升需要 M6 配合 macOS 27 以及 deployment target 27 的构建；int8 在 M5 及以后可用。作者说明这是实验性分支而非上游代码，并提到 mlx&#35;4627，同时披露自己在 Precisit 工作，相关博客与代码由该公司发布。

## 图片与视频

- [图片: Staging quantized weights to FP8 instead of fp16: 2× M6 matrix path, +40% MLX prefill &#40;+ int8 on M5&#41;](<https://preview.redd.it/k2jk5lux6buh1.png?width=640&crop=smart&auto=webp&s=0657ae9e9e71c115237556e554542e2bf2fb30bb>)
