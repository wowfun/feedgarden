---
publish: true
content_type: "post"
title: "将经典 Mac OS 移植到任天堂 Wii"
description: "一位开发者成功将经典 Mac OS 移植到任天堂基于 PowerPC 的游戏机硬件上，在 Wii 上实现了 System 7.6 和 Mac OS 9.2.2 的桌面环境启动。该项目针对使用 ArtX 芯片组的 GameCube、Wii 等主机，并借鉴了此前他人将 Mac OS X 移植到 Wii 时的 OpenBIOS 相关工作。 移植过程中需要改造大端序 ELF 加载器，为 EXI 总线编写磁盘驱动（包括 SD Gecko 和用于模拟器测试的自定义 EXI-IDE ..."
date: "2026-10-30T17:25:15.000Z"
updated: "2026-11-01T15:39:43.305Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://virtuallyfun.com/2026/10/29/my-favourite-powermac-is-a-nintendo-wii/"
discussion_url: "https://news.ycombinator.com/item?id=50307190"
tags: ["source/hackernews","topics/hardware","topics/coding"]
---

## 正文提炼

一位开发者成功将经典 Mac OS 移植到任天堂基于 PowerPC 的游戏机硬件上，在 Wii 上实现了 System 7.6 和 Mac OS 9.2.2 的桌面环境启动。该项目针对使用 ArtX 芯片组的 GameCube、Wii 等主机，并借鉴了此前他人将 Mac OS X 移植到 Wii 时的 OpenBIOS 相关工作。

移植过程中需要改造大端序 ELF 加载器，为 EXI 总线编写磁盘驱动（包括 SD Gecko 和用于模拟器测试的自定义 EXI-IDE 驱动），并通过 OpenBIOS 与 Trampoline 引导程序加载 TBXI ROM 来启动系统。最大的技术难点之一是修复 Trampoline 对物理内存布局的错误假设。开发者表示，这很可能是自 CHRP 克隆机时代以来，首次有非苹果硬件成功运行经典 Mac OS 并进入桌面。

整个项目由开发者独立完成，未使用 AI 辅助，仅出于学习和兴趣。虽然距离公开发布还有很长的路要走，但这一里程碑已经证明经典 Mac OS 可以在 Wii 硬件上正常运行，相关截图和视频也展示了从启动到桌面的全过程。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论者指出，在任天堂关闭移动端 Mario Kart Tour 后，人们重新开始关注 Wii。改装后的主机不仅能运行新软件，还能恢复部分在线功能。部分网友认出这位开发者曾经将 Windows NT 移植到 Mac、GameCube 和 Wii 平台。还有人回忆起 Wii 发布时的热潮，提到体感控制的宣传以及即将到来的 20 周年纪念。

评论来源：[unfocused](https://news.ycombinator.com/item?id=50308039) · [unleaded](https://news.ycombinator.com/item?id=50312359) · [chamomeal](https://news.ycombinator.com/item?id=50315909)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50307190>)

## 媒体

![图片: Mac OS 9.2.2 booted on the Wii](<https://virtuallyfun.com/wp-content/uploads/2026/10/macos922_wii1_00-00-59.png>)

[图片: Mac OS 9.2.2 booted on the Wii](<https://virtuallyfun.com/wp-content/uploads/2026/10/macos922_wii1_00-00-59.png>)

![图片: Mac OS 7.6 booted in my hacked up Dolphin tree](<https://virtuallyfun.com/wp-content/uploads/2026/10/macos76_dolphin.png>)

[图片: Mac OS 7.6 booted in my hacked up Dolphin tree](<https://virtuallyfun.com/wp-content/uploads/2026/10/macos76_dolphin.png>)

![视频: Mac OS 7.6 booting on the Wii](<https://virtuallyfun.com/wp-content/uploads/2026/10/macos76_wii1-2.mp4>)

[视频: Mac OS 7.6 booting on the Wii](<https://virtuallyfun.com/wp-content/uploads/2026/10/macos76_wii1-2.mp4>)
