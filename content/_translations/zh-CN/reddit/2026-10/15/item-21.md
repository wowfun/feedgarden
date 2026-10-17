---
publish: true
content_type: "post"
title: "Unity URP 中的自然环境模拟，Opus5.5"
description: "作者在 Unity URP 中搭建一座北大西洋岛屿，大约已进行到第 7 天，并注明仍是进行中的作品。其明确目标是用 AI 看看能在多大程度上提升自己的技术美术与图形编程能力，主要使用 Opus 5.5，并用 Astra 做了少量点评。 目标是做出这样一座岛：你可以从海浪一路走到雪顶，无论停在哪里、往哪看都好看，还能在近岸处潜一小会儿水。地形使用了挪威罗弗敦的真实高程数据，经重塑和修改后成为一座约 4 × 5 公里、最高峰 1,000 米的岛屿。整体设定是多云为常态、多雾..."
date: "2026-10-14T22:35:48.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:05:18.966Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x658de/natural_environment_simulation_in_unity_urp_opus55/"
tags: ["source/reddit","topics/generative-media","topics/hardware","topics/research"]
---

作者在 Unity URP 中搭建一座北大西洋岛屿，大约已进行到第 7 天，并注明仍是进行中的作品。其明确目标是用 AI 看看能在多大程度上提升自己的技术美术与图形编程能力，主要使用 Opus 5.5，并用 Astra 做了少量点评。

目标是做出这样一座岛：你可以从海浪一路走到雪顶，无论停在哪里、往哪看都好看，还能在近岸处潜一小会儿水。地形使用了挪威罗弗敦的真实高程数据，经重塑和修改后成为一座约 4 × 5 公里、最高峰 1,000 米的岛屿。整体设定是多云为常态、多雾、少见阳光。

没有任何东西是手动摆放的：从落叶到中尺度与宏观尺度的地形变化、林下植被和岩石分布，全部由程序化系统完成。

目前的进展包括：地形及其岩石、苔藓和石楠；来自作者自研树木与森林生成器的桦树和松树林，超过 25,000 棵树；以及数十万株蕨类和地被植物；一片有波浪与拍岸浪的海洋、水下视觉效果、湖泊、池塘、溪流和瀑布；会生成又消散的云；雨、雾、星空和完整的昼夜循环。

作者称视频直接来自引擎，拥有数公里的绘制距离、自定义体积渲染、大气系统、光照与投影，以及在计算着色器中完成几何生成。作者表示它在 1440p 下运行远高于 60 fps。野生动物和音效尚未实现。

地形基于 Nasjonal høydemodell DTM 1 m，&#40;c&#41; Kartverket，依 CC BY 4.0 使用并经过修改。

## 媒体

![图片: Natural environment simulation in Unity URP, Opus5.5.](<https://external-preview.redd.it/MjBjM3ZsejNlaXZoMaLuKc36QEHRhX6wzIT497oH6S6HvxBsOYIQOkOT5heL.png?width=640&crop=smart&auto=webp&s=6d9eeb93f3992c7733010236546ffe47939c5b29>)

[图片: Natural environment simulation in Unity URP, Opus5.5.](<https://external-preview.redd.it/MjBjM3ZsejNlaXZoMaLuKc36QEHRhX6wzIT497oH6S6HvxBsOYIQOkOT5heL.png?width=640&crop=smart&auto=webp&s=6d9eeb93f3992c7733010236546ffe47939c5b29>)
