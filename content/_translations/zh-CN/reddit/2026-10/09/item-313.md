---
publish: true
content_type: "post"
title: "开源 Claude Code 插件：Material Design 3 Expressive 技能、18 个组件与 MCP 无障碍检查器"
description: "开发者 /u/Prestigious-Bank2145 发布了一款免费开源 Claude Code 插件 claude-md3-expressive，目标是让 Claude 生成符合 Material Design 3（MD3）Expressive 规范的界面。动机来自作者用 Claude Code 搭建一个实时行情看板：他表示 Claude 写出的 UI 乍看没问题，但会不断“跑偏”——对话框里出现 12px 文字、硬编码的 #333 破坏深色模式、图标按钮没有可访问名称、"
date: "2026-10-09T13:44:24.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1lqxz/opensource_claude_code_plugin_md3_expressive/"
tags: ["source/reddit","topics/coding","topics/products"]
---

开发者 /u/Prestigious-Bank2145 发布了一款免费开源 Claude Code 插件 claude-md3-expressive，目标是让 Claude 生成符合 Material Design 3（MD3）Expressive 规范的界面。动机来自作者用 Claude Code 搭建一个实时行情看板：他表示 Claude 写出的 UI 乍看没问题，但会不断“跑偏”——对话框里出现 12px 文字、硬编码的 &#35;333 破坏深色模式、图标按钮没有可访问名称、选中的标签页屏幕阅读器无法识别——导致每个会话都要重新解释同一套设计规则。

该插件由三部分组成。一个 skill 在涉及 UI 工作时加载，提供字体（type role）、颜色角色、形状、动效、状态层、组件尺寸和无障碍规则。18 个现成组件以纯 HTML/CSS/JS 提供，涵盖应用栏、按钮、对话框、文本输入框、表格等，并带有浅色与深色版本。一个用纯 Node、零依赖实现的 MCP 服务器提供 8 个工具供 Claude 在工作过程中调用：设计令牌、按用途查询字体角色（例如对话框正文对应 Body Medium 14sp）、组件、完成检查清单、linter 以及 WCAG 对比度检查器。

作者称 linter 是使用最多的部分：Claude 会对自己生成的输出运行检查，并在宣布“完成”之前修正错误。文中列出的检查项包括缺少控件名称、只有 active 类而没有 aria-pressed、对话框触发器缺少 aria-haspopup、跳级标题、静态内联样式、px 字号、硬编码颜色以及 transition: all，并附带行号和修复建议。安装通过两条命令添加插件市场并安装插件，之后照常向 Claude 提出 UI 需求即可。

作者也列出了局限：这是他对公开 MD3 指南的个人解读，并非 Google 官方产品；linter 检查规则而非审美，无法判断布局是否显得拥挤；CSS 没有真正的弹簧动画，因此动效令牌只是 cubic-bezier 近似；使用 color-mix&#40;&#41; 和 :has&#40;&#41; 需要 2023 年及以后版本的浏览器；默认调色板取自作者看板的青色种子色，替换方式已有文档说明，测试会保证对比度合规。该样式表与组件集不依赖 Claude 也能使用，以 MIT 许可发布，含 49 项测试且 CI 通过。

## 图片与视频

- [图片: Open-source Claude Code plugin: MD3 Expressive skill, 18 components, and an MCP linter for accessible UI](<https://preview.redd.it/s45bx3ju3guh1.png?width=140&height=140&crop=1:1,smart&auto=webp&s=ce88743c7ef29da747c7a7eab82d6e3d84e9c267>)
