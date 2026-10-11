---
publish: true
content_type: "post"
title: "Eron v1.4: native iOS client for Ollama and local models"
description: "A solo developer released Eron, a native iOS client for people running models on their own hardware (Ollama, vLLM, LM Studio) or bringing their own API keys. The pitch targets two complaints about existing iOS setups: Web UIs in mobile Safa"
date: "2026-10-08T16:41:23.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0vu9w/eron_v14_a_native_ios_client_for_ollama_local/"
tags: ["source/reddit","topics/products","topics/coding"]
---

A solo developer released Eron, a native iOS client for people running models on their own hardware &#40;Ollama, vLLM, LM Studio&#41; or bringing their own API keys. The pitch targets two complaints about existing iOS setups: Web UIs in mobile Safari dropping the stream when the screen locks or the user switches apps, and App Store clients charging subscriptions while routing prompts through their own cloud proxies.

Architecture points described for v1.4:

- Direct socket connection over HTTP/WebSocket straight to a local IP or a Tailscale/WireGuard node, with no intermediate server, no telemetry and no account.
- A rewritten streaming pipeline that renders tokens as raw chunks as the GPU emits them instead of waiting for sentence-sized buffers.
- Native streaming and collapsible rendering of reasoning blocks from models such as DeepSeek R1 and Qwen reasoning variants.
- Local iOS tool calling: when a local model supports function calling, the app bridges to Apple Reminders, Calendar events and HomeKit control from the prompt.
- Isolated project workspaces with persistent custom system prompts, intended to separate coding contexts from everyday chats.

A v1.4.1 update adds a native dual-screen layout for the upcoming iPhone Duo form factor. The app is a one-time &#36;2.99 purchase; the developer is offering 20 App Store promo codes to users who comment with their local setup. The author discloses being the sole developer and offers no benchmark or quality evidence for the claimed benefits.

## Images and video

- [Image: Eron v1.4: A native iOS client for Ollama &amp; local models with zero-buffer streaming, thinking tokens, and local Apple Home/Calendar tools](<https://preview.redd.it/mm9l54wmu9uh1.png?width=140&height=140&crop=1:1,smart&auto=webp&s=b3e5c50045e4279143be8d98c001d369b3eb84db>)
