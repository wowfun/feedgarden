---
publish: true
content_type: "post"
title: "求助：EXL2/EXL3 模型在 SillyTavern 中输出乱码"
description: "一位拥有 RTX 4060 和 16GB 内存的用户尝试在 SillyTavern 中运行 EXL2/EXL3 格式的模型，此前一直使用 GGUF，想看看 EXL2/3 是否比 Q4 量化在设定连贯性上更好。他用 TabbyAPI 作为 API 提供方，并询问是否有更适合 EXL2/3 的选择。 在使用从 Hugging Face 仓库（Nitral-AI/Violet_Magcap-12B）导入的 ChatML 预设，并对温度等参数做过多种调整后，输出仍是乱码。用户表示有时"
date: "2026-10-08T18:18:13.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0ye23/help_with_exl23_pls/"
tags: ["source/reddit","topics/inference","topics/models"]
---

一位拥有 RTX 4060 和 16GB 内存的用户尝试在 SillyTavern 中运行 EXL2/EXL3 格式的模型，此前一直使用 GGUF，想看看 EXL2/3 是否比 Q4 量化在设定连贯性上更好。他用 TabbyAPI 作为 API 提供方，并询问是否有更适合 EXL2/3 的选择。

在使用从 Hugging Face 仓库（Nitral-AI/Violet&#95;Magcap-12B）导入的 ChatML 预设，并对温度等参数做过多种调整后，输出仍是乱码。用户表示有时能勉强工作，但仍有语法错误和词语被截断的情况，有时还会陷入循环、不输出停止符；多数情况下是词沙拉。帖中截图展示了默认机器人对“Hello”的回复。

除模板链接外，帖子没有给出任何设置细节、日志输出或测量数据，因此仅凭现有材料无法确定故障原因。

## 图片与视频

- [图片: Help with EXL2/3 pls](<https://preview.redd.it/k6q7nbylcauh1.jpg?width=140&height=136&auto=webp&s=c389c766108455eaf6425a83ce5959b93b9842c7>)
