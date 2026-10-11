---
publish: true
content_type: "post"
title: "我用 Claude Code 在一周内做出了小型解谜平台游戏 MEOWCHA（浏览器免费）"
description: "为参加游戏创作营（game jam），一位开发者用一周时间做出了 MEOWCHA：一款小型解谜平台游戏，玩家操控一只猫驾驶大型机器人，每个关卡的关键都在于谁该走到哪里。游戏在浏览器中免费游玩，仅限桌面端，使用键盘操作；手柄支持处于实验阶段，手机和平板上无法游玩。 Claude Code 用 Phaser 与 TypeScript 编写了全部代码，并以文本地图的形式构建了九个关卡。像素美术同样由代码生成：机器人和猫都是由脚本按照手工挑选的调色板逐像素绘制。自动化测试是开发流程的"
date: "2026-10-09T03:50:22.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1bb0q/i_made_a_small_puzzle_platformer_with_claude_code/"
tags: ["source/reddit","topics/coding","topics/agents","topics/products"]
---

为参加游戏创作营（game jam），一位开发者用一周时间做出了 MEOWCHA：一款小型解谜平台游戏，玩家操控一只猫驾驶大型机器人，每个关卡的关键都在于谁该走到哪里。游戏在浏览器中免费游玩，仅限桌面端，使用键盘操作；手柄支持处于实验阶段，手机和平板上无法游玩。

Claude Code 用 Phaser 与 TypeScript 编写了全部代码，并以文本地图的形式构建了九个关卡。像素美术同样由代码生成：机器人和猫都是由脚本按照手工挑选的调色板逐像素绘制。自动化测试是开发流程的一部分——每个关卡都有一段在模拟中运行的脚本化通关流程，因此任何会导致关卡无法完成的改动都会在几秒内触发测试失败。

开发者明确说明了局限。模型听不到声音，因此它并不评判音频，而是测量每个音效的响度。而脚本化通关只能证明关卡可解，不能证明它好玩，所以这一空缺由真人试玩来填补。开发者负责导演、试玩，并决定哪些内容保留。

这是一位开发者对为期一周创作营项目的亲身记录，而非基准测试；关于效率和工作流程的说法均来自作者本人，没有提供独立的对比。作者表示愿意回答关于该流程的问题。

## 图片与视频

- [图片: I made a small puzzle platformer with Claude Code in a week: MEOWCHA &#40;free, browser&#41;](<https://external-preview.redd.it/FmueUq99WvZP4u9DG271_yBzDYO5_CMDw52c2US0s1M.png?width=140&height=111&auto=webp&s=21730c3fa88cd306a1276112dab679ea841c8d9a>)
