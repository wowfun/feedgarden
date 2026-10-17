---
publish: true
content_type: "post"
title: "一个 61 KB 的 HTML 文件实现实时 WebGPU 海洋模拟"
description: "一位使用 Claude Code（Opus 5.5）的开发者发布了一个实时海洋模拟：整个项目是单个 61 KB 的 HTML 文件，在浏览器中通过 WebGPU 渲染日落海面，包含基于 FFT 的波浪模拟、白浪、带云层的物理天空以及太阳波光。用户可以用鼠标和 WASD 键在其中飞行。 作者表示，渲染器是依据一条提示从零写成的：要求在 WebGPU 中做出尽可能真实的水面，并带一个漂浮相机，不使用引擎或库。整个过程约耗时 30 分钟。为避免模型评判自己的成果，智能体先截取..."
date: "2026-10-16T23:24:42.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:50:02.940Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x7v7gj/this_is_61_kb_html_file/"
tags: ["source/reddit","topics/coding","topics/computer-graphics"]
---

一位使用 Claude Code（Opus 5.5）的开发者发布了一个实时海洋模拟：整个项目是单个 61 KB 的 HTML 文件，在浏览器中通过 WebGPU 渲染日落海面，包含基于 FFT 的波浪模拟、白浪、带云层的物理天空以及太阳波光。用户可以用鼠标和 WASD 键在其中飞行。

作者表示，渲染器是依据一条提示从零写成的：要求在 WebGPU 中做出尽可能真实的水面，并带一个漂浮相机，不使用引擎或库。整个过程约耗时 30 分钟。为避免模型评判自己的成果，智能体先截取输出画面，再让独立的子智能体对截图进行评审。

演示可免费试用，最好使用 Chrome。它需要支持 WebGPU 的 GPU；在笔记本上必须让 Chrome 使用独立显卡，否则性能可能很差甚至无法运行。作者称在 RTX 5070 Ti 上以 2560×1440 分辨率可达到约 260 FPS。点击画布可环顾，WASD 移动，按 H 打开设置面板。作者提供的仓库包含未压缩且组织更清晰的版本。

## 媒体

![图片: This is 61 KB HTML file 🤯](<https://external-preview.redd.it/YnN3bnFsdjB5d3ZoMRJy8ktkrENMwFs2mSpDVAH5vpc3thEy2iqFXx5AN9T6.png?width=640&crop=smart&auto=webp&s=91b6fb56e7cdddeed2f0e25c4a2aae22b55bc5d1>)

[图片: This is 61 KB HTML file 🤯](<https://external-preview.redd.it/YnN3bnFsdjB5d3ZoMRJy8ktkrENMwFs2mSpDVAH5vpc3thEy2iqFXx5AN9T6.png?width=640&crop=smart&auto=webp&s=91b6fb56e7cdddeed2f0e25c4a2aae22b55bc5d1>)
