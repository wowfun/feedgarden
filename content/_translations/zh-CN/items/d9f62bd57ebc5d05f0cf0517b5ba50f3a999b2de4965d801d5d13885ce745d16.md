---
publish: true
content_type: "post"
title: "Shakespeare：用 Claude Code 打造、免费的 macOS 菜单栏打字统计应用"
description: "一名开发者发布了 Shakespeare——一款免费、开源（MIT）、完全离线的 macOS 菜单栏应用，用于统计打字量并转化为趣味数据。该应用使用 Claude Code 构建。 功能包括：今日和最近 14 天的按键数、单日按键达 50 次以上的连续天数、最忙碌的时段，以及「打了多少个哈姆雷特」的计数。它用完整 60 秒窗口测算最佳每分钟词数，只计字母和空格，因此快捷键和方向键无法虚增成绩。按月颁发的徽章以莎士比亚作品命名，从「对句」一直到「全集」；进度在每月 1 日重置，"
date: "2026-10-09T10:25:31.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1hrzq/shakespeare_fun_typing_stats_for_your_mac_menu_bar/"
tags: ["source/reddit","topics/coding","topics/security-privacy","topics/hardware"]
---

一名开发者发布了 Shakespeare——一款免费、开源（MIT）、完全离线的 macOS 菜单栏应用，用于统计打字量并转化为趣味数据。该应用使用 Claude Code 构建。

功能包括：今日和最近 14 天的按键数、单日按键达 50 次以上的连续天数、最忙碌的时段，以及「打了多少个哈姆雷特」的计数。它用完整 60 秒窗口测算最佳每分钟词数，只计字母和空格，因此快捷键和方向键无法虚增成绩。按月颁发的徽章以莎士比亚作品命名，从「对句」一直到「全集」；进度在每月 1 日重置，收藏功能会记录每枚徽章已获得的月份数。应用还会生成分享卡片（一周或某枚徽章），画面是九种配色之一的机械键盘，保存为 PNG。

隐私方面：应用只读取每次按键的数字键码，从不读取字符，因此无法还原用户输入的内容。每日计数器保存在单个仅所有者可读的文件中，「最常用应用」统计为可选功能，默认关闭。

关于开发过程，开发者表示自己负责产品与设计方向，Claude 编写了约 2,500 行 Swift 与 SwiftUI 代码，并经过审阅和迭代。Claude 把应用拆分为有测试覆盖的分层结构，并编写了构建、安装和图标生成脚本；视觉部分由开发者提供参考网站和浏览器页面，Claude 用代码绘制键盘和卡片，并在展示前离屏渲染检查。它还写了 31 个单元测试，其中包含向加载器输入恶意统计数据文件，并在 AddressSanitizer 下运行。开发者建议持续做安全审查，并始终自行复核成果。

应用免费，无需账号，也没有付费档；需要从源码自行构建。安装程序会构建、签名并启动应用，随后打开 macOS 设置页面以授予所需的「输入监控」权限。注意事项：应用需要输入监控权限，因此开发者建议在信任前先阅读源码；字母识别基于美式键盘布局，其他布局可能有轻微偏差。

## 图片与视频

- [图片: Shakespeare: fun typing stats for your Mac menu bar](<https://preview.redd.it/ytgg69ar4fuh1.png?width=140&height=140&crop=1:1,smart&auto=webp&s=23cbf1b4d2326ad253e174c97006d5efb0812a5b>)
