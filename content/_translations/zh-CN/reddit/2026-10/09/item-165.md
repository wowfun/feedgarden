---
publish: true
content_type: "post"
title: "在 4090 上运行未审查版 Qwen3.8-27B（HauhauCS）：262K 上下文、约 130 tok/s"
description: "HauhauCS 仅以 GGUF 形式发布其未审查版 Qwen3.8-27B，而 C++/CUDA 运行时 NInfer 希望使用自己的格式。作者称已将同一模型转换，并在 RTX 4090 上取得了明显优于 llama.cpp 的运行结果。 帖子中的关键数据： - 在 llama.cpp 下，模型以 131K 上下文运行，速度为 91.6 tok/s。 - 转换后可在模型原生的完整 262K 上下文下运行，配 MTP3 解码约 130 tok/s，接受率 70.8%。 - 在"
date: "2026-10-09T05:27:28.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1d0u4/running_the_uncensored_qwen3827b_hauhaucs_on_a/"
tags: ["source/reddit","topics/inference","topics/models","topics/hardware"]
---

HauhauCS 仅以 GGUF 形式发布其未审查版 Qwen3.8-27B，而 C++/CUDA 运行时 NInfer 希望使用自己的格式。作者称已将同一模型转换，并在 RTX 4090 上取得了明显优于 llama.cpp 的运行结果。

帖子中的关键数据：
- 在 llama.cpp 下，模型以 131K 上下文运行，速度为 91.6 tok/s。
- 转换后可在模型原生的完整 262K 上下文下运行，配 MTP3 解码约 130 tok/s，接受率 70.8%。
- 在 9K 提示下预填充速度达 3,591 tok/s。
- 困惑度与官方产物相差在 1.3% 以内，作者据此认为转换是干净的。

转换后视觉与工具调用仍然可用。文中包含一个 E8 4-bit 量化版本，转换器与说明文档通过 ninfer-4090 仓库的一个 pull request 提供，转换后的模型位于 ninfer-uncensored 仓库。作者欢迎提问。需注意这些数据来自作者自测，帖子中并未经过第三方独立验证。

## 图片与视频

- [图片: Running the uncensored Qwen3.8-27B &#40;HauhauCS&#41; on a 4090 at 262K context and &#126;130 tok/s](<https://preview.redd.it/nn8cawenlduh1.png?width=140&height=112&auto=webp&s=c425dff42502643e0c18b35387e829994779f3ee>)
