---
publish: true
content_type: "post"
title: "Writ update: tool-time approval gates, persistent decision memory, and task-specific retrieval"
description: "Writ, previously shared for its retrieval engine that supplies relevant rules to Claude Code, has been updated with enforcement and persistent memory. The author now describes it as a local governance, context, and continuity runtime. Its a"
date: "2026-10-09T02:25:09.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x19od6/writ_update_tooltime_approval_gates_persistent/"
tags: ["source/reddit","topics/agents","topics/coding"]
---

Writ, previously shared for its retrieval engine that supplies relevant rules to Claude Code, has been updated with enforcement and persistent memory. The author now describes it as a local governance, context, and continuity runtime. Its architecture is Claude Code hooks connecting to a local Python daemon that manages retrieval and workflow state, with Neo4j storing knowledge and decision records. It requires Python 3.11+ and Docker.

In Work mode, two acceptance gates come before implementation writes: first an approved plan, then approved test skeletons. The hooks check attempted writes, including supported shell-write patterns, and refuse a write if approval is missing. Approval comes from the user's typed response using a one-time token, so the agent cannot advance the gate just by claiming approval. There are also checks for plan drift, project boundaries, credential paths, and for source edits before a documented root cause in Debug mode. The author notes an important limit: the test-skeleton gate only checks that a qualifying test exists; it does not prove the assertions are good or the implementation correct.

Persistent memory preserves project memory and decision provenance across sessions, including approved plans, governing rule IDs, changed files, commits, and the reasoning behind changes, so a later session can learn why an approach was chosen instead of inferring intent from the current code.

The retrieval layer supplies relevant rules, methodology, and past decisions based on the current task, file, tool, and workflow phase. The author's main design lesson is to keep workflow authority in code while using retrieval to give Claude the information it needs to work within that workflow; retrieving an instruction does not automatically make it an enforced requirement. The author invites feedback from people already using hooks or persistent memory.
