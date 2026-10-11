---
publish: true
content_type: "post"
title: "breakaway: a task board and engineering department for your Claude Code agents"
description: "breakaway began as a task board for one developer and their coding agents, where the agents claim work and the human merges it, and has since grown into what the author calls an engineering department that never clocks off, spanning the pat"
date: "2026-10-09T12:18:31.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1juz2/meet_breakaway_an_engineering_department_for_you/"
tags: ["source/reddit","topics/agents","topics/coding","topics/products"]
---

breakaway began as a task board for one developer and their coding agents, where the agents claim work and the human merges it, and has since grown into what the author calls an engineering department that never clocks off, spanning the path from an idea to what runs in production. The stated division of labor is that agents claim, build, diagnose and propose, while the human merges, deploys, approves and starts agents; nothing merges or deploys on an agent's word.

Planning: a rough idea is shaped by an agent into a spec and tasks, or Kickoff starts a project from nothing by asking plain questions and setting up a private repository whose plan the user merges. Tasks carry areas, priorities and horizons &#40;now, next, later&#41; and can depend on each other, including across repositories. Building: claiming is atomic, so two agents never take the same task; Claude Code cloud agents start from the board and stream output onto the task, while local sessions join through the CLI, MCP server or Claude Code plugin. Pressing Chase starts an agent on every ready task within user-set caps, a fix agent is sent when a pull request conflicts or fails checks, and agents running at the same time check in before touching files, agree on ordering and can call a huddle.

Shipping and operations: a deploy flow handles deploy, promote and roll back, each started manually. Version 2.0 adds Architect: connecting Cloudflare with a read-only token shows each environment's contents, health and estimated cost against a budget, agents propose infrastructure changes by pull request with a plan showing what changes, what it costs and whether it can be undone, and approval from a phone triggers a workflow in the user's own repository to apply it. Envelopes are limits approved once, such as 2 to 10 instances or 3 restarts a day, within which the board scales and restarts before reporting. Incidents open as tasks in the repository that owns what broke, and a runbook can start an agent to diagnose and propose a fix; only production incidents push to the phone. Routines run agents on schedules such as a weekly changelog or nightly dependency check, or on events such as a merged pull request, failed workflow, opened issue, failed plan or crossed budget, pinging the inbox when a human is needed.

The board is said to hold no write credentials for the user's infrastructure and to run on the user's own Cloudflare account, with no hosted version, accounts or telemetry; setup is one prompt pasted into Claude Code. On licensing, since 2.0 the project uses the PolyForm Noncommercial License 1.0.0: free for personal and noncommercial use, including individuals, hobbyists, charities, schools and public bodies, with commercial exceptions granted free and case by case to worker cooperatives and digital rights and privacy groups but never to venture-funded companies; there is no price or paid tier and the source is public.
