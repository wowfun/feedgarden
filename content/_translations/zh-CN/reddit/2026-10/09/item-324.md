---
publish: true
content_type: "post"
title: "Opus 5.5 用约 3 天做出我那个 Road Rash × DiRT 混合游戏的车辆和物理，但没能搞定越野摩托"
description: "一位拥有约 25 年游戏经验的开发者（多数在 AAA，如今做独立开发）用几天时间测试 Claude 能把一款真实游戏做到什么程度，目标是做一款 1991 年《Road Rash》与类似 DiRT 的拉力赛游戏的混合体。Opus 5.5 承担了大部分重活，产出了 4 种车辆、物理效果、漂移加速、跳台，以及用来替代《Road Rash》链条的火箭。 最难的部分是让模型理解轮胎和减震器应如何贴着地面运动，同时保持游戏有趣、有街机感。作者说它总往写实方向跑，而在全速冲上跳台时，写实恰"
date: "2026-10-09T14:06:46.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1mb45/opus_55_built_the_vehicles_and_physics_for_my/"
tags: ["source/reddit","topics/models","topics/products","topics/coding"]
---

一位拥有约 25 年游戏经验的开发者（多数在 AAA，如今做独立开发）用几天时间测试 Claude 能把一款真实游戏做到什么程度，目标是做一款 1991 年《Road Rash》与类似 DiRT 的拉力赛游戏的混合体。Opus 5.5 承担了大部分重活，产出了 4 种车辆、物理效果、漂移加速、跳台，以及用来替代《Road Rash》链条的火箭。

最难的部分是让模型理解轮胎和减震器应如何贴着地面运动，同时保持游戏有趣、有街机感。作者说它总往写实方向跑，而在全速冲上跳台时，写实恰恰不是你想要的。画面方面使用了 Astra 6：给出一张标杆画面的截图，要求达到其质量的至少 90%，在 5 张地图中的大部分上跑了 3 到 4 小时。随后关卡由开发者在本人的编辑器中手工调整。音乐来自 Sandscape 和 ElevenLabs，Sandscape 负责多人对战和排行榜。

作者本以为最有趣的越野摩托，最后却成了最粗糙的部分，目前仍在迭代。这个结果建立在约三天的 AI 辅助工作之上，而不是完全自主开发：车辆和物理由模型完成，但关卡调优和迭代仍需人工。

## 图片与视频

- [图片: Opus 5.5 built the vehicles and physics for my Road Rash x DiRT mashup in about 3 days. It couldn’t crack the dirt bike](<https://external-preview.redd.it/cmgwcXRmOWk3Z3VoMZlK4b85j9Bp6WL4r85-Y_mBifqLJwhEXHrvudZylmde.png?width=640&crop=smart&auto=webp&s=0262a27a11d063a66024a4667c95afb61dc6874d>)
