---
publish: true
content_type: "post"
title: "Webhook 签名校验首次通过，之后每次真实调用都失败"
description: "一名开发者表示，他让 Claude Code 编写了一个 Flask 接口，用于接收 sync.so API 的 webhook 并校验 Sync-Signature 请求头。代码看起来没问题，curl 测试也通过了，但所有真实 webhook 都返回 400。 原因在于：代码先解析了 JSON 请求体，再对重新序列化后的内容做哈希，而签名实际是对时间戳、一个点号以及精确原始字节做 HMAC 运算。只要有一个键的顺序变化，签名就会失效。改用 request.get_data("
date: "2026-10-09T10:09:23.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1hi5b/claude_code_wrote_my_sync_so_webhook_receiver/"
tags: ["source/reddit","topics/coding"]
---

一名开发者表示，他让 Claude Code 编写了一个 Flask 接口，用于接收 sync.so API 的 webhook 并校验 Sync-Signature 请求头。代码看起来没问题，curl 测试也通过了，但所有真实 webhook 都返回 400。

原因在于：代码先解析了 JSON 请求体，再对重新序列化后的内容做哈希，而签名实际是对时间戳、一个点号以及精确原始字节做 HMAC 运算。只要有一个键的顺序变化，签名就会失效。改用 request.get&#95;data&#40;&#41; 后问题解决。

发帖者指出，这段代码虽然有问题，却写得很「自信」，并询问是否有人有提示词或 CLAUDE.md 中的写法能避免在校验前解析请求体。帖子只是一个简短的踩坑报告和求建议，并未给出解决方案。
