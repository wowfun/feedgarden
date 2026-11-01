---
publish: true
content_type: "post"
title: "cheapAg : My Opus was hitting limits on boilerplate, so I made a $0.005 model do the typing"
description: "A developer describes “Cheap Agent,” an MCP server and plugin for Claude Code that offloads boilerplate to a cheap model (DeepSeek V4.1 Flash via OpenRouter, about $0.005 per task) while Opus plans and reviews. The cheap model writes cod..."
date: "2026-10-30T20:37:04.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T16:38:28.082Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1xjqoi0/cheapag_my_opus_was_hitting_limits_on_boilerplate/"
tags: ["source/reddit","topics/coding","topics/agents"]
---

A developer describes “Cheap Agent,” an MCP server and plugin for Claude Code that offloads boilerplate to a cheap model &#40;DeepSeek V4.1 Flash via OpenRouter, about &#36;0.005 per task&#41; while Opus plans and reviews. The cheap model writes code in a git worktree and must produce a test that fails before the fix and passes after; Cheap Agent runs the test itself and only passing work lands uncommitted for review, with a Sonnet helper as fallback if it gets stuck. On SWE-bench Verified &#40;Opus 5.5, same prompts&#41;, adding a feature used 154k to 57k Opus tokens &#40;63% less&#41;; seven everyday bug fixes saw 59% less with all seven solved by both approaches; nine of the hardest bugs saw 55% less but 6 of 9 solved versus 7 of 9 for Opus alone. It is less helpful on tiny jobs where Opus is already quick. The tool is MIT-licensed and free; the cheap model runs on the user's own API key, and code is sent to the provider only after per-project permission. Savings depend on the repository having a test command. The project was built with Claude Code, including self-hosting via Cheap Agent.

## Media

![Image: cheapAg : My Opus was hitting limits on boilerplate, so I made a &#36;0.005 model do the typing](<https://preview.redd.it/h0hb476y0oyh1.gif?width=640&crop=smart&s=0cf18108ec2d49f1a97cc920175ea456bdf64f70>)

[Image: cheapAg : My Opus was hitting limits on boilerplate, so I made a &#36;0.005 model do the typing](<https://preview.redd.it/h0hb476y0oyh1.gif?width=640&crop=smart&s=0cf18108ec2d49f1a97cc920175ea456bdf64f70>)
