---
publish: true
content_type: "post"
title: "可移植的“记忆日志”格式，试图在 AI 模型间迁移上下文与技能"
description: "一位 Reddit 用户分享了其上月做的小项目：一种以纯 .txt 文件形式存在的可移植记忆格式，命名为 Memory Journal（记忆日志），外形像一张技能卡。它本质上是一段套在文本文件里的大型提示词；初期测试好于预期，随后又经过一个月多轮测试与改进。 该设计面向通用场景，既能处理闲聊会话也能处理技术会话，作者也承认有时会“跑偏”。其背后的理念是：只要 AI 知道上下文，它也能描述自己是如何做出某个成果的。除上下文外，该格式还追求可复现性，能够迁移技能与错误，并区分已验"
date: "2026-10-09T11:38:22.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1j2lx/i_made_a_portable_ai_memory_format_that_transfers/"
tags: ["source/reddit","topics/agents","topics/products"]
---

一位 Reddit 用户分享了其上月做的小项目：一种以纯 .txt 文件形式存在的可移植记忆格式，命名为 Memory Journal（记忆日志），外形像一张技能卡。它本质上是一段套在文本文件里的大型提示词；初期测试好于预期，随后又经过一个月多轮测试与改进。

该设计面向通用场景，既能处理闲聊会话也能处理技术会话，作者也承认有时会“跑偏”。其背后的理念是：只要 AI 知道上下文，它也能描述自己是如何做出某个成果的。除上下文外，该格式还追求可复现性，能够迁移技能与错误，并区分已验证、未验证和被证伪的事实。日志给写作的 AI 很大自由度，整体保持中立，并分为用途不同的 A/B/C 三个部分。

作者列举的能力包括：配合项目文件即可恢复工作。他举例说，某个 AI 写了一份关于 EGO 引擎 XML 文件转换的日志，读者仅凭日志就能复现该转换器；DeepSeek 4.1（deep think 模式）和 Claude Sonnet 5（high effort）都在第一次尝试就重建出转换器。他还指出，带有哲学色彩的日志会导致行为与用词发生漂移。

使用方式很简单：把这张“卡”给 AI，它便会生成文本形式的记忆日志；用户还可以附加指令，例如“给目标补充完成状态”或“不要写入某部分”。作者建议搭配能力强、带努力程度滑块的模型使用，并附上了日志格式本身和若干输出示例，包括 XML 转换器复现、一个模组开发日志以及若干闲聊日志。他也承认该格式并不完美。

## 图片与视频

- [图片: I made a portable AI memory format that transfers both context and skill](<https://preview.redd.it/19xcinownfuh1.png?width=140&height=60&auto=webp&s=995e384847331c3b0dc90718f1f9da78957b8e1d>)
