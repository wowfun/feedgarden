---
publish: true
content_type: "post"
title: "Ten things to build locally with Qwen 3.6 27B"
description: "There is excitement about Qwen 3.8, but this poster is still refining Qwen 3.6 27B locally with llama.cpp and dislikes how 3.8 talks. The author, who started in late May and has spent four-plus months learning, offers ten practical proje..."
date: "2026-10-16T21:35:36.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:47:52.494Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x7sq8e/10_things_you_maybe_didnt_know_you_can_do_with/"
tags: ["source/reddit","topics/coding","topics/agents","topics/open-source"]
---

There is excitement about Qwen 3.8, but this poster is still refining Qwen 3.6 27B locally with llama.cpp and dislikes how 3.8 talks. The author, who started in late May and has spent four-plus months learning, offers ten practical projects for newcomers; the provided excerpt covers the first seven.

The suggestions are: build small personal apps, such as a Notepad replacement with word processing, a side panel and light/dark modes; create a custom chat UI, possibly copying an existing design like Claude's; build ReAct loops so the model can call a tool, read the result and call again; and generate MCP tools rather than relying on third-party ones that may be unsafe. The model can also write a Python sub-agent spawner or an MCP tool that creates sub-agents on demand. Because MCP tools consume a lot of context, the author suggests handing work to a sub-agent with its own context window, effectively multiplying the main agent's context; retaining that across turns requires a pipeline runner.

A pipeline runner, similar to n8n, can be built with the model, with a custom or copied front end. Running several sequential agents each with its own context requires llama.cpp's cache-idle-slots setting, which swaps KV caches per turn and ejects the previous one to CPU RAM. Finally, a model launcher lets the user choose models and Jinja templates in llama.cpp, set parameters and save aliases for later launches.

## Media

![Image: 10 Things you maybe didn't know you can do with Qwen 3.6 27B right now. &#40;For Noobs&#41;](<https://preview.redd.it/xi91phrjwvvh1.png?width=140&height=117&auto=webp&s=e2bd9402e0e0ac1085dac3d6959844c8e153141c>)

[Image: 10 Things you maybe didn't know you can do with Qwen 3.6 27B right now. &#40;For Noobs&#41;](<https://preview.redd.it/xi91phrjwvvh1.png?width=140&height=117&auto=webp&s=e2bd9402e0e0ac1085dac3d6959844c8e153141c>)
