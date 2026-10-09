---
publish: true
content_type: "post"
title: "I built a desktop app almost entirely with Claude Code, and this is how it went"
description: "A developer who runs several Claude Code sessions at once kept losing track of the one waiting for input, so they built Horadric, an app for Windows and macOS that shows each session as a small tile and turns it amber when Claude needs a de"
date: "2026-10-09T00:51:56.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x17tgx/i_built_a_desktop_app_almost_entirely_with_claude/"
tags: ["source/reddit","topics/coding","topics/products"]
---

A developer who runs several Claude Code sessions at once kept losing track of the one waiting for input, so they built Horadric, an app for Windows and macOS that shows each session as a small tile and turns it amber when Claude needs a decision. It is free, MIT licensed, and supports Windows 10 and 11 and macOS 11 or later.

Claude Code wrote almost all of the code. On Windows, Horadric is pure Rust drawing straight to Win32 and Direct2D, with no Electron and no UI framework; it sits at about 45 MB with four sessions open and uses no CPU between events. The author says they would not have taken raw Win32 on by hand. Development followed a per-project quest log, a plain Markdown checklist where clicking an item starts a Claude Code session on it, with the author writing the next item, a session picking it up, and the author reviewing what came back. The author sums up the split as making the calls on what the product is, while Claude made it exist.

The app reads state from hooks that Claude Code already fires rather than scraping the terminal to guess whether a session is busy or waiting, so a tile is correct the moment Claude asks for permission, and keeping the real command line as the interface avoids chasing Claude Code own updates. Current features include tiles grouped by project, a Ctrl+Alt+Space jump &#40;the Cmd+J shortcut on Mac&#41; to the longest-waiting session, a Windows notification when a session starts waiting, plain terminals beside the agents, and on Windows a browser pane, the 5-hour and weekly limits, and switching between Claude subscriptions with sessions resuming on the new one. The Mac app is new in 0.17.0 and has tiles, terminals and sessions that outlive the app, but not yet the browser pane, quest log or usage window. Sessions survive a crash, an update or a reboot. Builds are not code signed, so SmartScreen warns on first run, and the Mac app is not notarized.
