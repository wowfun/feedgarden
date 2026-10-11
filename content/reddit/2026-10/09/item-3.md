---
publish: true
content_type: "post"
title: "Open-source OpenAI-compatible TTS server with ~0.3s response on an RTX 3080"
description: "A developer released an open-source text-to-speech server built around OmniVoice that exposes an OpenAI-compatible API, so existing clients can point at it without changes. The stated headline figure is roughly 0.3 seconds to generate speec"
date: "2026-10-08T16:31:44.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0vld1/openaicompatible_tts_endpoint_using_omnivoice_03s/"
tags: ["source/reddit","topics/inference","topics/products"]
---

A developer released an open-source text-to-speech server built around OmniVoice that exposes an OpenAI-compatible API, so existing clients can point at it without changes. The stated headline figure is roughly 0.3 seconds to generate speech for a sentence on an RTX 3080, achieved by tuning the server so generation starts quickly.

The server also supports voice cloning from a short reference clip. For long inputs it processes text sequentially, paragraph by paragraph, rather than attempting the whole document at once. Settings are said to ship already tuned for good defaults, but the author notes they remain user-configurable, giving the example of the CFG &#40;guidance&#41; scale.

The author's own use case is converting school books into audiobooks narrated in their own cloned voice so they can listen while driving. The project is described as open source and free to use and modify, with a repository link and a demo page where the available voices can be heard. The post is a short self-promotion and does not report benchmark methodology, hardware comparisons, or quality evaluations beyond the latency figure.

## Images and video

- [Image: OpenAI-compatible TTS endpoint using OmniVoice: 0.3s response time](<https://preview.redd.it/h1ulxjfzs9uh1.png?width=640&crop=smart&auto=webp&s=c9403ed92cf4f7a317f0fa6222617f07fd9f8640>)
