---
publish: true
content_type: "post"
title: "Screencap gives Claude a memory of your screen activity"
description: "The poster's complaint was that agents need everything explained again, or expect to understand from the first go what the user wants them to know. To fix that, they built an open-source activity memory system about a year ago: it captur..."
date: "2026-10-16T16:37:32.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:50:02.940Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x7l3ck/i_gave_claude_a_memory_of_my_screen_activity/"
tags: ["source/reddit","topics/agent-memory","topics/open-source","topics/agents"]
---

The poster's complaint was that agents need everything explained again, or expect to understand from the first go what the user wants them to know. To fix that, they built an open-source activity memory system about a year ago: it captures the screen at frequent intervals, tries to understand and categorize the activity, groups it, and supplies relevant context to agents through MCP when needed. Yesterday the author rewrote it in Swift and moved categorization to System One; they say the new version works well with Claude, giving the project a second life, and decided to share it.

The project is MIT-licensed and available for download. The author says being open source makes personalization open-ended, with examples such as capturing voice input and identifying a user's weakest activity involvements. It also includes a minimal pop-up and a main app interface for browsing activity manually.

It can be connected from Settings → Agents, or by running the app's mcp install command for claude-code on macOS. The post does not describe how captured screen data is stored, retained or protected.
