---
publish: true
content_type: "post"
title: "Strata、llama.cpp 与自家 runner 的对比测试：缺失的一环是 MTP 头"
description: "一位在同一模型上比较各推理运行时的用户得出结论：MTP（多 token 预测）头是 Strata 速度优势的部分来源——他认为这一点对别人或许显而易见，自己却忽略了。 为进行公平对比，他为 Strata 所使用的 ISTA-DASLab GGUF 制作了 MTP 头。在此过程中，他也为自己的一份额外量化制作了头，并称 llama.cpp 因此获得了大幅速度提升。相关产物发布为 Joakimpalm-Zen/Qwen3.8-27B-GSQ-RCO-IQ3_S-recovered"
date: "2026-10-08T19:21:00.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x102lo/i_was_doing_some_testing_on_strata_vs_llama_vs/"
tags: ["source/reddit","topics/inference","topics/models","topics/evaluation"]
---

一位在同一模型上比较各推理运行时的用户得出结论：MTP（多 token 预测）头是 Strata 速度优势的部分来源——他认为这一点对别人或许显而易见，自己却忽略了。

为进行公平对比，他为 Strata 所使用的 ISTA-DASLab GGUF 制作了 MTP 头。在此过程中，他也为自己的一份额外量化制作了头，并称 llama.cpp 因此获得了大幅速度提升。相关产物发布为 Joakimpalm-Zen/Qwen3.8-27B-GSQ-RCO-IQ3&#95;S-recovered-GGUF。

他还处理了更大的 ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-GGUF，其 MTP 头发布在 Joakimpalm-Zen/Qwen3.8-Flash-Next-MTP-GGUF。使用该头后，llama.cpp 有一定改善，但据他表示 Strata 整体仍然快得多。

他指出自己的 runner 仍需架构层面的改进，并称这次对比属于非正式的进行中工作，把这些头文件分享出来供他人使用。帖中未给出绝对吞吐量数字，也未区分 Strata 的领先有多少来自 MTP 头、多少来自其他运行时因素。

## 图片与视频

- [图片: I was doing some testing on Strata. vs llama vs. runner and was missing something](<https://external-preview.redd.it/2JSAVBQaRmK73TWaNAeqZNmHfOq8wHZTFYyM2kuW9U0.png?width=140&height=75&auto=webp&s=96969ae7399b9baaddc41ac3452d3c70068ff358>)
