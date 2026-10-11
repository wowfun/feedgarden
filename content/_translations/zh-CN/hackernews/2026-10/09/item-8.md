---
publish: true
content_type: "post"
title: "Whistle：16.9 MB 的语音转文字模型"
description: "Whistle 是 Needle 团队发布的开源语音识别模型，面向手机、可穿戴设备、机器人、智能家居、汽车和微控制器。它是单个 16.9 MB 的文件，直接在 CPU 上运行且无依赖，可加载进与 Needle 相同的 C++ 引擎、同一容器和同一量化配置，因此一个二进制文件就能把一段音频直接转成工具调用。它支持英语、德语、法语、西班牙语、意大利语、荷兰语和波兰语，未指定时自动检测语言，首个 token 延迟为 11 毫秒。 Whistle 在设备端完成三项任务：转录 16 k"
date: "2026-10-08T16:59:39.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://cactuscompute.com/blog/whistle"
discussion_url: "https://news.ycombinator.com/item?id=50008427"
tags: ["source/hackernews","topics/models","topics/inference","topics/products"]
---

## 正文提炼

Whistle 是 Needle 团队发布的开源语音识别模型，面向手机、可穿戴设备、机器人、智能家居、汽车和微控制器。它是单个 16.9 MB 的文件，直接在 CPU 上运行且无依赖，可加载进与 Needle 相同的 C++ 引擎、同一容器和同一量化配置，因此一个二进制文件就能把一段音频直接转成工具调用。它支持英语、德语、法语、西班牙语、意大利语、荷兰语和波兰语，未指定时自动检测语言，首个 token 延迟为 11 毫秒。

Whistle 在设备端完成三项任务：转录 16 kHz 单声道音频，一次最多 30 秒；输出每个词的开始、结束时间与概率，时间对齐来自解码器自身的注意力；以及语音嵌入，直接取编码器输出、每 80 毫秒一行，无需解码出文本。在浏览器沙箱中，首次按下麦克风才下载模型，音频不会离开设备。

文章详细说明了处理管线。音频按 25 毫秒窗、10 毫秒步长切成 80 维 log-mel，频带限制在 250–3500 Hz；30 秒对应 3,000 帧。128 通道、kernel 9 的卷积 stem 将帧数减半三次，得到 375 帧、每帧 80 毫秒；其后所有阶段都在这一帧率上运行。编码器使用八个 Simple Attention 模块，包含四条 mHC 残差通道，并用 Monarch Hadamard MLP 替代前馈网络；其注意力是非因果的，第 3 秒的帧可以注意到第 12 秒的帧。

解码器使用八个宽度 512 的 Laddered Simple Attention 模块，8 个查询头对 2 个 KV 头，查询和键为 48 维、值为 64 维，在 Q、K、V 上做 3-tap 因果卷积，并在第 3 层和第 7 层使用 18,432 个槽位的 engram 查表。语音专属的改动是每层增加一个门控交叉注意力，K 和 V 每段音频只需投影一次，因此五路 beam 只需五份简短的文本缓存，而不必对音频做五次遍历。解码采用五路 beam，按长度归一化对数概率打分，关键词偏置通过 Aho-Corasick 自动机实现，转录上限 320 个 token，词表为 8,192 个文本片段加 7 个语言 token。--audio-depth 参数用于选择解码器层数，而编码器始终运行全部八层。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论者更多从实用性和准确率、而非文件大小来评价 Whistle。一位用户用本地语音工具接管了 Echo Show：与在 RTX 5080 上运行 Qwen ASR 1.7B 相比，Whistle 在 170 条消息中只正确识别 70 条，而 Qwen 正确 168 条；他的解决办法是不做自由转录，而把 Whistle 限定在一组预训练的固定模板上。有回复将其类比为 CMU 的 Sphinx4 及其语法约束思路，并追问这种模板或语法引导是否正在回归。

准确率也受到直接批评。一位评论者测试了《义海雄风》结尾的"You can't handle the truth"独白，得到的却是"can handle"以及原文中不存在的词，并警告不要用它做忠实转录。另一位表示即便使用播客级麦克风错误率仍很高，将其与二十年前的 Dragon 相比，并认为模型需要预测上下文来弥补发音不准。

多位评论者认为体积不是主要障碍。一位需要为 84 岁中风后表达困难的父亲做听写，但有回复认为他需要的是听写专用模型，能忽略语气词并处理自我更正。其他人则提出演示缺少流式输出，以及流式方案如何处理纠错尚不明确。

评论来源：[skolos](https://news.ycombinator.com/item?id=50011633) · [bambax](https://news.ycombinator.com/item?id=50017722) · [INTPenis](https://news.ycombinator.com/item?id=50008908) · [ComputerGuru](https://news.ycombinator.com/item?id=50009019) · [albert&#95;e](https://news.ycombinator.com/item?id=50009740) · [hn&#95;submit](https://news.ycombinator.com/item?id=50020397)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50008427>)
