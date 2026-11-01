---
publish: true
content_type: "post"
title: "Prospero：面向更文明时代的新型编程工具链"
description: "Prospero 是一款新发布的编程工具链（coding harness），作者因现有工具链资源浪费而自研：多数基于 Web 技术栈、占用数 GB 内存，而工具链核心只是“curl 加 popen()”。Prospero 用 C++ 编写，采用 Dear ImGui 停靠式界面，号称在不牺牲功能的前提下资源占用比其他工具链低约两个数量级，并支持深色模式。Prospero 不内置任何模型提供商；用户需自行提供，如 llama.cpp、企业内网模型、OpenRouter 或..."
date: "2026-10-31T11:54:59.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://nullprogram.com/blog/2026/10/31/"
discussion_url: "https://news.ycombinator.com/item?id=50315226"
tags: ["source/hackernews","topics/coding","topics/agents"]
---

## 正文提炼

Prospero 是一款新发布的编程工具链（coding harness），作者因现有工具链资源浪费而自研：多数基于 Web 技术栈、占用数 GB 内存，而工具链核心只是“curl 加 popen&#40;&#41;”。Prospero 用 C++ 编写，采用 Dear ImGui 停靠式界面，号称在不牺牲功能的前提下资源占用比其他工具链低约两个数量级，并支持深色模式。Prospero 不内置任何模型提供商；用户需自行提供，如 llama.cpp、企业内网模型、OpenRouter 或 Anthropic/OpenAI API（不支持 Claude 订阅）。它支持标准的智能体循环：工具调用、文件读写、运行 shell 命令，以及可并行工作或保持上下文干净的子智能体，并支持智能体间消息协调。通过 SSH 或 WSL，可将无头副本部署到其他主机运行。Professional Edition 内嵌 x86/x86-64 与 ARM64 引擎，覆盖 macOS、Windows 与 Linux，其中 Windows x86 引擎甚至可在 Windows XP 上运行。显著能力包括桌面控制：支持视觉的模型可“看到”并操作 GUI（点击、输入、拖拽），实时测试调试应用，无需针对每个应用的 MCP 辅助。引擎轻量且与 GUI 分离，可完全独立无头运行并稍后重新连接，也可能适合驱动模糊测试（fuzz）任务而不被 Linux OOM killer 杀死。配置位于 &#126;/.config/prospero/prospero.ini，支持 GUI 设置页与 URL 引用（URL 引用对可设置项有限制）。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论者提出多方面观点。brainless（及回复者 julesrms）希望 GUI 工具链具备更丰富体验——可点击文本、异步回答多问题、选择性编排子智能体——julesrms 还分享了自己的 GUI 工具链 juggler。julesrms 作为 C++ 老兵质疑用 C++ 做智能体 GUI，认为 Web 技术栈更擅长处理 Markdown、HTML 与文本流；nico 追问这些能力能否移植到 C/C++。nico 还抱怨 CLI 智能体常以 Y/N 提示打断输入。bensyverson 感叹补贴的 Claude 订阅让用户绑定特定工具链。keyle 指出许多开发者如今自建工具链，称自己的仅占 opencode 约 4% 的资源。

评论来源：[brainless](https://news.ycombinator.com/item?id=50316615) · [julesrms](https://news.ycombinator.com/item?id=50316687) · [julesrms](https://news.ycombinator.com/item?id=50316753) · [nico](https://news.ycombinator.com/item?id=50318156) · [bensyverson](https://news.ycombinator.com/item?id=50316357) · [keyle](https://news.ycombinator.com/item?id=50316750)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50315226>)

## 媒体

![图片](<https://nullprogram.com/img/prospero/screenshot.png>)

[图片](<https://nullprogram.com/img/prospero/screenshot.png>)

![图片](<https://nullprogram.com/img/prospero/screenshot-dark.png>)

[图片](<https://nullprogram.com/img/prospero/screenshot-dark.png>)
