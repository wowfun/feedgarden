---
publish: true
content_type: "post"
title: "Show HN：Superwhisper S1 mini——语音转文字的文本与语气规整器"
description: "Superwhisper 发布了 s1-mini（v1）的 GGUF 版本，可在 llama.cpp、Ollama、LM Studio 以及其他基于 llama.cpp 的运行时上使用；在遵守许可证的前提下，也可以用在自带的听写应用中。S1-mini 是一个 0.6B 参数、面向语音转文字输出的文本规整模型。 它接收原始 ASR 转写文本，将其改写为干净的书面文本：删除填充词，把口误和自我纠正归并到说话人最终确定的说法，添加标点和大小写，并把口语中的数字、日期、时间、货币和电"
date: "2026-10-08T18:07:33.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://huggingface.co/superwhisper/s1-mini-GGUF"
discussion_url: "https://news.ycombinator.com/item?id=50009562"
tags: ["source/hackernews","topics/models","topics/inference","topics/products"]
---

## 正文提炼

Superwhisper 发布了 s1-mini（v1）的 GGUF 版本，可在 llama.cpp、Ollama、LM Studio 以及其他基于 llama.cpp 的运行时上使用；在遵守许可证的前提下，也可以用在自带的听写应用中。S1-mini 是一个 0.6B 参数、面向语音转文字输出的文本规整模型。

它接收原始 ASR 转写文本，将其改写为干净的书面文本：删除填充词，把口误和自我纠正归并到说话人最终确定的说法，添加标点和大小写，并把口语中的数字、日期、时间、货币和电子邮箱地址转成书面形式。在 Q4&#95;K&#95;M 下，它是 462 MiB 的文件，可以在笔记本 CPU 上流畅运行；在 7,519 条英语留出用例上达到 94.8% 的 token 准确率。该模型仅支持英语，不是聊天模型，也不会遵循通用指令；它只做一件事，靠输入顶部的一行控制行来引导。

- 文件：s1-mini-q4&#95;k&#95;m.gguf（Q4&#95;K&#95;M，462 MB）为推荐版本，也是公布准确率所测的构建；s1-mini-f16.gguf（F16，1.4 GB）是未量化的中间版本，Q4&#95;K&#95;M 由其生成。
- 两者骨架相同：架构为 qwen3，311 个张量，28 个 block，40,960 token 上下文窗口，并内置聊天模板。Q4&#95;K&#95;M 将对量化最敏感的张量保留为 Q6&#95;K（311 个中的 29 个），其余大部分为 Q4&#95;K，两个版本的归一化参数均为 F32。

关于参数量：Hub 侧栏对该仓库显示 0.8B 参数。Qwen3-0.6B 设置了 tie&#95;word&#95;embeddings，但把 lm&#95;head.weight 作为输入嵌入的实体副本提供，因此这个 1.556 亿参数的嵌入被计了两次，张量元素为 7.516 亿，而唯一参数为 5.960 亿。两个构建都原样沿用该结构，Qwen/Qwen3-0.6B 在 Hub 上显示 0.8B 也是同样原因。0.6B 指的是唯一参数。

每个请求都必须严格按照示例提供系统提示词和控制行，否则模型可能产生幻觉或输出乱码。控制行包含三个相互独立、且所有组合都经过训练的维度：Styling（casual、semi-casual、semi-formal、formal）设定语体，决定大小写、撇号和缩写的清理程度；Structure（prose、lists）允许模型把可枚举内容拆成项目符号列表，但至少要有三项，不是真正列表的内容仍保持散文形式；Context（general、email）选择目标场景惯例，email 会启用问候语行和落款块的版式。省略系统提示词或控制行，或传入训练集之外的取值，均不受支持。仅含填充词或噪声的输入会正确返回空字符串，因此空结果应视为有效，而非失败。

## 图片与视频

- [图片: S1-mini banner](<https://huggingface.co/superwhisper/s1-mini-GGUF/resolve/main/banner.jpg>)
