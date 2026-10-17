---
publish: true
content_type: "post"
title: "我完全失明，做了一款让全盲用户配合 3D 切片软件使用商用 3D 打印机的软件"
description: "全盲开发者 Edis 发布了 AccessSlice：一款免费开源的 Windows 程序，让盲人和视障用户借助 JAWS、NVDA 或讲述人读屏软件，独立完成 3D 打印的准备、切片和发送。他并非专业程序员，而是用 Claude 反复说明需求，再用自己的读屏软件和打印机测试、修正问题，才完成这个项目。 AccessSlice 不替代切片软件，而是替代其中的屏幕界面。它读取 3MF 项目中的层高、墙数、填充、支撑、耗材和物体摆放等设置，通过带有标题、已标注字段和按钮的无..."
date: "2026-10-16T20:33:19.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:50:02.940Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x7r7ul/im_100_blind_i_made_a_piece_of_software_that_lets/"
tags: ["source/reddit","topics/accessibility","topics/coding","topics/hardware"]
---

全盲开发者 Edis 发布了 AccessSlice：一款免费开源的 Windows 程序，让盲人和视障用户借助 JAWS、NVDA 或讲述人读屏软件，独立完成 3D 打印的准备、切片和发送。他并非专业程序员，而是用 Claude 反复说明需求，再用自己的读屏软件和打印机测试、修正问题，才完成这个项目。

AccessSlice 不替代切片软件，而是替代其中的屏幕界面。它读取 3MF 项目中的层高、墙数、填充、支撑、耗材和物体摆放等设置，通过带有标题、已标注字段和按钮的无障碍页面呈现。软件调用 PrusaSlicer、Bambu Studio、Creality Print、OrcaSlicer 和 Anycubic Slicer Next 的原生切片引擎，以文字报告打印时间、耗材用量和警告，并逐层描述切片后的模型。

打印任务可通过网络发送到受支持的 Prusa 和 Creality 打印机，或在键盘指引下通过 Bambu Studio 的发送窗口完成，也支持 USB。对于受支持的 Prusa 和 Creality 设备，软件能读取进度、预热、装载和卸载耗材、移动和回零、暂停和停止任务以及管理打印机文件，无需触摸屏。Edis 表示已在 Prusa Core One、Bambu Lab X1 Carbon、Bambu Lab H2C 和 Creality K2 Plus 上做了端到端测试。

项目的起点是 2023 年丹麦盲人与视障者研究所举办的 3D 打印工作坊——工作坊讲的是视力正常者如何为盲人制作东西，当时没有盲人或视障者参加——以及他购买 Bambu Lab X1 Carbon 后对不可访问切片软件的困扰。AccessSlice 面向触觉地图、应急疏散图和盲文标签等实用物品。Edis 认为切片软件公司本应一开始就做好无障碍，但在那之前，这个工具对需要的人免费。

## 媒体

![图片: I’m 100% blind. I made a piece of software that lets fully blind people use commercial 3D printers along with their 3D slicers.](<https://preview.redd.it/uj7jew4j3wvh1.jpg?width=140&height=140&crop=1:1,smart&auto=webp&s=8b2adee19d43933f58016e7fe5afe8e7522019ed>)

[图片: I’m 100% blind. I made a piece of software that lets fully blind people use commercial 3D printers along with their 3D slicers.](<https://preview.redd.it/uj7jew4j3wvh1.jpg?width=140&height=140&crop=1:1,smart&auto=webp&s=8b2adee19d43933f58016e7fe5afe8e7522019ed>)
