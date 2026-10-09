---
publish: true
content_type: "post"
title: "过去 18 年里我多次尝试做自己的梦想应用，用 Claude 在 14 天内完成"
description: "一位有 30 年经验的开发者表示，在约 18 年间多次放弃之后，他终于用 Claude 在 14 天内做出了自己心心念念的卡拉 OK 应用。他说 Claude 分析了他的代码仓库历史，发现其中记录着五次此前的尝试（见 HISTORY.md），有些已经实现了屏幕上的歌词高亮，也有些尝试过制作歌曲包。此前的尝试都卡在繁琐的工作上：搜寻冷门资料、折腾并非为卡拉 OK 设计的合成器库。 完成的应用及其遥控端可运行于 Windows、Linux、macOS、Android、iOS，甚至"
date: "2026-10-09T10:35:49.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1hyaz/in_the_last_18_years_i_tried_multiple_times_doing/"
tags: ["source/reddit","topics/coding","topics/products","topics/agents"]
---

一位有 30 年经验的开发者表示，在约 18 年间多次放弃之后，他终于用 Claude 在 14 天内做出了自己心心念念的卡拉 OK 应用。他说 Claude 分析了他的代码仓库历史，发现其中记录着五次此前的尝试（见 HISTORY.md），有些已经实现了屏幕上的歌词高亮，也有些尝试过制作歌曲包。此前的尝试都卡在繁琐的工作上：搜寻冷门资料、折腾并非为卡拉 OK 设计的合成器库。

完成的应用及其遥控端可运行于 Windows、Linux、macOS、Android、iOS，甚至作为 Meta Quest 3 上的 VR 应用。它支持 MIDI/KAR、视频文件、MP3+G、UltraStar 和 LRC 格式；作者称每种格式大约花一个提示词和 30 分钟，MIDI 部分更复杂一些。项目还补上了 rustysynth 库缺失的功能。当作者抱怨某个 MIDI 文件“听起来怪怪的”时，他说 Claude 分析了该文件、找出它需要哪些特性，并自行实现，使播放恢复正常。他还说 Claude 修复了许多 MIDI 的怪异之处，例如奇怪的间距、和弦字符和错误的时间轴。

这位开发者用 Rust 编写应用，尽管此前从未用过该语言（他有 10 年以上 C++ 经验）；他表示自己一次都没有看过代码，还让 Claude 根据这份源码写了一份学习 Rust 的文档。他不认为这算“靠感觉随手写代码”（vibe coded），理由是凭借对这类产品的经验，他很清楚自己要做什么。他估计若靠自己，这个复杂度的项目至少要一年，可能还需要一个团队。应用官网也是用 Claude 生成的，代码以 MIT 许可证开源。

## 图片与视频

- [图片: In the last 18 years, I tried multiple times doing my dream app. Did it in 14 days with Claude.](<https://preview.redd.it/tbjg2lpa6fuh1.png?width=640&crop=smart&auto=webp&s=bfd491ed8201f6f97e27604e359ad94fd33c4f2e>)
