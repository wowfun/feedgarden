---
publish: true
content_type: "post"
title: "Qwen 3.6 35B appreciation post"
description: "A user writes an appreciation post for Qwen 3.6 35B, specifically Unsloth's UD_Q4_K_XL quantization. They are explicit about limits: it is an older model, it is not good at medium or even smaller coding projects, they would not hand it thei"
date: "2026-10-09T00:27:06.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x17brf/qwen_36_35b_appreciation_post/"
tags: ["source/reddit","topics/models","topics/agents","topics/hardware"]
---

A user writes an appreciation post for Qwen 3.6 35B, specifically Unsloth's UD&#95;Q4&#95;K&#95;XL quantization. They are explicit about limits: it is an older model, it is not good at medium or even smaller coding projects, they would not hand it their codebase, and it hallucinates like any other model. They also dislike most fine-tunes because they are almost all coding focused and lose general assistant ability to a surprising degree.

What the model does well, in their account, is broad general agentic action, with concrete examples: setting lights in the living room, pushing commands to a machine to start a movie, sending a grocery list to phone or watch on arrival at Walmart, daily reminders to clock in at work, relaying messages to family, and recalling project or pet details. They say it sometimes thrashes but stays on task and is fast enough that small mistakes do not matter. It even installed and ran a Minecraft mod pack on a different machine through the Prism Launcher AppImage, with SSH limited to machines on their tailnet.

Performance specifics are tied to their hardware: after adding a couple of Tesla P100s, they report roughly 120-140 tokens/s generation, about 1000 prompt processing at 0 context falling to about 700 by 13k. They note it is bad at holding a persona, unlike Gemma4, and worry a future 30-40B Qwen with 2-5B active parameters would be a coding-focused, overthinking release. They still pay Anthropic for coding work.
