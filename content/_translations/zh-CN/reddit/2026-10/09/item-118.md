---
publish: true
content_type: "post"
title: "我基于 Haiku 5.5（或 Jev）做了一个按提示词选择 effort 的 Claude Code 模组（还有更多）"
description: "作者发布了 effortless，这是一个免费、MIT 许可的 Claude Code 模组，会在输入框上方加一条状态栏。它用 Haiku 5.5（如果你有 TypeSafe 密钥则用 Jev）读取每条提示词并设定 effort 级别。对于它判断为简单的提示词，可以把该条单独交给 Haiku 5.5 运行，而不使用当前对话的模型，对话及其缓存保持不变。该状态栏还会在提示词缓存变冷时发出警告，并在你转向新任务时提供交接提示。 该模组是在 Claude Code 会话中构建..."
date: "2026-10-09T02:06:15.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x19b2c/i_built_a_claude_code_mod_on_haiku_55_or_jev_that/"
tags: ["source/reddit","topics/coding","topics/models","topics/inference"]
---

作者发布了 effortless，这是一个免费、MIT 许可的 Claude Code 模组，会在输入框上方加一条状态栏。它用 Haiku 5.5（如果你有 TypeSafe 密钥则用 Jev）读取每条提示词并设定 effort 级别。对于它判断为简单的提示词，可以把该条单独交给 Haiku 5.5 运行，而不使用当前对话的模型，对话及其缓存保持不变。该状态栏还会在提示词缓存变冷时发出警告，并在你转向新任务时提供交接提示。

该模组是在 Claude Code 会话中构建的，作者负责引导并在桌面应用中测试每次构建；Claude 也负责剪了发布视频并撰写了文案。它已在桌面应用中测试，与 Anthropic 没有关联。

基于作者自身约 8 万次请求的发现：缓存读取约占总成本的 76%，而输出只占 8%。effort 主要影响一条提示词发起多少次工具调用，而不是回答有多长。切换 effort 时，Opus 5.5 和 Sonnet 5.5 的缓存会保留，但在 Fable 5.1 和更早的 Opus 上，它会重写 56% 到 100% 的缓存，因此 Auto 在这些模型上会暂停处理。像问题之后的“yes”这类简短回复一开始会骗过判断器，现在它们总是会交给判断器。

## 媒体

![图片: I built a Claude Code mod on Haiku 5.5 &#40;or Jev&#41; that picks the effort per prompt &#40;and much more&#41;](<https://external-preview.redd.it/aTVlaTF1b2RuY3VoMSYWjCud8Y8dwaV_zx-an4kuhljuv4hFLFyzbcN-ehEi.png?width=640&crop=smart&auto=webp&s=2ea1d754c414433c472f268721696cc1c7b3b600>)

[图片: I built a Claude Code mod on Haiku 5.5 &#40;or Jev&#41; that picks the effort per prompt &#40;and much more&#41;](<https://external-preview.redd.it/aTVlaTF1b2RuY3VoMSYWjCud8Y8dwaV_zx-an4kuhljuv4hFLFyzbcN-ehEi.png?width=640&crop=smart&auto=webp&s=2ea1d754c414433c472f268721696cc1c7b3b600>)
