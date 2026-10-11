---
publish: true
content_type: "post"
title: "Four changes that stopped Claude Code explainer videos looking generic"
description: "A team makes short explainer videos from code using Remotion, canvas and SVG, with Claude Code doing the drawing. For about a week every output looked the same — centered text on a gradient with shapes floating around — and changing the pro"
date: "2026-10-09T07:13:09.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1er1l/what_made_claude_codes_videos_stop_looking/"
tags: ["source/reddit","topics/content-provenance","topics/agents","topics/products"]
---

A team makes short explainer videos from code using Remotion, canvas and SVG, with Claude Code doing the drawing. For about a week every output looked the same — centered text on a gradient with shapes floating around — and changing the prompt barely helped. The author credits four changes with fixing it.

One written plan per video, produced before any code: the script with timings, a palette of about fifteen named colours, how things are drawn, and a short "never" list &#40;no circles as decoration, no text that pops in by itself, no object that does not belong to the scene&#41;. The session reads that file, and nothing else decides the look. Stills before a render: one still every two seconds on a single sheet, with instructions to open doubtful frames at full size and state what is wrong before fixing anything, which caught most of the ugliness before a full render was needed. Rendering the whole video in one go as one world, because building scene by scene made each scene adopt its own style. Anything simulated gets measured outside the renderer first — a three-second node script showed discs pouring into a jar were stacking in columns up the walls long before a frame existed.

The unresolved problem is sound, since the model cannot hear what it mixes. The author asks what belongs on others' "never" lists and whether anyone has a way to check audio beyond measuring loudness.
