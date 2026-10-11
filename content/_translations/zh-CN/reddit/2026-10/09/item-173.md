---
publish: true
content_type: "post"
title: "发布：Qwen-2B-RCOL 动态低位量化（IQ1_M、IQ2_M、IQ3_M）"
description: "作者发布了一种偏研究性质的量化方法及可用模型，称其与其说是新模型，不如说是一种“伪新”的量化技术。它改进了 ISTALab 的 RCO 算法，可在严格的显存预算下量化模型；其核心是一种近似算法，通过若干不同策略尽量弥补差距。 作者报告在 1 bit 与 2 bit 区间取得了明显的 KLD 改善，并表示该方法应当与模型无关，且不需要把 FP16 teacher 加载进显存。方法细节写在模型卡中，完整配方也计划公布。下一步将把该方法应用到该系列中更大的模型上。 在评测方面，新量"
date: "2026-10-09T06:14:39.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1dt7q/release_qwen2brcol_dynamic_lowbit_quantization/"
tags: ["source/reddit","topics/research","topics/models","topics/evaluation"]
---

作者发布了一种偏研究性质的量化方法及可用模型，称其与其说是新模型，不如说是一种“伪新”的量化技术。它改进了 ISTALab 的 RCO 算法，可在严格的显存预算下量化模型；其核心是一种近似算法，通过若干不同策略尽量弥补差距。

作者报告在 1 bit 与 2 bit 区间取得了明显的 KLD 改善，并表示该方法应当与模型无关，且不需要把 FP16 teacher 加载进显存。方法细节写在模型卡中，完整配方也计划公布。下一步将把该方法应用到该系列中更大的模型上。

在评测方面，新量化版本与标准 llama.cpp imatrix 量化都在同一份 wikitext imatrix 数据集上校准，并在两个留出集上测试。由于 Unsloth 的 KL 散度表不可用，作者自行制作了对比表，结果显示在极低 BPW 下，动态量化明显优于标准 imatrix 的 KLD，尤其是以接近的体积大幅降低了 IQ1&#95;M 的散度。作者称这些属于概念验证性质的量化，因为 2B 模型较小，在如此低的 BPW 下本就吃亏；同一样例中，标准 imatrix 的 IQ1&#95;M 版本表现要差得多。GGUF 文件已在 Hugging Face 发布。

## 图片与视频

- [图片: Release: Qwen-2B-RCOL Dynamic Low-Bit Quantization &#40;IQ1&#95;M, IQ2&#95;M, IQ3&#95;M&#41;](<https://external-preview.redd.it/X6qeMmM77SD1SweowOh1F3dnm1dF95WhwiHpvkoDmEw.png?width=140&height=75&auto=webp&s=ed6bbc74b20d9c45055695e0ce431724f3810de0>)
