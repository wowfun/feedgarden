---
publish: true
content_type: "post"
title: "Grounded Engineering v0.6.0 现已成为 Claude Code 模组，并附带经过审查的技能仓库书架"
description: "Grounded Engineering v0.6.0 已发布，最大变化是它现在是一个 Claude Code 模组。/grounded 命令会在 Claude Code 内打开一个实时面板，包含两个界面。Practices 会读取当前打开仓库的信号，例如所用语言、CI 和测试配置，并显示哪些实践卡片适合这个特定仓库，而不是给出一份通用清单；随后 adapt 技能会提出一项具体改动供用户批准。Skill repos 则是在同一面板中展示的十六个经过审查的第三方技能仓库书架，e"
date: "2026-10-08T23:43:13.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x16e2o/grounded_engineering_v060_now_a_claude_code_mod/"
tags: ["source/reddit","topics/coding","topics/agents","topics/security-privacy"]
---

Grounded Engineering v0.6.0 已发布，最大变化是它现在是一个 Claude Code 模组。/grounded 命令会在 Claude Code 内打开一个实时面板，包含两个界面。Practices 会读取当前打开仓库的信号，例如所用语言、CI 和测试配置，并显示哪些实践卡片适合这个特定仓库，而不是给出一份通用清单；随后 adapt 技能会提出一项具体改动供用户批准。Skill repos 则是在同一面板中展示的十六个经过审查的第三方技能仓库书架，explain 技能会在用户真正安装之前说明它到底会带来什么。

每张实践卡片都从作者读过的真实实现中提炼而来，记录了模式、背后原则、理由、置信度，以及对观察到该做法的确切源码行的引用。文中给出的例子是一张关于“对智能体发起的工作限制网络出口”的卡片，它引用了 openai/codex 的 network&#95;approval.rs 第 625-820 行中允许/拒绝/审批的决策逻辑以及按执行范围构建代理的做法。技能仓库上架前要经过审查：在固定 commit 上阅读、对照 SPDX 检查许可证，且安装步骤必须是可直接验证的字面命令，其他内容只能放进安装说明中。

本次发布新增四张来自 openai/codex 的实践卡片，分别涉及：以明确可验证的格式表达编辑、将权限决定与动作本身分开、在操作系统沙箱中限制智能体执行的命令，以及为智能体发起的工作设置网络出口门控。ai-assisted 包现在包含十七张卡片。作者表示项目会持续增长：审查新来源就加入新卡片，书架上会增加仓库，来源发生漂移时既有条目会被更新或重新审查，并有来源漂移检查自动标记相关卡片。安装需要 Claude Code 2.1.288 或更高版本，通过插件市场完成；CLI 仍可在 npm 上以 npx grounded-engineering@0.6.0 使用。作者是 /u/MadJagStudios。

## 图片与视频

- [图片: Grounded Engineering v0.6.0: now a Claude Code mod with a shelf of reviewed skill repos](<https://preview.redd.it/1sibdk86tcuh1.gif?frame=1&width=140&height=84&auto=webp&s=cb374817f065900245b193cca7bb611b48f59080>)
