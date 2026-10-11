---
publish: true
content_type: "post"
title: "Show HN：Aura——自托管、多用户、带个人图谱记忆的 AI 智能体"
description: "Aura 是一个用 Go 编写的自托管多用户 AI 智能体平台。单个 Go 二进制文件承载运行时、工具、CLI、Telegram 网关和内置的网页驾驶舱（cockpit），Docker Compose 则并行运行配套服务：Postgres、ArcadeDB、Garage 对象存储，以及嵌入、摄取、网页搜索和语音等组件。每个人以各自身份登录，拥有独立的记忆数据库、工作区和沙箱。 模型在驾驶舱设置中选择：默认走 OpenRouter，也可以使用 ChatGPT 订阅、随包提供的本"
date: "2026-10-08T18:50:13.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/chetto1983/Aura"
discussion_url: "https://news.ycombinator.com/item?id=50010250"
tags: ["source/hackernews","topics/agents","topics/products","topics/security-privacy"]
---

## 正文提炼

Aura 是一个用 Go 编写的自托管多用户 AI 智能体平台。单个 Go 二进制文件承载运行时、工具、CLI、Telegram 网关和内置的网页驾驶舱（cockpit），Docker Compose 则并行运行配套服务：Postgres、ArcadeDB、Garage 对象存储，以及嵌入、摄取、网页搜索和语音等组件。每个人以各自身份登录，拥有独立的记忆数据库、工作区和沙箱。

模型在驾驶舱设置中选择：默认走 OpenRouter，也可以使用 ChatGPT 订阅、随包提供的本地 llama.cpp 服务，或 Ollama。作者特别强调，本地存储并不等于离线推理——云端提供商会收到发送给其模型的上下文，只有本地服务才能让推理完全留在主机上；默认不运行任何本地大模型。硬件门槛被描述得不高：默认技术栈在 16 GB 内存迷你主机上开启语音转文字与文字转语音后实测占用约 7 GB（数据标注为 2026-09-02）。

README 中描述的主要机制包括：
- 流式智能体循环，配合共享的步数与时间预算以及重复调用控制来限制工作量。
- 延迟工具与 tool&#95;search：按需发现工具并加载其 schema，包括来自挂载 MCP 服务器的工具。
- 自适应推理路由器：依据配置的分类器和当前模型支持的能力来选择推理强度。
- 图原生记忆：事实、来源和有效期存储于 ArcadeDB，按时间路径检索可返回支撑证据；以 Postgres 为准的会话另有派生的回忆投影和受管上下文压缩。
- 文档检索：带来源哈希与引用的索引段落，并可访问原始文件以做计算和整文件任务。

运行与安全方面的特性包括：完整的主机终端与文件系统工具，带破坏性命令审批门与密钥脱敏；按身份隔离的沙箱（可选启用配置，原生 Linux 上使用 gVisor runsc），成果通过 send&#95;file 经渠道交付而非给出路径；调度与自主唤醒，通过单一任务工具支持 at/every/cron，并具备作业策略与运维控制；多用户登录使用 Authula（密码，可选 TOTP 步骤），配合能力授权、管理员审计视图，以及由服务器强制执行的按身份 ArcadeDB 隔离。渠道涵盖 CLI REPL、支持语音/图片/文档与人在环路（HITL）的 Telegram，以及基于 AG-UI/SSE 的网页驾驶舱，支持回合中干预、审批与实时设置。项目采用 MIT 许可，还附带用于图像与视频生成和编辑的 Studio、PIM、WhatsApp 与 SearXNG 等集成，以及与 Open WebUI、LibreChat 的对比文档。

## HN 热门讨论

根据 3 条选取的评论与回复整理。

在这三条评论的小样本中，一位正在构建类似系统的评论者提问：Aura 究竟如何使用它连接的电子邮箱、日历等信息。作者回答说，项目依赖 MCP，并对其做了分支修改，以支持多租户与安全——同样的回复出现了两次，一次作为顶层评论，一次作为对该提问的回复。该样本没有提供基准测试或独立评估，讨论中也没有异议或进一步追问。

评论来源：[team&#95;mindmesh](https://news.ycombinator.com/item?id=50014145) · [chettto983](https://news.ycombinator.com/item?id=50017299) · [chettto983](https://news.ycombinator.com/item?id=50016164)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50010250>)

## 图片与视频

- [图片: Aura cockpit: the agent stores a birthday in its memory graph and schedules a reminder, then a new chat answers from memory](<https://github.com/chetto1983/Aura/raw/master/public/demo.gif>)
