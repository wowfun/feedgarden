---
publish: true
content_type: "post"
title: "本地 AI 被低估的好处：速度"
description: "作者使用相同的 one-shot 提示词，对比了通过 Z.ai 官方订阅服务的 GLM 5.3 Flash 与在本地使用 Zcode harness 服务的同一模型。云端运行耗时 43 分 48 秒，输入 7,550,929 token、输出 117,980 token；本地运行耗时 10 分 24 秒，输入 9,744,552 token、输出 118,173 token。两次输出规模几乎相同，均为约 118,000 token，因此本地执行速度约快 4.2 倍；作者..."
date: "2026-11-03T04:31:23.000Z"
updated: "2026-11-04T16:00:39.769Z"
first_seen: "2026-11-04T16:00:42.305Z"
date_basis: "published"
feed_source: "reddit"
feed_source_id: "t3_1xmjipa"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1xmjipa/underrated_benefit_of_local_ai_speed/"
tags: ["source/reddit","topics/inference","topics/coding","topics/hardware"]
---

作者使用相同的 one-shot 提示词，对比了通过 Z.ai 官方订阅服务的 GLM 5.3 Flash 与在本地使用 Zcode harness 服务的同一模型。云端运行耗时 43 分 48 秒，输入 7,550,929 token、输出 117,980 token；本地运行耗时 10 分 24 秒，输入 9,744,552 token、输出 118,173 token。两次输出规模几乎相同，均为约 118,000 token，因此本地执行速度约快 4.2 倍；作者估算该任务仅节省 0.70 美元，但认为时间节省可支持每天交付数倍于前的代码量。所列配置包括两块 RTX Pro 6000 Workstation Edition 显卡、AMD Threadripper 9960X 处理器、128 GB DDR5 内存以及 NVIDIA FP4 量化。

## 媒体

![图片: Underrated benefit of Local AI: Speed](<https://external-preview.redd.it/ODhybjd6NjFzYnpoMeIRsU4la2LnP4zT_NVFgr3UEaMcfiHm3yuEnWZBg99u.png?width=640&crop=smart&auto=webp&s=6ef62b22ae7a10b2921450e4200f7711fb9ba463>)

[图片: Underrated benefit of Local AI: Speed](<https://external-preview.redd.it/ODhybjd6NjFzYnpoMeIRsU4la2LnP4zT_NVFgr3UEaMcfiHm3yuEnWZBg99u.png?width=640&crop=smart&auto=webp&s=6ef62b22ae7a10b2921450e4200f7711fb9ba463>)
