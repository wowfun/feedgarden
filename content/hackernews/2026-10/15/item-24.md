---
publish: true
content_type: "post"
title: "OpenCode 2.0"
description: "Commenters are largely positive but disagree over what is actually new and what it costs. One long-time V2 user praises usability, the client/server model, and the agent's ability to edit its own configuration and write plugins. They als..."
date: "2026-10-14T20:48:24.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://anoma.ly/notes/opencode-2-0/"
discussion_url: "https://news.ycombinator.com/item?id=50094994"
tags: ["source/hackernews","topics/coding","topics/agents","topics/security-privacy"]
---

## HN discussion

Based on 10 selected comments and replies.

Commenters are largely positive but disagree over what is actually new and what it costs. One long-time V2 user praises usability, the client/server model, and the agent's ability to edit its own configuration and write plugins. They also highlight the project's GitHub issue workflow: a connected app reads a bug report, tests the reported version and the latest dev branch, and comments findings with a reproduction script, recording a video for TUI bugs.

A reply pushes back on the client/server framing, noting it existed in V1 and that only the default changed, and that two different commands still start distinct services. Another commenter lists concrete improvements: automatic reload of skills and plugins, backgroundable tasks, a built-in skill for editing configuration, front-end polish, better sub-session communication, and per-session configuration loading rather than server-startup configuration. They note the loop was reportedly re-architected around Effect.

Dissent focuses on risk. One user says V2 has more annoyances and switched harnesses, calling hot-reload of plugins by an agent a security misalignment. Another asks whether OpenCode offers something like Claude Code's auto permission mode, since approving every command breaks flow, and a reply says they run the unrestricted mode inside a virtual machine instead. Others welcome the "everything is a plugin" direction and note that many V1 workarounds are now native features.

Selected comments: [ghrl](https://news.ycombinator.com/item?id=50099588) · [c-hendricks](https://news.ycombinator.com/item?id=50103728) · [solarkraft](https://news.ycombinator.com/item?id=50096138) · [verdverm](https://news.ycombinator.com/item?id=50096829) · [moretti](https://news.ycombinator.com/item?id=50100763) · [Lucasoato](https://news.ycombinator.com/item?id=50100234)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50094994>)
