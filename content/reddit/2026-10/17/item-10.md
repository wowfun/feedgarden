---
publish: true
content_type: "post"
title: "I built a free Windows widget for Claude usage limits with Claude Code — pixel Clawd reacts to your sessions"
description: "A developer has released a free, open-source Windows widget that shows Claude plan usage limits in a floating window and a system-tray icon. It mirrors the figures shown by /usage in Claude Code — current session, weekly and Fable limits..."
date: "2026-10-16T18:36:32.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:50:02.940Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x7o895/i_built_a_free_windows_widget_for_claude_usage/"
tags: ["source/reddit","topics/coding","topics/products","topics/open-source"]
---

A developer has released a free, open-source Windows widget that shows Claude plan usage limits in a floating window and a system-tray icon. It mirrors the figures shown by /usage in Claude Code — current session, weekly and Fable limits — and refreshes them every minute. It also lists running Claude Code sessions as working, waiting for input or idle, shows Anthropic service status and alerts users when a Claude Code update is available.

The widget runs claude -p "/usage" in headless mode, which returns server-side percentages for the existing login without calling the model, so it spends no tokens. Session information comes from the registry Claude Code keeps in &#126;/.claude/sessions. It is written in plain PowerShell 5.1 and WPF and requires nothing to be installed besides Claude Code.

A pixel character named Clawd reflects the data: it sleeps in a burrow when nothing is running, runs during active sessions, waves with a question mark when a session is waiting for input, sweats near the limit and lies belly-up at 100%. Hearts in the header show the session limit remaining.

The author says Claude Code helped build the roughly 3,000-line WPF application, splitting it into about 18 dot-sourced modules and writing a CLAUDE.md with load-order rules and PowerShell 5.1 quirks such as UTF-8 BOM requirements and the lack of the ?? operator. The public release adds an English interface with on-the-fly language switching, translated code comments and a recorder script that renders README GIFs from WPF with scripted fake data; recording them exposed an English-text layout bug that overlapped a header. The author warns that calling /usage from Git Bash turns it into a file path and sends it to the model as a prompt, so the widget invokes it only from PowerShell. The project is MIT-licensed, requires Windows 10/11 and a logged-in Claude Code installation, and is not affiliated with Anthropic.
