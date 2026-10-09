---
publish: true
content_type: "post"
title: "Fable 5.1 在 Claude Cowork 中结果不同，疑似新检查点"
description: "一位 Reddit 用户称，经过连续几天的观察，他发现被称为 Fable 5.1 的模型在不同使用位置表现不同。他怀疑要么后台路由到了更新的检查点，要么这只是个非常奇怪的巧合。 具体观察包括：在 Claude Cowork 中添加带有本地文件夹的项目时，Fable 5.1 不知道“Tibo Reset Guy”；而在项目之外的普通聊天中询问同一模型时，它却知道。在 Claude Code 中，他表示 Fable 也不再认识 Tibo。第二项对比使用“鹈鹕测试”——要求输出一只"
date: "2026-10-09T12:05:18.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1jlk3/fable_51_different_results_in_claude_cowork_new/"
tags: ["source/reddit","topics/models","topics/evaluation"]
---

一位 Reddit 用户称，经过连续几天的观察，他发现被称为 Fable 5.1 的模型在不同使用位置表现不同。他怀疑要么后台路由到了更新的检查点，要么这只是个非常奇怪的巧合。

具体观察包括：在 Claude Cowork 中添加带有本地文件夹的项目时，Fable 5.1 不知道“Tibo Reset Guy”；而在项目之外的普通聊天中询问同一模型时，它却知道。在 Claude Code 中，他表示 Fable 也不再认识 Tibo。第二项对比使用“鹈鹕测试”——要求输出一只骑自行车鹈鹕的 SVG：开启高推理时结果不同，模型认识 Tibo；在 Cowork 的空项目中运行时模型不认识 Tibo，发帖者称后者的结果与 Claude Code 高推理输出一样糟糕。

发帖者认为差距太大，不可能是巧合，并询问是否有人观察到同样现象，同时猜测可能存在向更新版 Fable 的静默路由。该帖仅是一位用户附带截图的轶事性对比，并非受控评测，也未证实任何检查点变更。

## 图片与视频

- [图片: Fable 5.1: Different Results in Claude Cowork - NEW Checkpoint of Fable &#40;5.5&#41;?](<https://preview.redd.it/zgzfwqsejfuh1.png?width=140&height=105&auto=webp&s=b854e3a0fde50b573f492a534eccc6af38f91f4b>)
