---
publish: true
content_type: "post"
title: "Telperion 发布潜在注意力版 Qwen3.8-27B，KV 缓存缩小 4 倍"
description: "Telperion 宣布推出 Qwen3.8-27B 的两个潜在注意力（latent attention）变体：MLA（多头潜在注意力）与 GLA-g2，后者是采用两个分组的「分组潜在」版本。两者都以 4 倍 KV 缓存压缩为目标，官方称这相当于在消费级硬件上把最大上下文提升约 4 倍，或在服务器硬件上把并发量提升近 4 倍。 在 SWE-bench Verified（zero-shot、无工具、n > 1500）上的结果：MLA 变体得分 42.1%，基础版 Qwen..."
date: "2026-10-14T16:47:46.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:03:08.362Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x5wcnz/new_model_from_telperion_qwen3827bmla/"
tags: ["source/reddit","topics/models","topics/inference","topics/research"]
---

Telperion 宣布推出 Qwen3.8-27B 的两个潜在注意力（latent attention）变体：MLA（多头潜在注意力）与 GLA-g2，后者是采用两个分组的「分组潜在」版本。两者都以 4 倍 KV 缓存压缩为目标，官方称这相当于在消费级硬件上把最大上下文提升约 4 倍，或在服务器硬件上把并发量提升近 4 倍。

在 SWE-bench Verified（zero-shot、无工具、n &gt; 1500）上的结果：MLA 变体得分 42.1%，基础版 Qwen3.8-27B 为 39.5%，GLA-g2 为 39.4%。Telperion 称 MLA 的提升在统计上可区分，为 +6.58%。平均输出 token 有所下降：MLA 为基线的 0.88 倍，GLA-g2 为 0.86 倍，官方表述为最多减少 20% 的推理 token。KV 压缩倍数分别为：MLA 在 TP=1 时 4.00 倍、TP=2 时 2.28 倍；GLA-g2 在 TP=1 与 TP=2 时均为 4.00 倍。之所以做分组设计，是因为在多 GPU 设备上部署 MLA 存在显存方面的劣势。

团队还发布了训练后量化版本，并给出显存占用与 top-1 不一致率（越低越好）：BF16 为 55.7GB（显存统计包含 MTP 头与视觉编码器），FP8 为 31.5GB、不一致率 0.06%，INT4 为 22.9GB、0.17%，EXL3-4.0bwp 为 17.2GB、0.46%。Telperion 表示其量化版本在保真度上超过同等体量的 .gguf 量化。

官方提供了便于安装的 vLLM 插件，并已在 RTX PRO 6000、H100 以及 2 张 RTX 5060Ti 16GB 上验证。Telperion 表示该方法无需重新训练，并兼容几乎所有使用分组查询注意力（GQA）或类似变体的模型，且将很快开源该方法。官方还计划在获得更多算力后推出带完整基准测试的 version 2，并在 Qwen4-27B 发布后制作其稀疏潜在注意力变体。

需要注意：以上数据均来自开发方自己的公告与基准表格，并未报告独立的第三方复现结果。
