---
publish: true
content_type: "post"
title: "Muse Wonder 1.0 对比 DeepSeek V4.1 Flash：真实编码任务并排测试"
description: "一位开发者在相同机器和仓库上，用完全相同的快照起点，让 Meta 的 Muse Wonder 1.0（Muse Code CLI）和 DeepSeek V4.1 Flash（Codex CLI）分别执行同一个真实编码任务，并由独立评审员逐行检查结果。任务包括更新 LLM 文案提示词以支持产品 Reel 动画（从封闭列表中选择卡片、文本、镜头、高光、转场名称）、在验证中对未知名称和单品卡片做空值处理、将容器视频路径从 ffmpeg 场景管线切换到已有的 Remotion ..."
date: "2026-11-03T15:12:15.000Z"
updated: "2026-11-04T16:00:39.769Z"
first_seen: "2026-11-04T16:05:03.654Z"
date_basis: "published"
feed_source: "reddit"
feed_source_id: "t3_1xmvj0e"
source_url: "https://www.reddit.com/r/ChatGPTCoding/comments/1xmvj0e/muse_wonder_10_metas_muse_code_vs_deepseek_v41/"
tags: ["source/reddit","topics/coding","topics/models","topics/agents"]
---

一位开发者在相同机器和仓库上，用完全相同的快照起点，让 Meta 的 Muse Wonder 1.0（Muse Code CLI）和 DeepSeek V4.1 Flash（Codex CLI）分别执行同一个真实编码任务，并由独立评审员逐行检查结果。任务包括更新 LLM 文案提示词以支持产品 Reel 动画（从封闭列表中选择卡片、文本、镜头、高光、转场名称）、在验证中对未知名称和单品卡片做空值处理、将容器视频路径从 ffmpeg 场景管线切换到已有的 Remotion 合成、通过测试与类型检查、构建 Docker 镜像并在镜像内渲染示例产品，且证明过程中无付费 AI 调用。

Muse Wonder 总用时 47 分钟、中途需人工干预 1 次，全部 1728 个测试通过，但测试未能捕获两个真实 bug：将已有的背景移除函数复制后对同一产品重复处理（在 GPU 环境下成倍增加成本），以及未按规范传递任务 ID 作为随机种子导致相同标题的任务拿到相同“随机”动画。它还在提示词和校验器中各自硬编码了一份动画名称列表。DeepSeek V4.1 Flash 用时 29 分钟、零干预，1726/1728 测试通过，结构更简洁：将背景移除重构为单循环、按规范传入任务 ID 作为种子、从提示词模块统一导入校验列表并移除死代码，仅有 3 个小问题，在 15 分钟后续修复即可。两者最终生成的视频都正确且与批准参考一致，也都未越界修改文件。
