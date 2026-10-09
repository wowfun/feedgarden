---
publish: true
content_type: "post"
title: "从每次提交中移除 Co-authored-by 行的 Git 钩子（Windows、macOS、Linux）"
description: "一位用户分享了一个全局 Git 钩子，可自动从每次提交中删除 Co-authored-by: 行，因为 Claude Code 和 Copilot 等 AI 编码工具经常会添加这类行。 该钩子会以不区分大小写的方式删除所有 Co-authored-by: 行，包括人类共同作者的署名，同时保留其他所有内容，包括其他署名行和空行。作者指出，这样就不必再依赖 claude.md 或 agents.md 规则。脚本是一段简短的 sh 脚本；将其保存为 ~/.githooks/comm"
date: "2026-10-09T06:15:28.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1dtpx/git_hook_that_removes_coauthoredby_lines_from/"
tags: ["source/reddit","topics/coding","topics/content-provenance","topics/security-privacy"]
---

一位用户分享了一个全局 Git 钩子，可自动从每次提交中删除 Co-authored-by: 行，因为 Claude Code 和 Copilot 等 AI 编码工具经常会添加这类行。

该钩子会以不区分大小写的方式删除所有 Co-authored-by: 行，包括人类共同作者的署名，同时保留其他所有内容，包括其他署名行和空行。作者指出，这样就不必再依赖 claude.md 或 agents.md 规则。脚本是一段简短的 sh 脚本；将其保存为 &#126;/.githooks/commit-msg，然后运行 mkdir -p &#126;/.githooks、chmod +x &#126;/.githooks/commit-msg 以及 git config --global core.hooksPath &#126;/.githooks。Windows 上通过 Git Bash、macOS 和 Linux 终端均可完成配置。

文中列出的注意事项：在 Windows 上脚本必须以 LF 行尾保存；core.hooksPath 会覆盖仓库现有的钩子，包括 Husky 和 pre-commit 配置；git commit --no-verify 会跳过该钩子；已有的提交历史不受影响。
