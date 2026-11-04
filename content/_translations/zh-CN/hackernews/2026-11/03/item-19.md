---
publish: true
content_type: "post"
title: "用于屏蔽 TechCrunch 自动播放视频的 uBlock Origin 过滤规则"
description: "cornfieldlabs 发布了一组 uBlock Origin 过滤规则，用于阻止 TechCrunch 文章在正文中间自动播放 JW Player 视频。仅隐藏播放器还不够，因为后台仍在运行；屏蔽其脚本可阻止加载，而外观规则可隐藏留下的空白容器。网络规则屏蔽来自 content.jwplatform.com、ssl.p.jwpcdn.com 和 connatix.com（后者提供浮动广告播放器）的脚本，并在 techcrunch.com 上使用两条外观选择器。这些..."
date: "2026-11-03T07:36:47.000Z"
updated: "2026-11-04T14:11:39.510Z"
first_seen: "2026-11-04T14:11:54.614Z"
date_basis: "published"
feed_source: "hackernews"
feed_source_id: "50349155"
source_url: "https://cornfieldlabs.github.io/posts/ublock-stop-techcrunch-autoplay-video/post.html"
discussion_url: "https://news.ycombinator.com/item?id=50349155"
tags: ["source/hackernews","topics/security-privacy"]
---

## 正文提炼

cornfieldlabs 发布了一组 uBlock Origin 过滤规则，用于阻止 TechCrunch 文章在正文中间自动播放 JW Player 视频。仅隐藏播放器还不够，因为后台仍在运行；屏蔽其脚本可阻止加载，而外观规则可隐藏留下的空白容器。网络规则屏蔽来自 content.jwplatform.com、ssl.p.jwpcdn.com 和 connatix.com（后者提供浮动广告播放器）的脚本，并在 techcrunch.com 上使用两条外观选择器。这些规则需要 Firefox 上的完整 MV2 版 uBlock Origin（而非 uBO Lite），通过 Dashboard → My filters 应用。作者指出，如果 TechCrunch 更换视频供应商，外观规则大概仍会隐藏容器，但需要新的网络规则来阻止音频。

## HN 热门讨论

根据 9 条选取的评论与回复整理。

评论者比较了阻止自动播放媒体的不同方法。ghtjason 表示 Firefox 内置的自动播放阻止对大多数网站有效，但 Aardwolf 回复称它会静音但视频仍播放，需要额外点击才能有声。thetallgeek 在任何电脑上第一件事就是安装 uBlock Origin，KellyCriterion 回忆起一位广告技术从业者承认用广告拦截器逃避自己公司投放的广告。Jakob 认为默认禁用 JavaScript 可以消除问题并让页面更快更干净。Good4boothee 指出手动屏蔽自动播放可能留下不可见但发声的视频，且过滤列表在网站变更后很快失效。

评论来源：[ghtjason](https://news.ycombinator.com/item?id=50349246) · [Aardwolf](https://news.ycombinator.com/item?id=50350746) · [thetallgeek](https://news.ycombinator.com/item?id=50349404) · [KellyCriterion](https://news.ycombinator.com/item?id=50349792) · [Jakob](https://news.ycombinator.com/item?id=50349524) · [Good4boothee](https://news.ycombinator.com/item?id=50350345)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50349155>)
