---
publish: true
content_type: "post"
title: "Prism, an Obsidian community plugin built end to end with Claude"
description: "A developer published Prism, a free, MIT-licensed Obsidian community plugin built entirely with Claude Code. The plugin turns a ```viz code block inside a note into a live chart, diagram, dashboard or formula. Chart.js, D3, Mermaid, KaTeX a"
date: "2026-10-09T06:49:14.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1ed4h/prism_a_obsidian_community_plugin_developed_end/"
tags: ["source/reddit","topics/products","topics/coding"]
---

A developer published Prism, a free, MIT-licensed Obsidian community plugin built entirely with Claude Code. The plugin turns a &#96;&#96;&#96;viz code block inside a note into a live chart, diagram, dashboard or formula. Chart.js, D3, Mermaid, KaTeX and three.js are bundled, so visualizations render offline, and data can be pulled from Markdown tables, frontmatter, tasks or CSV files stored in the vault. It is published in Obsidian's community directory and can be installed from Settings, then Community plugins, Browse, by searching for "Prism" by floorianmb.

The author reported building the whole project in about a week on a Pro plan, using mostly Opus 5.5 with some Sonnet 5.5 and Haiku 5.5. Claude reportedly got almost every requested feature right on the first attempt; the exceptions were quality-of-life details. One example: API requests from a note fired every time the block scrolled back into view, so the request timing had to be reworked. Claude also brought the code in line with Obsidian's community plugin requirements, and the plugin passed the automated review.

Because Claude cannot see what it renders, the author had Claude Code add a headless render command: Claude runs it on a note and receives errors with line numbers plus a PNG snapshot, then fixes the block and renders again. The repository includes a ready-made skill for Claude Code and Codex, and an examples folder that can be opened as a vault. The author notes the plugin does not require any AI to use, mentions support for embedding websites and calling APIs without iframes to lower the odds of being blocked, and welcomes feedback, bug reports and improvements to the included skill.

## Images and video

- [Image: Prism a obsidian community plugin developed end to end by Claude](<https://preview.redd.it/avwxc6h52euh1.jpg?width=140&height=53&auto=webp&s=c56557f6edcafb464b0f746829586bb4906e9288>)
