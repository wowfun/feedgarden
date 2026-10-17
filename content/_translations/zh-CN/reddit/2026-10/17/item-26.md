---
publish: true
content_type: "post"
title: "用 Qwen 3.6 27B 在本地能做的十件事"
description: "尽管大家都在关注 Qwen 3.8，这位发帖者仍在本地用 llama.cpp 继续打磨 Qwen 3.6 27B，并且不喜欢 3.8 的说话方式。作者从 5 月底开始，已经学习了四个多月，面向新手给出十个实用项目；所给摘录只涵盖前七项。 建议包括：自己做小型应用，例如带文字处理、侧边栏和明暗模式的记事本替代品；做一个自定义聊天前端，也可以照搬 Claude 等现成设计；构建 ReAct 循环，让模型调用工具、读取结果后再次调用；生成自己的 MCP 工具，避免使用可能不安..."
date: "2026-10-16T21:35:36.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:47:52.494Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x7sq8e/10_things_you_maybe_didnt_know_you_can_do_with/"
tags: ["source/reddit","topics/coding","topics/agents","topics/open-source"]
---

尽管大家都在关注 Qwen 3.8，这位发帖者仍在本地用 llama.cpp 继续打磨 Qwen 3.6 27B，并且不喜欢 3.8 的说话方式。作者从 5 月底开始，已经学习了四个多月，面向新手给出十个实用项目；所给摘录只涵盖前七项。

建议包括：自己做小型应用，例如带文字处理、侧边栏和明暗模式的记事本替代品；做一个自定义聊天前端，也可以照搬 Claude 等现成设计；构建 ReAct 循环，让模型调用工具、读取结果后再次调用；生成自己的 MCP 工具，避免使用可能不安全的第三方工具。模型还能写一个 Python 子智能体生成器，或按需创建子智能体的 MCP 工具。由于 MCP 工具很占上下文，作者建议把工作交给拥有独立上下文窗口的子智能体，从而成倍扩展主智能体的上下文；若要跨轮保留状态，则需要流水线运行器。

流水线运行器类似 n8n，可以让模型来搭建，前端可以自制或照抄。若要让多个顺序执行的智能体各自拥有上下文，需要开启 llama.cpp 的 cache-idle-slots，它会在每轮交换 KV 缓存，并把上一个缓存移到 CPU 内存。最后，模型启动器可在 llama.cpp 中选择不同模型和 Jinja 模板、设置参数，并保存别名供下次启动使用。

## 媒体

![图片: 10 Things you maybe didn't know you can do with Qwen 3.6 27B right now. &#40;For Noobs&#41;](<https://preview.redd.it/xi91phrjwvvh1.png?width=140&height=117&auto=webp&s=e2bd9402e0e0ac1085dac3d6959844c8e153141c>)

[图片: 10 Things you maybe didn't know you can do with Qwen 3.6 27B right now. &#40;For Noobs&#41;](<https://preview.redd.it/xi91phrjwvvh1.png?width=140&height=117&auto=webp&s=e2bd9402e0e0ac1085dac3d6959844c8e153141c>)
