---
publish: true
content_type: "post"
title: "Best practices for Claude Code"
description: "Anthropic's engineering guide describes Claude Code as an agentic coding environment rather than a chatbot: it can read files, run commands, make changes and work through problems autonomously while the user watches, redirects or steps a..."
date: "2026-10-15T15:01:41.455Z"
updated: "2026-10-15T15:41:45.488Z"
first_seen: "2026-10-15T15:01:41.455Z"
date_basis: "observed"
source_url: "https://www.anthropic.com/engineering/claude-code-best-practices"
tags: ["source/anthropic","topics/agents","topics/coding"]
---

Anthropic's engineering guide describes Claude Code as an agentic coding environment rather than a chatbot: it can read files, run commands, make changes and work through problems autonomously while the user watches, redirects or steps away. Instead of writing code and asking for review, the user describes the goal and the agent explores, plans and implements.

The guide argues most best practices follow from one constraint: the context window fills up fast, and model performance degrades as it fills. The window holds the entire conversation, including every message, every file the agent reads and every command output. A single debugging session or codebase exploration can generate and consume tens of thousands of tokens. As the window nears capacity, Claude may forget earlier instructions or make more mistakes, so the context window is framed as the most important resource to manage. The guide recommends tracking usage continuously with a custom status line and reducing token usage where possible.

The central practical advice is to give Claude a way to verify its own work: tests, a build, a linter, a script that diffs output against a fixture, or a browser screenshot compared against a design. Because Claude stops when the work looks done, a check that returns pass or fail lets the loop close on its own: the agent does the work, runs the check, reads the result and iterates until it passes. Without such a check, the user becomes the verification loop and every mistake waits to be noticed. The guide also suggests running /verify after the agent's own check passes, to confirm the change against the running app.

The guide offers before/after prompt examples: asking for a validateEmail function with explicit example test cases and instructions to run the tests; pasting a screenshot and asking the agent to compare its result and list differences; and demanding that a failing build be fixed at the root cause with verification rather than suppressed. It also outlines ways to gate the stop, from asking for check-and-iterate in one prompt, to setting the check as a /goal condition re-evaluated after every turn, to a Stop hook that blocks a turn from ending until a scripted check passes, to a verification subagent or workflow in which a fresh model tries to refute the result so the agent doing the work is not the one grading it.
