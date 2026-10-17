---
publish: true
content_type: "post"
title: "我为 Claude Code 做了一个免费的 Windows 用量限额小组件，像素 Clawd 会随会话变化"
description: "一位开发者发布了免费开源的 Windows 小组件，用浮动窗口和系统托盘图标显示 Claude 套餐用量。它呈现与 Claude Code 中 /usage 相同的数字，包括当前会话、每周和 Fable 限额，并每分钟刷新。它还会列出正在运行的 Claude Code 会话状态（工作中、等待输入或空闲），显示 Anthropic 服务状态，并在 Claude Code 有更新时提醒。 该工具以无头方式运行 claude -p \"/usage\"，从现有登录中获取服务器端百..."
date: "2026-10-16T18:36:32.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:50:02.940Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x7o895/i_built_a_free_windows_widget_for_claude_usage/"
tags: ["source/reddit","topics/coding","topics/products","topics/open-source"]
---

一位开发者发布了免费开源的 Windows 小组件，用浮动窗口和系统托盘图标显示 Claude 套餐用量。它呈现与 Claude Code 中 /usage 相同的数字，包括当前会话、每周和 Fable 限额，并每分钟刷新。它还会列出正在运行的 Claude Code 会话状态（工作中、等待输入或空闲），显示 Anthropic 服务状态，并在 Claude Code 有更新时提醒。

该工具以无头方式运行 claude -p "/usage"，从现有登录中获取服务器端百分比，不调用模型，因此不消耗 token。会话信息来自 Claude Code 保存在 &#126;/.claude/sessions 的注册表。程序使用纯 PowerShell 5.1 和 WPF 编写，除 Claude Code 外无需安装其他东西。

名为 Clawd 的像素角色会随数据变化：没有任务时睡在地洞里，会话工作时奔跑，会话等待输入时举着问号挥手，接近限额时流汗，达到 100% 时四脚朝天；标题栏的心形表示剩余会话额度。

作者表示，Claude Code 帮助完成了这约 3,000 行的 WPF 应用，把原本的单脚本拆成约 18 个点源模块，并编写 CLAUDE.md，记录加载顺序规则和 PowerShell 5.1 的坑，例如 UTF-8 BOM 要求以及不支持 ?? 运算符。公开发布版还加入了可即时切换语言的英文界面，翻译了代码注释，并加入用脚本化假数据直接从 WPF 生成 README GIF 的录制脚本；录制过程还发现了一个英文文本与标题重叠的布局问题。作者提醒，从 Git Bash 调用 /usage 会被当成文件路径并作为提示发送给模型，因此小组件只在 PowerShell 中调用。项目采用 MIT 许可，需要 Windows 10/11 和已登录的 Claude Code，与 Anthropic 无隶属关系。
