---
publish: true
content_type: "post"
title: "/doctor prompt-audit 会检查指令文件，却跳过 Claude 自己写的记忆文件夹"
description: "一位用户分享了关于 /doctor prompt-audit 命令的提示，该命令需要 v2.1.283 或更高版本。它会检查指令文件中的三类问题：为旧模型撰写的指令、对已不存在的文件或命令的引用，以及彼此矛盾的多个文件。它会生成一份带有修改建议的报告，在用户确认应用之前不会改动任何内容。 默认情况下，审计覆盖 CLAUDE.md、CLAUDE.local.md、AGENTS.md，以及 .claude/ 和 ~/.claude/ 下的 rules、skills、command"
date: "2026-10-09T09:19:06.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1gp4p/til_about_doctor_promptaudit_it_checks_every/"
tags: ["source/reddit","topics/coding","topics/agents","topics/evaluation"]
---

一位用户分享了关于 /doctor prompt-audit 命令的提示，该命令需要 v2.1.283 或更高版本。它会检查指令文件中的三类问题：为旧模型撰写的指令、对已不存在的文件或命令的引用，以及彼此矛盾的多个文件。它会生成一份带有修改建议的报告，在用户确认应用之前不会改动任何内容。

默认情况下，审计覆盖 CLAUDE.md、CLAUDE.local.md、AGENTS.md，以及 .claude/ 和 &#126;/.claude/ 下的 rules、skills、commands、subagents 和 output styles。也可以传入路径来只审计某一项，例如 /doctor prompt-audit .claude/skills/deploy。

自动记忆文件夹 &#126;/.claude/projects//memory/ 并不在覆盖范围内。那正是 Claude 在无人复核的情况下自行写入的文件夹，而且它的索引会加载进每次会话。在发帖人构建扩展 AI Toolbox 的代码仓库中，该文件夹有 65 个文件；本周其中一个文件因 Gemini 的方案变更而过时失效，这正是该审计专为捕获的“过期事实”类型，而审计从不查看那里。发帖人尚未确认把该记忆文件夹作为路径传入是否可行，因为它位于仓库之外，并希望尝试过的人反馈结果。

一个注意事项：该审计通过内置的 /claude-api skill 运行，因此如果用 disableBundledSkills 或 skillOverrides 关闭了内置 skills，该命令将不可用。
