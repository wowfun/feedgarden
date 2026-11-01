---
publish: true
content_type: "post"
title: "Prospero: A new coding harness for a more civilized age"
description: "Prospero is a newly announced coding harness built by a developer disappointed by existing offerings, which he argues are built on web stacks and consume gigabytes of RAM even though a harness at its core is essentially “curl glued to po..."
date: "2026-10-31T11:54:59.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://nullprogram.com/blog/2026/10/31/"
discussion_url: "https://news.ycombinator.com/item?id=50315226"
tags: ["source/hackernews","topics/coding","topics/agents"]
---

## Article

Prospero is a newly announced coding harness built by a developer disappointed by existing offerings, which he argues are built on web stacks and consume gigabytes of RAM even though a harness at its core is essentially “curl glued to popen&#40;&#41;.” Written in C++ with a snappy Dear ImGui docking interface, Prospero claims to use roughly two orders of magnitude fewer resources than other harnesses without sacrificing features, including dark mode support. It ships no built-in model providers; users supply their own via llama.cpp, an on-prem model, OpenRouter, or the Anthropic/OpenAI APIs &#40;Claude subscriptions are not supported&#41;. It supports the standard agent loop of tool calls for reading/writing files and running shell commands, plus subagents that can work in parallel or keep context clean, with inter-agent messaging. Agents can be deployed headlessly to other machines over SSH or plain WSL. The Professional Edition embeds engines for x86/x86-64 and ARM64 across macOS, Windows and Linux, including a Windows x86 engine that runs on Windows XP. A notable capability is desktop control: vision-capable models can “see” and interact with the GUI—clicking, typing, dragging—to test and debug applications live without per-app MCP assistance. Because the engine is lean and separable from the GUI, it can run fully headless and re-attach later, and may be suitable for driving fuzz campaigns without being killed by the Linux OOM killer. Configuration lives at &#126;/.config/prospero/prospero.ini, editable by hand or through a Settings page, with include support for other INI files or URLs &#40;URL includes are restricted in what they can set&#41;.

## HN discussion

Based on 10 selected comments and replies.

Commenters raised several themes. brainless &#40;with julesrms replying&#41; wanted a GUI harness with richer UX—clickable text, async answers to multiple questions, selective subagent orchestration—and julesrms shared his own GUI-centric harness, juggler. julesrms, a 30-year C++ veteran, questioned using C++ for an agent GUI, arguing web stacks handle markdown, HTML and text flow better; nico asked whether such capabilities could be ported to C/C++. nico also complained that CLI agents interrupt typing with Y/N prompts. bensyverson lamented that subsidized Claude subscriptions lock users into particular harnesses. keyle noted many developers now build their own harnesses, citing his own at about 4% of opencode's resources.

Selected comments: [brainless](https://news.ycombinator.com/item?id=50316615) · [julesrms](https://news.ycombinator.com/item?id=50316687) · [julesrms](https://news.ycombinator.com/item?id=50316753) · [nico](https://news.ycombinator.com/item?id=50318156) · [bensyverson](https://news.ycombinator.com/item?id=50316357) · [keyle](https://news.ycombinator.com/item?id=50316750)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50315226>)

## Media

![Image](<https://nullprogram.com/img/prospero/screenshot.png>)

[Image](<https://nullprogram.com/img/prospero/screenshot.png>)

![Image](<https://nullprogram.com/img/prospero/screenshot-dark.png>)

[Image](<https://nullprogram.com/img/prospero/screenshot-dark.png>)
