---
publish: true
content_type: "post"
title: "这里有人自己做过 harness 吗？想请大家给我的作品提点反馈"
description: "作者花了大约六个月构建并调试一个名为 MercuryCLI 的编程智能体 harness，在三台机器上每天测试。他如今把它专门用于开发工作，包括已部署的产品，并已公开源码。它用原生 TypeScript 编写，可在 macOS、Linux 以及 Windows PowerShell / Windows Terminal 上运行，均已充分测试。 他描述的功能： - 可以接入任何本地模型，并把 Opus、GPT Sol、Fable 或任意 OpenRouter 线路的模型作为该本"
date: "2026-10-09T02:28:12.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x19qfb/anyone_here_built_their_own_harness_looking_for/"
tags: ["source/reddit","topics/agents","topics/coding","topics/products"]
---

作者花了大约六个月构建并调试一个名为 MercuryCLI 的编程智能体 harness，在三台机器上每天测试。他如今把它专门用于开发工作，包括已部署的产品，并已公开源码。它用原生 TypeScript 编写，可在 macOS、Linux 以及 Windows PowerShell / Windows Terminal 上运行，均已充分测试。

他描述的功能：
- 可以接入任何本地模型，并把 Opus、GPT Sol、Fable 或任意 OpenRouter 线路的模型作为该本地模型的顾问。
- 支持启动混合的“队友”智能体，并在同一个终端窗口中管理位于不同仓库的多个并发会话。
- 如果某个会话达到用量上限，可以用 /model 切换到 Astra 或 GLM 5.3 等其他模型，因此该工具并不只是为了把 token 用满。

在效率数据方面，他说在智能体集群的帮助下，一名开发者五周内发布了 29 个版本、约 7,500 次提交，另有朋友测试每个版本；相比之下，此前用 Codex、Claude Code、OpenCode 及多种其他工具进行五个月私下开发，大约完成了 7,000 次提交。他邀请有经验的用户在小项目上试用、查看代码或在容器中运行，并给出反馈与批评。

## 图片与视频

- [图片: anyone here built their own harness? looking for some feedback on mine](<https://preview.redd.it/z4kxpwpsqcuh1.png?width=140&height=75&auto=webp&s=bdd597a1d5775ef85e196843ab6f3c7b4b3eb5b9>)
