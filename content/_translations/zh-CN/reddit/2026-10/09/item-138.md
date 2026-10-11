---
publish: true
content_type: "post"
title: "Philosopher Skill：用简单易读的界面学习几乎任何领域"
description: "一位开发者发布了 \"Philosopher Skill\"，这是一个开源的 Claude 技能，能把 LLM 的回答转成一个自包含的 HTML 阅读指南。它用 Claude Code 构建，按 Claude 技能的形式工作；作者称其免费、开源，无需账号。 该技能遵循 OKF（开放知识格式），打包了一个八步工作流、一个领域分类器、一个页面模板和十二个学习领域。只有当问题需要时才会读取对应文件，作者称这样可以让运行成本保持较低。深度由措辞控制：\"quick\" 生成短页面，普通提问生"
date: "2026-10-09T03:24:41.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1atss/philosopher_skill_learn_about_almost_any_domain/"
tags: ["source/reddit","topics/agents","topics/coding","topics/products"]
---

一位开发者发布了 "Philosopher Skill"，这是一个开源的 Claude 技能，能把 LLM 的回答转成一个自包含的 HTML 阅读指南。它用 Claude Code 构建，按 Claude 技能的形式工作；作者称其免费、开源，无需账号。

该技能遵循 OKF（开放知识格式），打包了一个八步工作流、一个领域分类器、一个页面模板和十二个学习领域。只有当问题需要时才会读取对应文件，作者称这样可以让运行成本保持较低。深度由措辞控制："quick" 生成短页面，普通提问生成标准页面，"in depth" 或 "teach me" 生成长页面。页面上的每条论断都会标注到模型实际检索到的来源。

作者给出三种使用方式：在支持技能的代码编辑器和智能体（Claude Code、Cursor、Codex、opencode）中使用他提供的 npx 命令；在带浏览功能的聊天应用中粘贴 philosopher.md 链接并要求模型照做；以及在没有网络的模型上，直接粘贴页面中的提示词。文中还链接了一个讲解 MCP 与 ACP 的示例输出。

这是一则简短的发布公告，而非有文档支撑的评测。关于成本和质量的表述来自作者本人，没有提供独立的基准测试、采用数据或对比结果。
