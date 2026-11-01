---
publish: true
content_type: "post"
title: "cheapAg：Opus 总在样板代码上触顶，于是我让一个 0.005 美元的模型来打字"
description: "一位开发者介绍“Cheap Agent”，这是一个用于 Claude Code 的 MCP 服务器与插件，将样板代码交给廉价模型（通过 OpenRouter 的 DeepSeek V4.1 Flash，每次任务约 0.005 美元）完成，而 Opus 负责规划与审查。廉价模型在 git worktree 中编写代码，并必须先写出失败再通过的测试；Cheap Agent 自行运行测试，仅通过的改动以未提交状态落地供审查，卡住时由 Sonnet 辅助完成。在 SWE-ben..."
date: "2026-10-30T20:37:04.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T16:38:28.082Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1xjqoi0/cheapag_my_opus_was_hitting_limits_on_boilerplate/"
tags: ["source/reddit","topics/coding","topics/agents"]
---

一位开发者介绍“Cheap Agent”，这是一个用于 Claude Code 的 MCP 服务器与插件，将样板代码交给廉价模型（通过 OpenRouter 的 DeepSeek V4.1 Flash，每次任务约 0.005 美元）完成，而 Opus 负责规划与审查。廉价模型在 git worktree 中编写代码，并必须先写出失败再通过的测试；Cheap Agent 自行运行测试，仅通过的改动以未提交状态落地供审查，卡住时由 Sonnet 辅助完成。在 SWE-bench Verified（Opus 5.5，相同提示）上，添加功能的 Opus token 从 15.4 万降至 5.7 万（减少 63%）；7 个日常 Bug 修复减少 59%，双方均全部解决；9 个最难 Bug 减少 55%，但 Cheap Agent 解决 6/9，而单独 Opus 解决 7/9。对 Opus 本就很快的小任务帮助不大。该工具采用 MIT 许可且免费；廉价模型使用用户自己的 API key，代码仅在按项目授权后发送给提供商。节省程度取决于仓库是否存在测试命令。项目本身用 Claude Code 构建，包括通过 Cheap Agent 自举。

## 媒体

![图片: cheapAg : My Opus was hitting limits on boilerplate, so I made a &#36;0.005 model do the typing](<https://preview.redd.it/h0hb476y0oyh1.gif?width=640&crop=smart&s=0cf18108ec2d49f1a97cc920175ea456bdf64f70>)

[图片: cheapAg : My Opus was hitting limits on boilerplate, so I made a &#36;0.005 model do the typing](<https://preview.redd.it/h0hb476y0oyh1.gif?width=640&crop=smart&s=0cf18108ec2d49f1a97cc920175ea456bdf64f70>)
