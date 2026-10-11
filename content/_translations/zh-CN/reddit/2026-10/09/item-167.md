---
publish: true
content_type: "post"
title: "做了一个 VS Code 扩展，用来减少被浪费的上下文和 token"
description: "一位开发者发布了 VIZZER，这是一款 VS Code 扩展，目标是减少使用 Claude 时被浪费的上下文和 token。其动机据称是公司提供的 Pro 套餐经常触达用量上限，以及在每个新会话中反复说明任务的繁琐——随着对话变长，很多已经无用的旧上下文仍会被一直带下去。 工作方式： - Vizzer 监控会话上下文，并在其变得庞大且不相关时向用户发出提醒。 - 随后它可以生成一份紧凑的交接内容，包含会话中重要的部分，例如目标、近期工作以及对文件的改动。 - 这份交接可以粘"
date: "2026-10-09T05:38:50.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1d7mj/built_a_vs_code_extension_to_reduce_wasted/"
tags: ["source/reddit","topics/coding","topics/products","topics/agents"]
---

一位开发者发布了 VIZZER，这是一款 VS Code 扩展，目标是减少使用 Claude 时被浪费的上下文和 token。其动机据称是公司提供的 Pro 套餐经常触达用量上限，以及在每个新会话中反复说明任务的繁琐——随着对话变长，很多已经无用的旧上下文仍会被一直带下去。

工作方式：
- Vizzer 监控会话上下文，并在其变得庞大且不相关时向用户发出提醒。
- 随后它可以生成一份紧凑的交接内容，包含会话中重要的部分，例如目标、近期工作以及对文件的改动。
- 这份交接可以粘贴到新会话中继续推进任务。

作者表示开发过程中用 Claude 来迭代这个扩展，并参考了 Anthropic 以及开源社区关于 Claude 行为的知识。文中给出的一个案例把 70k token 的上下文缩减到 28k。Vizzer 被描述为免费且开源，已在 VS Code 市场与 GitHub 上提供。文中没有提供独立基准测试或与其他上下文管理工具的对比。

## 图片与视频

- [图片: Built a VS code extension to reduce wasted context and tokens](<https://preview.redd.it/950f51h8pduh1.jpg?width=140&height=91&auto=webp&s=13d03eacfebbf3363c83c5dfb12aefc241c88890>)
