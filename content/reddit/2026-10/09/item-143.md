---
publish: true
content_type: "post"
title: "I made a small puzzle platformer with Claude Code in a week: MEOWCHA (free, browser)"
description: "For a game jam, a developer built MEOWCHA, a small puzzle platformer in which a cat pilots a large robot and each level turns on who goes where. It is free to play in the browser and desktop only, controlled with a keyboard; gamepad support"
date: "2026-10-09T03:50:22.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1bb0q/i_made_a_small_puzzle_platformer_with_claude_code/"
tags: ["source/reddit","topics/coding","topics/agents","topics/products"]
---

For a game jam, a developer built MEOWCHA, a small puzzle platformer in which a cat pilots a large robot and each level turns on who goes where. It is free to play in the browser and desktop only, controlled with a keyboard; gamepad support is experimental, and it cannot be played on phones or tablets.

Claude Code wrote all the code in Phaser and TypeScript and built the nine levels as text maps. The pixel art is also generated in code: the robot and the cat are scripts that place every pixel from a hand-picked palette. Automated testing was part of the loop, with every level having a scripted playthrough run in simulation, so a change that breaks a level fails a test within seconds.

The developer describes clear limits. The model cannot hear, so instead of judging audio it measured each sound's loudness. And a scripted playthrough proves a level is solvable but not that it is fun, so human playtests covered that gap. The developer directed the project, ran the playtests and decided what stayed.

This is a first-hand account of one week-long jam project, not a benchmark; the claims about speed and workflow are the author's own and no independent comparisons are given. The author offers to answer questions about the workflow.

## Images and video

- [Image: I made a small puzzle platformer with Claude Code in a week: MEOWCHA &#40;free, browser&#41;](<https://external-preview.redd.it/FmueUq99WvZP4u9DG271_yBzDYO5_CMDw52c2US0s1M.png?width=140&height=111&auto=webp&s=21730c3fa88cd306a1276112dab679ea841c8d9a>)
