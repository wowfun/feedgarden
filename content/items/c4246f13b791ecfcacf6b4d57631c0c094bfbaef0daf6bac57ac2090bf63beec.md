---
publish: true
content_type: "post"
title: "Built a VS Code extension to reduce wasted context and tokens"
description: "A developer has released VIZZER, a VS Code extension aimed at cutting wasted context and tokens when working with Claude. The stated motivation is hitting usage limits on a company-provided Pro tier and the tedium of re-explaining tasks in "
date: "2026-10-09T05:38:50.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1d7mj/built_a_vs_code_extension_to_reduce_wasted/"
tags: ["source/reddit","topics/coding","topics/products","topics/agents"]
---

A developer has released VIZZER, a VS Code extension aimed at cutting wasted context and tokens when working with Claude. The stated motivation is hitting usage limits on a company-provided Pro tier and the tedium of re-explaining tasks in each new chat, since conversations carry forward old context that is no longer useful as they grow.

How it works:
- Vizzer monitors the session context and alerts the user when it becomes large and irrelevant.
- It can then build a compact handoff containing the important parts of a session, such as the goal, recent work, and file changes.
- That handoff can be pasted into a new chat to continue the task.

The author says Claude was used during development to iterate on the extension, along with Anthropic and open-source knowledge about Claude behavior. One cited task reduced a 70k-token context to 28k. Vizzer is described as free and open source, and is available on the VS Code marketplace and GitHub. No independent benchmarks or comparisons with other context-management tools are offered.

## Images and video

- [Image: Built a VS code extension to reduce wasted context and tokens](<https://preview.redd.it/950f51h8pduh1.jpg?width=140&height=91&auto=webp&s=13d03eacfebbf3363c83c5dfb12aefc241c88890>)
