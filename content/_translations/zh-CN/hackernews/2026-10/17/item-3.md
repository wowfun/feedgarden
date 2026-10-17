---
publish: true
content_type: "post"
title: "JPEG XL 与 AVIF 在网页场景中的对比"
description: "评论者认为编码器的成熟度与格式设计同样重要。有人指出，libjxl 的最高压缩档位非常慢：照片文件只小 2–7%，截图和插画约小 25%，但编码要花 9–46 秒，是默认档的 50–180 倍，而 jixel 几秒就能得到相近结果；延迟很大程度来自 Butteraugli 感知误差指标的迭代优化。 另一位评论者主张耐心等待，回忆 LAME 花了多少年才成熟，而 WebP 早期的宣传最终只是把熟悉的 JPEG 伪影换成了新问题。一位批评者称示例 F1 图片显示 AVIF ..."
date: "2026-10-16T16:12:02.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:46:51.389Z"
date_basis: "published"
source_url: "https://jakearchibald.com/2026/jpeg-xl-vs-avif/"
discussion_url: "https://news.ycombinator.com/item?id=50120224"
tags: ["source/hackernews","topics/image-compression","topics/open-source"]
---

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论者认为编码器的成熟度与格式设计同样重要。有人指出，libjxl 的最高压缩档位非常慢：照片文件只小 2–7%，截图和插画约小 25%，但编码要花 9–46 秒，是默认档的 50–180 倍，而 jixel 几秒就能得到相近结果；延迟很大程度来自 Butteraugli 感知误差指标的迭代优化。

另一位评论者主张耐心等待，回忆 LAME 花了多少年才成熟，而 WebP 早期的宣传最终只是把熟悉的 JPEG 伪影换成了新问题。一位批评者称示例 F1 图片显示 AVIF 抹掉了车身的高光并替换成看似合理的内容，但有人回复说在 100% 缩放下看不出问题。还有评论者称，用更好的编码器能让文中那两张无损 JPEG XL 图片再小 30–39%；另一人多年用 AVIF 保存游戏截图，认为在同等文件大小下通常略优于 JPEG XL。

评论来源：[yhjc2692](https://news.ycombinator.com/item?id=50121870) · [ezst](https://news.ycombinator.com/item?id=50123118) · [PaulHoule](https://news.ycombinator.com/item?id=50121407) · [boogerlad](https://news.ycombinator.com/item?id=50121607) · [linolevan](https://news.ycombinator.com/item?id=50124160) · [theandrewbailey](https://news.ycombinator.com/item?id=50121822)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50120224>)
