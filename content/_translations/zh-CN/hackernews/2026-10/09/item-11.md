---
publish: true
content_type: "post"
title: "iPhone Duo 对 Web 开发（以及 Video.js）意味着什么"
description: "在发布 Video.js v10.0.0 之后，Video.js 团队用一个周末的副业项目去研究苹果为可折叠的 iPhone Duo 开放了哪些 Web 平台 API。苹果发布了六段关于为该设备构建应用的视频；作者是长期 iOS 用户，他下载了 Xcode 27.1 beta1，在模拟器的 Device Hub 中启动了一台 iPhone Duo，并查看设置里的 WebKit 功能开关，以确认 Web 开发者究竟能用到什么。 文章重点考察了两个 API。Device Post"
date: "2026-10-08T17:16:38.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://videojs.org/blog/iphone-duo-web-development"
discussion_url: "https://news.ycombinator.com/item?id=50008709"
tags: ["source/hackernews","topics/coding","topics/hardware","topics/products"]
---

## 正文提炼

在发布 Video.js v10.0.0 之后，Video.js 团队用一个周末的副业项目去研究苹果为可折叠的 iPhone Duo 开放了哪些 Web 平台 API。苹果发布了六段关于为该设备构建应用的视频；作者是长期 iOS 用户，他下载了 Xcode 27.1 beta1，在模拟器的 Device Hub 中启动了一台 iPhone Duo，并查看设置里的 WebKit 功能开关，以确认 Web 开发者究竟能用到什么。

文章重点考察了两个 API。Device Posture API 用来判断屏幕是连续状态还是折叠状态，在 JavaScript 中为 navigator.devicePosture，在 CSS 中为 @media &#40;device-posture: folded&#41;。Viewport Segments API 则描述显示器的各个区域：window.viewport.segments 返回一组 DOMRect，包含每个分段的大小、形状和位置；CSS 侧可以用 @media &#40;horizontal-viewport-segments: n&#41; 和 @media &#40;vertical-viewport-segments: n&#41; 查询分段数量，也可以通过环境变量读取任意分段的位置和尺寸，例如 env&#40;viewport-segment-width 1 0&#41;，其中第一个数字是水平索引，第二个是垂直索引。文中给出一个通栏双列布局的例子，让两列分别吸附到折叠屏幕的两半，从而避免内容落在折痕上。

受 Netflix 的 iPhone Duo 应用启发——它把视频放在上半屏、控件放在下半屏，并在下屏做一个反射效果——作者尝试用 Video.js 复刻这样的播放器。简短的回答是不能：尽管展开的 Duo 基本相当于一台 iPad，苹果仍不允许自定义元素进入全屏，开发者只能用原生控件。作者提到 Fullscreen API 仍以实验性功能开关的形式存在，于是开启它继续探索。文中内容在此处中断，因此该实验的结果没有交代。

## 图片与视频

- [图片: WebKit feature flags in the Settings app on a folded iPhone Duo in the Device Hub](<https://videojs.org/.netlify/images?url=_astro%2Fsafari-feature-flags.CFLihoAx.png&w=2492&h=1724&dpl=6ac947d4ee38ca00087969df>)
- [图片: The same Settings layout on a partially folded iPhone Duo, with each column snapped to one half of the screen](<https://videojs.org/.netlify/images?url=_astro%2Flayout-folded.BY-r73Da.webp&w=1976&h=1742&dpl=6ac947d4ee38ca00087969df>)
- [图片: Video.js controls in fullscreen on a folded iPhone Duo, with the video on the top half and the control bar at the bottom of the screen](<https://videojs.org/.netlify/images?url=_astro%2Fvideojs-fullscreen.BLPrpZym.png&w=2496&h=2090&dpl=6ac947d4ee38ca00087969df>)
