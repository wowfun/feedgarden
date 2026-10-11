---
publish: true
content_type: "post"
title: "Show HN：用 LED 灯丝制作柔性霓虹 T 恤"
description: "因公司临时通知不到一周后举办霓虹主题活动，作者利用这个期限，把在零件箱里放了多年的 LED 灯丝做成了可穿戴的霓虹 T 恤，并详细记录了零件、工艺与限制。 LED 灯丝是柔性长条，内含数百颗微型 LED，外层包裹约 1.8 毫米的硅胶散光层；它们原本为爱迪生式灯泡量产，也很容易用于 DIY，Adafruit 把它们叫做 noodles（面条）。零件清单包括 600mm 12V 暖白灯丝、300mm 3V 红色灯丝和一根 1200mm 24V 红色灯丝，USB 移动电源、ESP"
date: "2026-10-08T16:37:24.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "http://scottbezek.blogspot.com/2026/10/making-flexible-neon-t-shirt-with-leds.html"
discussion_url: "https://news.ycombinator.com/item?id=50008047"
tags: ["source/hackernews","topics/hardware"]
---

## 正文提炼

因公司临时通知不到一周后举办霓虹主题活动，作者利用这个期限，把在零件箱里放了多年的 LED 灯丝做成了可穿戴的霓虹 T 恤，并详细记录了零件、工艺与限制。

LED 灯丝是柔性长条，内含数百颗微型 LED，外层包裹约 1.8 毫米的硅胶散光层；它们原本为爱迪生式灯泡量产，也很容易用于 DIY，Adafruit 把它们叫做 noodles（面条）。零件清单包括 600mm 12V 暖白灯丝、300mm 3V 红色灯丝和一根 1200mm 24V 红色灯丝，USB 移动电源、ESP32、恒流升压驱动（如 TPS61169）、ULN2003A 三极管阵列模块，以及黑色 T 恤、黑线、作为硬挺衬底的十字绣布（Aida 布）、描图纸和热缩管。

纯棉 T 恤太软，无法在不堆皱的情况下支撑缝上去的灯丝造型，因此他把十字绣布缝在衣服内侧作衬底，并用绣花绷保持整体张紧。设计先画在描图纸上，再沿路径每隔几厘米用环针把灯丝固定，缝完后撕掉描图纸。

由于灯丝不能剪短，每条设计路径都必须匹配现有长度：他在 Inkscape 中画出连续路径，用 Measure Path 功能测量并按比例缩放到合适长度。背面是一只用单根 1200mm 24V 红色灯丝构成的羊驼；正面是卷曲霓虹文字（字体 Playwrite Belgie Vlaandere）配拉斯维加斯风格边框，约 900mm 的路径由多根 300mm 3V 灯丝拼成。

## HN 热门讨论

根据 9 条选取的评论与回复整理。

评论者分享了相近做法与安全提醒。一位把同类灯丝嵌入乳胶假体，做成角或面部凸起，认为赛博朋克风格效果很好，但警告灯带很难焊接：热量不足焊不上，过多则损坏灯丝，带压接金属触点的型号能解决焊接问题，代价是端部失去柔性。另一位说孩子的万圣节服装用了类似灯丝，一天内就开始失效；他顺着灯丝查找断点时被电到，用万用表测出 240V，难以相信两节 AA 电池能有这样的威力。有回复认为那件服装更可能用的是电致发光（EL）线，需要高压驱动。第三位说自己用 EL 线做过一半的项目，被电后放弃，觉得 24V 好得多。还有人称赞 PWM 渐亮动画、用心的照片和写作质量；一位引用作者自己的提醒——这件衣服不能机洗，其实也不适合手洗——并认为如果能解决可洗性会很有价值。

评论来源：[wolvoleo](https://news.ycombinator.com/item?id=50015985) · [khaki54](https://news.ycombinator.com/item?id=50014200) · [throawayonthe](https://news.ycombinator.com/item?id=50014496) · [IshKebab](https://news.ycombinator.com/item?id=50013087) · [4d4m](https://news.ycombinator.com/item?id=50008474) · [peter&#95;d&#95;sherman](https://news.ycombinator.com/item?id=50026576)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50008047>)

## 图片与视频

- [图片](<https://scottbez1.github.io/LedNeonShirt/IMG_0582%202.jpeg>)
- [图片](<https://blogger.googleusercontent.com/img/a/AVvXsEgs97-o3J1ajkrgSlL30Hi0TEdzSvL-0gPDR_GZX2oN0XAuFdG4264P2tlPh2fVHuyS_Q0neFBiChV43SyFa1_2Mo-2k2mdla1Eh4pCt-q30Z1dRTqpfarkzVJhUilzCMTwz1jJ-XiaiS7v9MwEf_8j1wo7qm39Dcxb0zgIjIfYZhznmWIJHy-OQMzwDGo=w640-h480>)
- [图片](<https://blogger.googleusercontent.com/img/a/AVvXsEi9sSVYZFaXBVnzyDY7JFKH_PXSKFgPuwiMEbao5G14IOvU-iLHJrnENqK6IYsVb6U9Vi5q0bEWB8LmhpI_hzExGMppLnKwk6edb43TZCITUdk2LJZdwjIQ790SRRuZ5hS5Gss0dhtdFItcaKf4A_kVmcP7VCyZC0E08_AEfe3_dv-3qnnlgMh4_z_whEw=w640-h374>)
