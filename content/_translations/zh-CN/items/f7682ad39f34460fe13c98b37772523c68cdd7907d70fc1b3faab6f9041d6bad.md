---
publish: true
content_type: "post"
title: "开源、兼容 OpenAI 接口的 TTS 服务器：RTX 3080 上约 0.3 秒响应"
description: "一位开发者发布了一个基于 OmniVoice 的开源文本转语音服务器，对外提供与 OpenAI 兼容的 API，因此现有客户端几乎无需修改即可直接调用。作者给出的核心指标是：在 RTX 3080 上处理一句话的语音生成约需 0.3 秒，这是通过优化服务器、让生成尽快启动实现的。 该服务器还支持用一小段参考音频克隆音色。对于长文本，它按段落顺序逐段处理，而不是一次性生成整篇文档。作者表示默认设置已经调优，但用户仍可自行修改，例如 CFG（引导）系数。 作者自己的用途是把教科书转"
date: "2026-10-08T16:31:44.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0vld1/openaicompatible_tts_endpoint_using_omnivoice_03s/"
tags: ["source/reddit","topics/inference","topics/products"]
---

一位开发者发布了一个基于 OmniVoice 的开源文本转语音服务器，对外提供与 OpenAI 兼容的 API，因此现有客户端几乎无需修改即可直接调用。作者给出的核心指标是：在 RTX 3080 上处理一句话的语音生成约需 0.3 秒，这是通过优化服务器、让生成尽快启动实现的。

该服务器还支持用一小段参考音频克隆音色。对于长文本，它按段落顺序逐段处理，而不是一次性生成整篇文档。作者表示默认设置已经调优，但用户仍可自行修改，例如 CFG（引导）系数。

作者自己的用途是把教科书转换成用本人克隆音色朗读的有声书，方便开车时收听。项目称完全开源，可免费使用和修改，并附上代码仓库链接以及可以试听各音色的演示页面。该帖属于简短的自荐内容，除延迟数字外，并未提供基准测试方法、硬件对比或音质评测。

## 图片与视频

- [图片: OpenAI-compatible TTS endpoint using OmniVoice: 0.3s response time](<https://preview.redd.it/h1ulxjfzs9uh1.png?width=640&crop=smart&auto=webp&s=c9403ed92cf4f7a317f0fa6222617f07fd9f8640>)
