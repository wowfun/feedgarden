---
publish: true
content_type: "post"
title: "Eron v1.4：面向 Ollama 与本地模型的原生 iOS 客户端"
description: "一位独立开发者发布了 Eron，这是一款原生 iOS 客户端，面向在自己硬件上运行模型（Ollama、vLLM、LM Studio）或自带 API 密钥的用户。它针对现有 iOS 方案的两点痛点：移动 Safari 里的 Web UI 在锁屏或切换应用时会中断流式输出，且完全无法访问 iOS 原生 API；而多数应用商店客户端既推送订阅收费，又把用户提示词经由自家云端代理转发。 v1.4 描述的主要架构特性： - 直连套接字：通过 HTTP/WebSocket 直接连接本地 "
date: "2026-10-08T16:41:23.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0vu9w/eron_v14_a_native_ios_client_for_ollama_local/"
tags: ["source/reddit","topics/products","topics/coding"]
---

一位独立开发者发布了 Eron，这是一款原生 iOS 客户端，面向在自己硬件上运行模型（Ollama、vLLM、LM Studio）或自带 API 密钥的用户。它针对现有 iOS 方案的两点痛点：移动 Safari 里的 Web UI 在锁屏或切换应用时会中断流式输出，且完全无法访问 iOS 原生 API；而多数应用商店客户端既推送订阅收费，又把用户提示词经由自家云端代理转发。

v1.4 描述的主要架构特性：

- 直连套接字：通过 HTTP/WebSocket 直接连接本地 IP 或 Tailscale/WireGuard 节点，没有中间服务器、没有遥测、无需账号。
- 零缓冲流式输出：重写了流式管线，token 由 GPU 产出后即作为原始数据块渲染，而不是等待按句缓冲。
- 推理流：对 DeepSeek R1、Qwen 推理类模型等推理块提供原生流式与可折叠展示。
- 本地 iOS 工具调用：当本地模型支持函数调用时，可直接从提示词调用 Apple 提醒事项、日历事件和 HomeKit 智能家居控制。
- 工作区：彼此隔离的项目工作区，可持久化自定义系统提示词，用于把编程上下文与日常聊天分开。

v1.4.1 增加了针对即将推出的 iPhone Duo 形态的原生双屏布局。应用在 App Store 售价为一次性 2.99 美元；开发者提供 20 个兑换码，凡使用本地环境并留言说明所用模型/硬件的用户即可获赠。作者已声明自己是唯一开发者，但并未为其宣称的优势提供基准或质量证据。

## 图片与视频

- [图片: Eron v1.4: A native iOS client for Ollama &amp; local models with zero-buffer streaming, thinking tokens, and local Apple Home/Calendar tools](<https://preview.redd.it/mm9l54wmu9uh1.png?width=140&height=140&crop=1:1,smart&auto=webp&s=b3e5c50045e4279143be8d98c001d369b3eb84db>)
