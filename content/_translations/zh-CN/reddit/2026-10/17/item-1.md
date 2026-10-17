---
publish: true
content_type: "post"
title: "Screencap 让 Claude 记住你的屏幕活动"
description: "发帖者一直不满智能体总要让用户反复解释已经向别人说过的事，或指望它们一开始就明白用户希望它们理解的内容。为此他在约一年前做了这个开源的活动记忆系统：它会以相当高的频率截取屏幕，尝试理解、归类并分组这些活动，在需要时通过 MCP 向智能体提供上下文。作者昨天把它改写为 Swift，并改用 System One 进行分类；他表示新版本与 Claude 配合得很好，项目也因此迎来“第二次生命”，于是决定分享。 项目采用 MIT 许可证，可供下载。作者称，开源让个性化几乎没有边..."
date: "2026-10-16T16:37:32.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:50:02.940Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x7l3ck/i_gave_claude_a_memory_of_my_screen_activity/"
tags: ["source/reddit","topics/agent-memory","topics/open-source","topics/agents"]
---

发帖者一直不满智能体总要让用户反复解释已经向别人说过的事，或指望它们一开始就明白用户希望它们理解的内容。为此他在约一年前做了这个开源的活动记忆系统：它会以相当高的频率截取屏幕，尝试理解、归类并分组这些活动，在需要时通过 MCP 向智能体提供上下文。作者昨天把它改写为 Swift，并改用 System One 进行分类；他表示新版本与 Claude 配合得很好，项目也因此迎来“第二次生命”，于是决定分享。

项目采用 MIT 许可证，可供下载。作者称，开源让个性化几乎没有边界，例如可以加入语音输入，或识别用户参与度最低的活动。应用还提供极简的弹出窗口和主界面，方便用户手动浏览自己的活动记录。

接入方式有两种：在“设置 → 智能体”中连接，或在 macOS 上运行 /Applications/Screencap.app/Contents/MacOS/Screencap mcp install claude-code 命令为 claude-code 安装 MCP。帖文没有说明截取的屏幕数据如何存储、保留或保护。
