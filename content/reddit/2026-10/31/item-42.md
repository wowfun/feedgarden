---
publish: true
content_type: "post"
title: "Two free Claude Code plugins: a delegating orchestrator and a pixel-art agent office"
description: "Developer ilkemerol released two free, MIT-licensed Claude Code plugins, foreman and foreman-vision, to address context bloat and lack of visibility when running multiple subagents. foreman turns the main session into an orchestrator tha..."
date: "2026-10-31T09:03:32.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T16:38:28.082Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1xk5de5/i_built_two_claude_code_skillsplugins_one_makes/"
tags: ["source/reddit","topics/agents","topics/coding"]
---

Developer ilkemerol released two free, MIT-licensed Claude Code plugins, foreman and foreman-vision, to address context bloat and lack of visibility when running multiple subagents. foreman turns the main session into an orchestrator that reads the plan, splits work, delegates each piece to a subagent and verifies results, but never edits files itself; all changes go through subagents so the main context keeps conclusions rather than file dumps. Independent tasks run in parallel, and an agent's “done” is treated as a claim until the main session reads the diff or runs checks. Only the main session spawns agents, enforced by a hook. The plugin is intended for multi-agent jobs, not one-file fixes or tight edit-test loops; enable with /foreman on or /foreman &lt;task&gt;. foreman-vision is a browser-based live view on 127.0.0.1 where every Claude Code session on the machine appears as a floor of a small office. Subagents walk to desks and show their current tool; an agent needing permission or an answer moves to a waiting room with a balloon. Clicking an agent shows recent tool calls and a live terminal, with Kanban and Hybrid views also available. Each plugin works independently. Requirements and limits: Claude Code only; both need bash and jq; foreman-vision also needs Node 22.18 or newer and curl. Tested on macOS and Windows &#40;Git Bash&#41;; Linux untested. foreman-vision reads hook events and transcripts already written to disk, and nothing leaves the machine except an answer to the main agent's question if replied via its pop-up. Install via the Claude plugin marketplace commands, restart Claude Code, then run /foreman-vision start.
