---
publish: true
content_type: "post"
title: "为什么在 Claude Code 中无法安全存储 Anthropic 自家 API 的密钥？"
description: "一位开发者描述了使用 Claude Code 进行开发工作时遇到的安全缺口。他经常需要让 Claude 运行评测或临时测试提示词与模型，最简便的做法是把 API 密钥交给对话线程使用，但这样既靠手工操作，也不够安全。在创建密钥时，他不断被提示使用 Federated Identity（联合身份），但 Claude Code 并不在受支持的平台之列。 他还提到，最近 Projects 和 Cloud Environments 新增了 Network Secrets，这本来也像是"
date: "2026-10-09T08:44:01.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1g59v/why_is_anthropic_the_one_service_i_cant_store_api/"
tags: ["source/reddit","topics/security-privacy","topics/coding","topics/industry"]
---

一位开发者描述了使用 Claude Code 进行开发工作时遇到的安全缺口。他经常需要让 Claude 运行评测或临时测试提示词与模型，最简便的做法是把 API 密钥交给对话线程使用，但这样既靠手工操作，也不够安全。在创建密钥时，他不断被提示使用 Federated Identity（联合身份），但 Claude Code 并不在受支持的平台之列。

他还提到，最近 Projects 和 Cloud Environments 新增了 Network Secrets，这本来也像是合适的方案，但 api.anthropic.com 不在允许的目标范围内。他发问：为什么偏偏 Anthropic 自己是那个无法安全存储密钥的平台。他目前的替代方案是一个自定义 GitHub Action，但他表示这对临时性测试并不好用。
