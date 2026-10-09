---
publish: true
content_type: "post"
title: "notMyShell（NMSh）：不只是终端的外观装饰"
description: "作者一直在开发 notMyShell（NMSh），这是一个开源终端前端，目标是在不替换现有配置的前提下，让日常终端体验在视觉和功能上都更好用。设计思路是保留用户偏好的终端模拟器（如 Ghostty、Kitty）和真实的 zsh、Bash 或 Fish shell，以及现有的命令、别名和函数；同时支持 Starship、Powerlevel10k、Oh My Posh 等提示符工具，几乎一切都可配置。 作者介绍的功能包括：CHROMA 外观定制，含渐变、颜色效果、命令反馈动画、"
date: "2026-10-08T22:49:38.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x158fa/notmyshell_nmsh_more_than_just_terminal_eye_candy/"
tags: ["source/reddit","topics/coding","topics/products","topics/hardware"]
---

作者一直在开发 notMyShell（NMSh），这是一个开源终端前端，目标是在不替换现有配置的前提下，让日常终端体验在视觉和功能上都更好用。设计思路是保留用户偏好的终端模拟器（如 Ghostty、Kitty）和真实的 zsh、Bash 或 Fish shell，以及现有的命令、别名和函数；同时支持 Starship、Powerlevel10k、Oh My Posh 等提示符工具，几乎一切都可配置。

作者介绍的功能包括：CHROMA 外观定制，含渐变、颜色效果、命令反馈动画、自定义主题、提示符、光标效果、屏保和一只小猫；内置菜单用于发现和配置 eza、fzf 等实用工具，让空白配置的用户也能上手；补全与建议功能，覆盖命令补全、语法高亮和预测性建议；常驻输入区，与滚动的输出分离；历史与会话功能，可搜索、浏览、折叠和重看命令输出，并支持分离、恢复和切换常驻会话。

/btw 命令提供大白话帮助，类似 tldr 但更有上下文意识：可以解释某条命令的作用、上一条命令为何失败、如何推送当前分支，甚至管理文件和设置；它不只是给出示例，还能解释并引导完成受支持的操作。项目不依赖 AI，但支持可选的本地模型。它仍在开发中，作者强调用户不必使用全部功能，其定位是与现有配置配合，而不是全部替换。

配套的演示视频本身就是用 Claude 制作的；作者承认视频节奏太快、内容过于杂乱，把太多内容塞进了短片，并计划在后续版本发布节奏更慢的视频。项目已开源，帖子邀请大家反馈希望改动或增加的内容。

## 图片与视频

- [图片: notMyShell: NMSh, more than just terminal eye candy.](<https://external-preview.redd.it/eXNlMDB1b2JsYnVoMXLNCMQNU9CMBDTSnFVj1nzSpKfwH2n1XMkJFpvRaXrn.png?width=640&crop=smart&auto=webp&s=4d13a33384d5c3c7122af20a4c466004d6e326eb>)
