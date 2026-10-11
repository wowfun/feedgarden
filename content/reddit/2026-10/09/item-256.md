---
publish: true
content_type: "post"
title: "no video editor, just claude code"
description: "A developer built \"scratchcat,\" a small scratchpad app, and produced its launch video entirely with Claude Code without opening a video editor. The video shown is version 63 of the effort. The author describes the capture approach: because "
date: "2026-10-09T10:52:52.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1i8qy/no_video_editor_just_claude_code/"
tags: ["source/reddit","topics/coding","topics/products","topics/content-provenance"]
---

A developer built "scratchcat," a small scratchpad app, and produced its launch video entirely with Claude Code without opening a video editor. The video shown is version 63 of the effort. The author describes the capture approach: because the app's interface is a web frontend, Claude Code does not screen-record it. Instead it mounts the real built app inside a web page with its backend swapped for a scripted mock, so every shot shows the actual app in exactly the state the scene requires.

Each scene is an HTML page, and the cursor movement, zooms and captions are code. A script drives headless Chrome through the scene frame by frame, and ffmpeg encodes the result, so every render is identical. Narration comes from ElevenLabs, generated as a single read and then cut into lines using its word timings, keeping voice and captions in step. The author says his contribution was the brief, the storyboard and a lot of notes on each pass, while Claude Code wrote the scenes and the tooling. He offers to go deeper on any part.

On the app itself: scratchcat is a scratchpad that keeps everything you clear in history, with on-device dictation using the Parakeet model, an offline grammar check, and find and replace. It is free to try as a 15-day trial with every feature on the Microsoft Store &#40;search "scratchcat", or via scratchcat.app&#41;. Mac and Linux versions are listed there for pre-order, and the author welcomes feedback from Windows users.

## Images and video

- [Image: no video editor, just claude code](<https://external-preview.redd.it/d2FwNnlzeGM1ZnVoMTX_VO95PfBM5aBmg-EGkDJGsrdJbGkTD-FPxzH3bORs.png?width=640&crop=smart&auto=webp&s=5d45c245206ad9992d2f203b925315114d935309>)
