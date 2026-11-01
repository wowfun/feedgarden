---
publish: true
content_type: "post"
title: "周末项目：混合现实中的《超级马里奥 64》！"
description: "作者构建了一个原生混合现实版《超级马里奥 64》，以真实 3D 运行于 90 FPS，整个关卡如沙盘模型般置于桌面。构建过程使用了 Claude Code（Opus 5.5）配合 Unity CLI 与 PICO CLI，使助手能直接从终端在头显上构建、部署与迭代。Claude Code 编写了 SM64 反编译与 Unity 渲染器之间的桥接、将 N64 几何与输入映射转换为 MR 控制器映射，并调试帧节奏以达到稳定的 90 FPS。项目基于 n64decomp/sm..."
date: "2026-10-30T16:51:01.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T16:37:24.207Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1xjko2l/weekend_project_mario_64_in_mixed_reality/"
tags: ["source/reddit","topics/coding","topics/computer-graphics"]
---

作者构建了一个原生混合现实版《超级马里奥 64》，以真实 3D 运行于 90 FPS，整个关卡如沙盘模型般置于桌面。构建过程使用了 Claude Code（Opus 5.5）配合 Unity CLI 与 PICO CLI，使助手能直接从终端在头显上构建、部署与迭代。Claude Code 编写了 SM64 反编译与 Unity 渲染器之间的桥接、将 N64 几何与输入映射转换为 MR 控制器映射，并调试帧节奏以达到稳定的 90 FPS。项目基于 n64decomp/sm64 仓库，该仓库使原生 3D 渲染成为可能。作者拥有《超级马里奥 64》的正版实体卡带，并声明项目与任天堂或 PICO 无关联。

## 媒体

![图片: Weekend project: Mario 64 in Mixed Reality&#33;](<https://external-preview.redd.it/MjU2YnhodTV3bXloMaYheK4na4Rfz-v0mWHaUcdeWuKpEY4i0QCrtKTwKnz9.png?width=640&crop=smart&auto=webp&s=b84a98a41b69987e3a5519a0852a090f0da56915>)

[图片: Weekend project: Mario 64 in Mixed Reality&#33;](<https://external-preview.redd.it/MjU2YnhodTV3bXloMaYheK4na4Rfz-v0mWHaUcdeWuKpEY4i0QCrtKTwKnz9.png?width=640&crop=smart&auto=webp&s=b84a98a41b69987e3a5519a0852a090f0da56915>)
