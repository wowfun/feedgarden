---
publish: true
content_type: "post"
title: "Meadows——一种让存量-流量图可运行的小语言"
description: "提交者 jjsalamon 表示，他在读 Donella Meadows 的《系统之美》时，想要亲手操作书中的图而不只是观看，于是写了一种用于存量-流量图的小语言。输入类似 |>inflow [water in tub: 50] =>outflow: 5| 的模型，就能得到存量-流量图、每个存量随时间变化的图表，以及运行过程在图上播放的动画，存量和反馈回路会随之脉动。每个示例的源码中都带有说明，也可以点击搭建；它完全在浏览器中运行，无需账号和后端，整个模型保存在 URL..."
date: "2026-10-09T12:29:40.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://lorezzed.github.io/meadows/"
discussion_url: "https://news.ycombinator.com/item?id=50019535"
tags: ["source/hackernews","topics/coding","topics/system-dynamics"]
---

## HN 热门讨论

根据 3 条选取的评论与回复整理。

提交者 jjsalamon 表示，他在读 Donella Meadows 的《系统之美》时，想要亲手操作书中的图而不只是观看，于是写了一种用于存量-流量图的小语言。输入类似 &#124;&gt;inflow &#91;water in tub: 50&#93; =&gt;outflow: 5&#124; 的模型，就能得到存量-流量图、每个存量随时间变化的图表，以及运行过程在图上播放的动画，存量和反馈回路会随之脉动。每个示例的源码中都带有说明，也可以点击搭建；它完全在浏览器中运行，无需账号和后端，整个模型保存在 URL 中，因此任何图都可以分享。

评论者 jamessb 反馈说，在 hunger、chicken-and-egg、burnout 和 predator-and-prey 这几个示例中，随时间变化的图表没有渲染出来。作者回复称，这些早期示例没有附加单位，所以实际上没有可绘制的数据，但系统本身仍能渲染；后续示例为存量和流量节点加入了数字，两张图就都会填充，他认为这一点可以表达得更清楚。

评论来源：[jjsalamon](https://news.ycombinator.com/item?id=50019536) · [jamessb](https://news.ycombinator.com/item?id=50020655) · [jjsalamon](https://news.ycombinator.com/item?id=50020772)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50019535>)
