---
publish: true
content_type: "post"
title: "Prism：一款完全由 Claude 端到端开发的 Obsidian 社区插件"
description: "一位开发者发布了 Prism，这是一个免费、采用 MIT 许可的 Obsidian 社区插件，整个过程完全由 Claude Code 完成。该插件会把笔记中的 ```viz 代码块变成实时图表、示意图、仪表盘或公式。插件内置了 Chart.js、D3、Mermaid、KaTeX 和 three.js，因此可视化可以离线渲染，数据可来自 Markdown 表格、frontmatter、任务或仓库中的 CSV 文件。它已发布到 Obsidian 社区插件目录，可在“设置 → 第三"
date: "2026-10-09T06:49:14.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1ed4h/prism_a_obsidian_community_plugin_developed_end/"
tags: ["source/reddit","topics/products","topics/coding"]
---

一位开发者发布了 Prism，这是一个免费、采用 MIT 许可的 Obsidian 社区插件，整个过程完全由 Claude Code 完成。该插件会把笔记中的 &#96;&#96;&#96;viz 代码块变成实时图表、示意图、仪表盘或公式。插件内置了 Chart.js、D3、Mermaid、KaTeX 和 three.js，因此可视化可以离线渲染，数据可来自 Markdown 表格、frontmatter、任务或仓库中的 CSV 文件。它已发布到 Obsidian 社区插件目录，可在“设置 → 第三方插件 → 浏览”中搜索 floorianmb 的“Prism”进行安装。

作者表示，整个项目在 Pro 订阅下大约用一周完成，主要使用 Opus 5.5，并搭配少量 Sonnet 5.5 和 Haiku 5.5。据其描述，Claude 对几乎所有要求的功能都一次做对，例外主要是一些体验细节。例如，笔记发出的 API 请求会在代码块每次滚动回到视野时被触发，因此必须重做请求时机的逻辑。Claude 还让代码符合 Obsidian 的社区插件要求，插件随后通过了自动审核。

由于 Claude 看不到自己的渲染结果，作者让 Claude Code 增加了一个无头渲染命令：Claude 对笔记运行该命令，会收到带笔记行号的错误以及一张 PNG 截图，然后修复代码块并再次渲染。仓库中附带了一个可直接使用的 skill，适用于 Claude Code 和 Codex，还有一个可作为仓库打开的 examples 文件夹。作者强调，使用该插件并不需要任何 AI；文中还提到可以在不使用 iframe 的情况下嵌入网站和调用 API，以提高不被拦截的概率，并欢迎反馈、问题报告以及对内置 skill 的改进建议。

## 图片与视频

- [图片: Prism a obsidian community plugin developed end to end by Claude](<https://preview.redd.it/avwxc6h52euh1.jpg?width=140&height=53&auto=webp&s=c56557f6edcafb464b0f746829586bb4906e9288>)
