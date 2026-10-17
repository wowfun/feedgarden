---
publish: true
content_type: "post"
title: "在做一个帮 Claude 画出好像素画的工具"
description: "作者正在开发一套带实时查看器的像素画 DSL。展示的女巫小屋是 1,000 行代码。由于 Claude 是用代码作画，作者便请它写了一个库，把创作像素画时通常需要的功能都包含进去，这样就不必每次都重新写这些工具链。作者给出的类比是：这是给 Claude 用的 Aseprite。 该库包含镜像、自动描边、调色板替换、可复用部件、散布笔刷、瓦片地图、阴影层与光照层、动画帧以及光照。 pxl serve 命令会打开一个实时浏览器查看器，在 Claude 每次保存时重放每一个绘..."
date: "2026-10-15T02:55:21.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:05:18.966Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x6akki/working_on_a_tool_to_help_claude_make_good_pixel/"
tags: ["source/reddit","topics/coding","topics/generative-media","topics/agents"]
---

作者正在开发一套带实时查看器的像素画 DSL。展示的女巫小屋是 1,000 行代码。由于 Claude 是用代码作画，作者便请它写了一个库，把创作像素画时通常需要的功能都包含进去，这样就不必每次都重新写这些工具链。作者给出的类比是：这是给 Claude 用的 Aseprite。

该库包含镜像、自动描边、调色板替换、可复用部件、散布笔刷、瓦片地图、阴影层与光照层、动画帧以及光照。

pxl serve 命令会打开一个实时浏览器查看器，在 Claude 每次保存时重放每一个绘制步骤，因此你可以看着它作画。视频中的场景就是一个文件：冒泡的坩埚、火焰、蜡烛、猫和青蛙全都有动画。

安装为 skill 的方式：把 claude-pxl 仓库 git clone 到 &#126;/.claude/skills/pxl-pixel-art，然后让 Claude 画点什么。
