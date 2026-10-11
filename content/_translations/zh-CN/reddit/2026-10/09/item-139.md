---
publish: true
content_type: "post"
title: "在 Strata（Qwen3.8-next-flash）网页界面中启用文件读写与执行类工具调用"
description: "一位用户在个人电脑上安装了 Strata 与 Qwen3.8-next-flash，表示对模型效果印象深刻，但找不到任何可启用或添加工具调用的设置，无法让助手在本地读取、写入和执行文件，因此询问在 Strata 中该如何实现。 在更新中，该用户表示按照他人建议改用 harness（智能体外壳）而非在 Strata 网页界面里配置工具调用，结果非常喜欢 DeepSeek harness，并称其运行良好。就本条内容而言，帖子并未给出 Strata 工具调用配置的技术说明。 这条内"
date: "2026-10-09T03:32:08.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1ayz2/how_is_it_possible_to_enable_tool_calling_like/"
tags: ["source/reddit","topics/agents","topics/coding"]
---

一位用户在个人电脑上安装了 Strata 与 Qwen3.8-next-flash，表示对模型效果印象深刻，但找不到任何可启用或添加工具调用的设置，无法让助手在本地读取、写入和执行文件，因此询问在 Strata 中该如何实现。

在更新中，该用户表示按照他人建议改用 harness（智能体外壳）而非在 Strata 网页界面里配置工具调用，结果非常喜欢 DeepSeek harness，并称其运行良好。就本条内容而言，帖子并未给出 Strata 工具调用配置的技术说明。

这条内容的价值主要在于用户体验层面：在该网页界面中，本地文件操作的工具执行并不容易被发现，而外部 harness 满足了这一需求。
