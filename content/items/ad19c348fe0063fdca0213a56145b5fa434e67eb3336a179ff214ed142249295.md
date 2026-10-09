---
publish: true
content_type: "post"
title: "I built a Claude Code mod on Haiku 5.5 (or Jev) that picks the effort per prompt (and much more)"
description: "The author released effortless, an MIT-licensed, free mod for Claude Code that adds a bar above the prompt. It uses Haiku 5.5, or Jev if you have a TypeSafe key, to read each prompt and set the effort level. For prompts it judges simple, it"
date: "2026-10-09T02:06:15.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x19b2c/i_built_a_claude_code_mod_on_haiku_55_or_jev_that/"
tags: ["source/reddit","topics/coding","topics/models","topics/inference"]
---

The author released effortless, an MIT-licensed, free mod for Claude Code that adds a bar above the prompt. It uses Haiku 5.5, or Jev if you have a TypeSafe key, to read each prompt and set the effort level. For prompts it judges simple, it can run that single prompt on Haiku 5.5 instead of the chat's model, leaving the chat and its cache in place. The bar also warns when the prompt cache goes cold and offers a handoff once you have moved on to something new.

The mod was built in Claude Code sessions with the author steering and testing each build in the desktop app; Claude also cut the launch video and wrote the copy. It was tested in the desktop app and is not affiliated with Anthropic.

Findings from about 80,000 of the author's own requests: cache reads were roughly 76% of the cost and output only 8%. Effort mostly changes how many tool calls a prompt makes rather than how long the answers are. Switching effort keeps the cache on Opus 5.5 and Sonnet 5.5, but on Fable 5.1 and older Opus it rewrote 56% to 100% of it, so Auto pauses there. Short replies such as "yes" after a question initially fooled the judge; now they always go to it.

## Images and video

- [Image: I built a Claude Code mod on Haiku 5.5 &#40;or Jev&#41; that picks the effort per prompt &#40;and much more&#41;](<https://external-preview.redd.it/aTVlaTF1b2RuY3VoMSYWjCud8Y8dwaV_zx-an4kuhljuv4hFLFyzbcN-ehEi.png?width=640&crop=smart&auto=webp&s=2ea1d754c414433c472f268721696cc1c7b3b600>)
