---
publish: true
content_type: "post"
title: "没有视频剪辑软件，只有 Claude Code"
description: "一位开发者做了小型速记应用“scratchcat”，并完全用 Claude Code 制作了它的发布视频，全程没有打开视频剪辑软件。展示的视频是该项目的第 63 版。作者介绍了画面采集思路：由于应用界面是网页前端，Claude Code 并不进行屏幕录制，而是把真实构建好的应用挂载到一个网页里，并将其后端替换为脚本化的模拟服务，这样每个镜头都是真实应用、且恰好处于场景所需的状态。 每个场景是一个 HTML 页面，光标移动、缩放和字幕都是代码。脚本逐帧驱动无头 Chrome 走"
date: "2026-10-09T10:52:52.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1i8qy/no_video_editor_just_claude_code/"
tags: ["source/reddit","topics/coding","topics/products","topics/content-provenance"]
---

一位开发者做了小型速记应用“scratchcat”，并完全用 Claude Code 制作了它的发布视频，全程没有打开视频剪辑软件。展示的视频是该项目的第 63 版。作者介绍了画面采集思路：由于应用界面是网页前端，Claude Code 并不进行屏幕录制，而是把真实构建好的应用挂载到一个网页里，并将其后端替换为脚本化的模拟服务，这样每个镜头都是真实应用、且恰好处于场景所需的状态。

每个场景是一个 HTML 页面，光标移动、缩放和字幕都是代码。脚本逐帧驱动无头 Chrome 走完场景，再由 ffmpeg 编码，因此每次渲染结果完全一致。旁白来自 ElevenLabs，先一次性生成整段朗读，再按词级时间戳切成行，使配音与字幕保持同步。作者说自己的贡献是需求简述、分镜故事板以及每一轮的许多批注，场景和工具链则由 Claude Code 编写。他表示愿意就任何部分进一步展开。

关于应用本身：scratchcat 是一款速记工具，会把你在历史记录中清除的所有内容保留下来，具备使用 Parakeet 模型的设备端听写、离线语法检查，以及查找替换功能。它可在 Microsoft Store 免费试用，提供启用全部功能的 15 天试用（搜索 “scratchcat”，或访问 scratchcat.app）。Mac 和 Linux 版本也在该商店开放预售，作者表示非常欢迎 Windows 用户反馈。

## 图片与视频

- [图片: no video editor, just claude code](<https://external-preview.redd.it/d2FwNnlzeGM1ZnVoMTX_VO95PfBM5aBmg-EGkDJGsrdJbGkTD-FPxzH3bORs.png?width=640&crop=smart&auto=webp&s=5d45c245206ad9992d2f203b925315114d935309>)
