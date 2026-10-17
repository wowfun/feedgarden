---
publish: true
content_type: "post"
title: "Working on a tool to help Claude make good pixel art"
description: "The author is building a pixel-art DSL with a live viewer. The witch's cottage shown is 1,000 lines of code. Claude paints with code, so the author asked it to write a library containing all the functionality it usually needs when creati..."
date: "2026-10-15T02:55:21.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:05:18.966Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x6akki/working_on_a_tool_to_help_claude_make_good_pixel/"
tags: ["source/reddit","topics/coding","topics/generative-media","topics/agents"]
---

The author is building a pixel-art DSL with a live viewer. The witch's cottage shown is 1,000 lines of code. Claude paints with code, so the author asked it to write a library containing all the functionality it usually needs when creating pixel art, so it does not have to write all that tooling every time. The comparison offered is Aseprite, but for Claude.

The library includes mirroring, auto-outlines, palette swaps, reusable parts, scatter brushes, tilemaps, shadow and light layers, animation frames and lighting.

The command pxl serve opens a live browser viewer that replays every drawing step as Claude saves, so you can watch it paint. The scene in the video is one file: the cauldron bubbling, the fire, the candles, the cat and the frog are all animated.

To install it as a skill: git clone the claude-pxl repository into &#126;/.claude/skills/pxl-pixel-art, then ask Claude to draw something.
