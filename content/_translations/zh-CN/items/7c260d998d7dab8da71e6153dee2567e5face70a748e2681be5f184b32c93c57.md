---
publish: true
content_type: "post"
title: "我做了个 Fences 替代品，让 Claude Code 管理你的 Windows 桌面，免费开源"
description: "一位开发者发布了 PecoFence，一个免费开源的 Windows 桌面整理工具，定位为 Fences 的替代品。作者表示 Fences 收费，而免费的国产品（360、腾讯桌面）存在隐私问题，GitHub 上已有的 openfence 又比较弱。 作者本职做前端，此前从未写过 Rust，全部代码由 Claude Code 编写。第一条提示词要求做一个用于整理桌面的开源 Fences 替代品，并让模型先上网调研、写出方案。方案超过 10 万字符，包含约 15 个需要作者拍板的"
date: "2026-10-09T11:59:44.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1jh2x/i_built_a_fences_alternative_that_lets_claude/"
tags: ["source/reddit","topics/coding","topics/products","topics/agents"]
---

一位开发者发布了 PecoFence，一个免费开源的 Windows 桌面整理工具，定位为 Fences 的替代品。作者表示 Fences 收费，而免费的国产品（360、腾讯桌面）存在隐私问题，GitHub 上已有的 openfence 又比较弱。

作者本职做前端，此前从未写过 Rust，全部代码由 Claude Code 编写。第一条提示词要求做一个用于整理桌面的开源 Fences 替代品，并让模型先上网调研、写出方案。方案超过 10 万字符，包含约 15 个需要作者拍板的决策。

开发过程暴露出反复出现的验证问题。第一天磨砂玻璃效果只是一个半透明矩形，作者不得不让模型自己看截图并判断像不像磨砂玻璃。模型多次声称功能已可用，实际却是坏的，比如把标签页拖出围栏后会残留一个只有阴影的空窗口，而代码审查四次都没发现。作者促使它搭建测试环境：用用户的配置再跑一份应用副本，脚本化拖拽和合并操作，再自行查看截图。这套自动化也出过岔子：截图脚本曾把电脑上所有窗口最小化，有一次还发生在游戏过程中；伪造的鼠标拖拽坐标错误，结果动了 Chrome 窗口里的内容。另一次模型坚称测试显示 4 毫秒，直到它终于读取本机日志，才发现测的是另一条代码路径，作者实际使用的路径在刷新前会等一秒。

项目如今约有 11 万行 Rust 代码、约 50 个 PR，已上架微软商店并可通过 winget 安装，还有 10 种语言的网站、说明书和宣传片。配套的 pecofence-cli 把命令导出为 JSON schema 和技能说明，使 Claude Code 可以驱动它，例如要求把所有 PDF 移入一个 Docs 围栏并让新文件也进入其中。作者也提到多次重构过大的代码库（包括在用户、维护者和使用频率分析等多角度审查后，从约 1200 行和大量命令中做删减），并表示现在不再轻信“已修复”，而是要求提供验证。

## 图片与视频

- [图片: I built a Fences alternative that lets Claude Code manage your Windows desktop, free and open source](<https://external-preview.redd.it/dW44d2ZycWRsZnVoMXIf6uwAXwqfLyGLct9UNV7unZx9faZ-dcjqGkFKI9ue.png?width=640&crop=smart&auto=webp&s=52d260ce4f54ffb9e29ded9a68f7cf681e8c9b5e>)
