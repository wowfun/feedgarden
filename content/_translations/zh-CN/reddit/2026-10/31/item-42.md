---
publish: true
content_type: "post"
title: "两个免费的 Claude Code 插件：任务委派编排器与像素风智能体办公室"
description: "开发者 ilkemerol 发布了两个免费且采用 MIT 许可证的 Claude Code 插件——foreman 与 foreman-vision，用于解决同时运行多个子智能体时主上下文被文件内容撑满、以及无法看清每个智能体在做什么的问题。foreman 将主会话转变为编排器：它读取计划、拆分工作、把每部分交给子智能体，并核验结果，但自身不修改文件；所有变更都经由子智能体完成，因此主上下文保留结论而非文件转储。相互独立的任务并行运行，智能体的“完成”被视为声明，主会话..."
date: "2026-10-31T09:03:32.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T16:38:28.082Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1xk5de5/i_built_two_claude_code_skillsplugins_one_makes/"
tags: ["source/reddit","topics/agents","topics/coding"]
---

开发者 ilkemerol 发布了两个免费且采用 MIT 许可证的 Claude Code 插件——foreman 与 foreman-vision，用于解决同时运行多个子智能体时主上下文被文件内容撑满、以及无法看清每个智能体在做什么的问题。foreman 将主会话转变为编排器：它读取计划、拆分工作、把每部分交给子智能体，并核验结果，但自身不修改文件；所有变更都经由子智能体完成，因此主上下文保留结论而非文件转储。相互独立的任务并行运行，智能体的“完成”被视为声明，主会话会在接受前读取差异或运行检查。只有主会话可以生成智能体，由钩子强制执行。该插件适用于多智能体任务，不适合单文件修改或紧密的编辑-测试循环；可通过 /foreman on 或 /foreman &lt;task&gt; 启用。foreman-vision 是运行在 127.0.0.1 的浏览器实时视图，机器上的每个 Claude Code 会话对应办公室的一层。子智能体走到工位并显示当前工具；需要权限或回答时进入等待室并头顶气球。点击智能体可查看最近的工具调用和实时终端，另有看板视图与混合视图。两个插件可独立使用。要求与限制：仅支持 Claude Code；两者需要 bash 与 jq；foreman-vision 还需要 Node 22.18 或更高版本及 curl。已在 macOS 与 Windows（Git Bash）上使用，Linux 未测试。foreman-vision 读取 Claude Code 已写入磁盘的钩子事件与转录；除通过其弹窗回答主智能体问题外，数据不会离开机器。安装通过 Claude 插件市场命令，重启 Claude Code 后运行 /foreman-vision start。
