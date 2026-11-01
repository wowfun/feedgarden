---
publish: true
content_type: "post"
title: "Infinite Mac 在浏览器中新增 BeOS 支持"
description: "Infinite Mac 现已支持在浏览器中运行多个版本的 BeOS。系统镜像会按需流式加载，用户可直接使用预装软件、从 Internet Archive 挂载 CD-ROM，并通过 'Saved HD' 驱动器保存数据。该项目基于 DingusPPC（PowerPC 模拟器），此前已用于模拟经典 Mac 系统。由于 BeOS 是独立开发的操作系统，将其引入后暴露出一系列模拟器兼容性问题：BeOS 引导程序误以为所有修饰键都被按下（导致每次都显示分区选择界面）；切换屏幕..."
date: "2026-10-30T19:30:09.000Z"
updated: "2026-11-01T15:39:43.305Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://blog.persistent.info/2026/10/infinite-mac-beos.html"
discussion_url: "https://news.ycombinator.com/item?id=50309029"
tags: ["source/hackernews","topics/products","topics/hardware"]
---

## 正文提炼

Infinite Mac 现已支持在浏览器中运行多个版本的 BeOS。系统镜像会按需流式加载，用户可直接使用预装软件、从 Internet Archive 挂载 CD-ROM，并通过 'Saved HD' 驱动器保存数据。该项目基于 DingusPPC（PowerPC 模拟器），此前已用于模拟经典 Mac 系统。由于 BeOS 是独立开发的操作系统，将其引入后暴露出一系列模拟器兼容性问题：BeOS 引导程序误以为所有修饰键都被按下（导致每次都显示分区选择界面）；切换屏幕色深时需同时通知视频控制器和数模转换器，但 BeOS 的通知顺序与 Mac OS 相反，若顺序不符会导致显示错乱；早期 BeOS 使用小端序更新显存，而 DingusPPC 原先缺少对该硬件特性的支持；此外 BeOS 对 HFS 分区结构的校验比 Mac OS 更严格，导致部分用工具生成的镜像无法正确挂载。作者将大部分修复提交到了 DingusPPC 上游，这些改动也使模拟器对硬件的建模更加精确。项目还验证了在该环境下，BeOS 可以通过 SheepShaver 运行 System 7.6.1（这一组合也需要修复 ROM 内存映射的边缘情况）。作者认为，目前可能只有这种配置能够运行 PowerPC 版 BeOS。这项工作主要服务于系统保存与体验：用户可在浏览器中对比 BeOS 和 OPENSTEP 等同时代系统，且这些模拟器改进也有望帮助后续引入 MkLinux、Rhapsody 等其他替代操作系统。其局限在于，模拟器的正确性往往建立在对某个系统特性的假设上，只有加入独立系统才能发现并修正这些隐含的依赖。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

本次样本中的讨论更多围绕 BeOS 的遗产展开，而不是具体实现细节。一位评论者询问如果苹果当年收购 BeOS 而不是 NeXT，会走向怎样的轨迹；有回复引用前 Be 员工的观点，认为从技术角度看苹果收购 NeXT 是更正确的决定，理由包括 BeOS 的代码质量、在网络和打印等重要领域落后、以及直接用 C++ 实现 API 导致对特定 GCC 版本的 ABI 依赖。其他人则关注当下：有人推荐 Haiku OS 作为 BeOS 的自由开源继承者，也有人回忆 2000 年初曾一度将 BeOS 作为主力系统，称赞其外观和体验。另有评论者提问 BeBox 上的 GeekPort 在今天有什么现代对应物，体现出对硬件折腾体验消逝的怀念。这些都只是个体观点，并非共识，涉及历史假设、传承以及平台设计上已消失的特性。

评论来源：[sfblah](https://news.ycombinator.com/item?id=50310152) · [ndiddy](https://news.ycombinator.com/item?id=50310477) · [renehsz](https://news.ycombinator.com/item?id=50309208) · [hobo123](https://news.ycombinator.com/item?id=50314453) · [Singletail](https://news.ycombinator.com/item?id=50310127)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50309029>)

## 媒体

![图片: BeOS R5 running inside Infinite Mac, showing GL Teapot, Mandelbrot, Gobe Productive, Terminal, image viewer and CPU monitor.](<https://persistent.info/images/infinite-mac-beos-desktop.webp>)

[图片: BeOS R5 running inside Infinite Mac, showing GL Teapot, Mandelbrot, Gobe Productive, Terminal, image viewer and CPU monitor.](<https://persistent.info/images/infinite-mac-beos-desktop.webp>)

![图片: Infinite Mac emulating BeOS R5 emulating System 7.6.1 running Speedometer](<https://persistent.info/images/infinite-mac-beos-sheepshaver.webp>)

[图片: Infinite Mac emulating BeOS R5 emulating System 7.6.1 running Speedometer](<https://persistent.info/images/infinite-mac-beos-sheepshaver.webp>)

![图片: Infinite Mac custom instance dialog with a BeOS control appearance.](<https://persistent.info/images/infinite-mac-beos-appearance.webp>)

[图片: Infinite Mac custom instance dialog with a BeOS control appearance.](<https://persistent.info/images/infinite-mac-beos-appearance.webp>)
