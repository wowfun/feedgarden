---
publish: true
content_type: "post"
title: "solo 开发者用 Opus 5.5 + Godot 4 天做出可玩恐怖关卡，简直离谱"
description: "一位有 3D 与游戏引擎经验但编程知识有限的 solo 开发者，在四天内做出了一款可玩的恐怖关卡，灵感来自《寂静岭》与《零》，全程使用 Opus 5.5、Godot 与 AI 生成的 3D 资产，且没有任何手动代码编辑。技术栈为：通过 Claude Desktop 的 Code 模式（Auto 开启）使用 Claude Opus 5.5 进行编码；Meshy T2.5 与 Blender 处理 3D 资产；Nano Banana 生成图像与纹理；Godot 4.5.1 ..."
date: "2026-11-02T23:47:43.000Z"
updated: "2026-11-04T16:00:39.769Z"
first_seen: "2026-11-04T16:02:55.217Z"
date_basis: "published"
feed_source: "reddit"
feed_source_id: "t3_1xmdih0"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1xmdih0/a_solo_developer_built_this_in_4_days_with_opus/"
tags: ["source/reddit","topics/models","topics/coding","topics/computer-graphics"]
---

一位有 3D 与游戏引擎经验但编程知识有限的 solo 开发者，在四天内做出了一款可玩的恐怖关卡，灵感来自《寂静岭》与《零》，全程使用 Opus 5.5、Godot 与 AI 生成的 3D 资产，且没有任何手动代码编辑。技术栈为：通过 Claude Desktop 的 Code 模式（Auto 开启）使用 Claude Opus 5.5 进行编码；Meshy T2.5 与 Blender 处理 3D 资产；Nano Banana 生成图像与纹理；Godot 4.5.1 作为引擎。工作流偏对话式：用纯文本描述想要的内容，让 Opus 执行，然后在场景中摆放、调整完成的资产，新想法又会引出进一步的提示。Pinterest 参考图提供了视觉方向，Opus 负责编辑文件、启动 Godot、截图并迭代；它通过代码搭建更大的结构并协助道具摆放，而开发者继续塑造场景。对于小资产，Nano Banana 一次生成包含十个道具的图像；Meshy AI T2.5 的 Low Poly 模式将其转为轻量 3D 模型，在 Blender 中分离后导入 Godot，无需重建网格。每组十道具共享一个材质与一张纹理图集，简化材质设置并避免不必要的几何开销。约 100 个道具分十批创建，节省了大量准备时间，同时保持场景高效。到第二天，关卡外观已接近最终展示；剩余时间用于打磨与实验，其中部分想法后来被放弃。成本方面为 Claude Pro 订阅，核心构建的 API 等价用量约 90 美元，包含后续实验约 180 美元。开发者表示整个过程非常有趣，把想象中的空间变成可实际行走游玩的场所令人满足。

## 媒体

![图片: A Solo Developer Built This in 4 Days With Opus 5.5 + Godot. This Is Getting Ridiculous](<https://external-preview.redd.it/ZDY0dDcybDlkYXpoMayc8jaO5cH_nsyVLfq1kjhS9XTATUAyKfSdo-EQwVDm.png?width=640&crop=smart&auto=webp&s=d6f4fc84bc8e07bcb2ac0291b80d487ce0858aeb>)

[图片: A Solo Developer Built This in 4 Days With Opus 5.5 + Godot. This Is Getting Ridiculous](<https://external-preview.redd.it/ZDY0dDcybDlkYXpoMayc8jaO5cH_nsyVLfq1kjhS9XTATUAyKfSdo-EQwVDm.png?width=640&crop=smart&auto=webp&s=d6f4fc84bc8e07bcb2ac0291b80d487ce0858aeb>)
