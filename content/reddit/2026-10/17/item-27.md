---
publish: true
content_type: "post"
title: "A 61 KB HTML file renders a real-time WebGPU ocean simulation"
description: "A developer using Claude Code with Opus 5.5 has published a real-time ocean simulation contained in a single 61 KB HTML file. The scene renders a sunset ocean in the browser through WebGPU, with an FFT-based wave simulation, whitecaps, a..."
date: "2026-10-16T23:24:42.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:50:02.940Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x7v7gj/this_is_61_kb_html_file/"
tags: ["source/reddit","topics/coding","topics/computer-graphics"]
---

A developer using Claude Code with Opus 5.5 has published a real-time ocean simulation contained in a single 61 KB HTML file. The scene renders a sunset ocean in the browser through WebGPU, with an FFT-based wave simulation, whitecaps, a physically based sky with clouds and sun glitter. Users fly around with the mouse and WASD keys.

The author says the renderer was written from scratch from a single prompt asking for the most realistic water scene possible in WebGPU with a floating camera, without an engine or libraries. The work took about 30 minutes. To avoid judging its own output, the agent took screenshots and had separate subagents critique them.

The demo is free to try, preferably in Chrome. It requires a WebGPU-capable GPU; on laptops, Chrome must be forced onto the dedicated GPU or performance may be poor or the page may not run. On an RTX 5070 Ti, the author reports about 260 FPS at 2560×1440. Clicking the canvas enables looking around, WASD moves, and H opens a settings panel. A linked repository contains an unminified, more organized version.

## Media

![Image: This is 61 KB HTML file 🤯](<https://external-preview.redd.it/YnN3bnFsdjB5d3ZoMRJy8ktkrENMwFs2mSpDVAH5vpc3thEy2iqFXx5AN9T6.png?width=640&crop=smart&auto=webp&s=91b6fb56e7cdddeed2f0e25c4a2aae22b55bc5d1>)

[Image: This is 61 KB HTML file 🤯](<https://external-preview.redd.it/YnN3bnFsdjB5d3ZoMRJy8ktkrENMwFs2mSpDVAH5vpc3thEy2iqFXx5AN9T6.png?width=640&crop=smart&auto=webp&s=91b6fb56e7cdddeed2f0e25c4a2aae22b55bc5d1>)
