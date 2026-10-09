---
publish: true
content_type: "post"
title: "Best practices for Claude Code"
description: "This guide collects patterns that Anthropic says have proven effective across its internal teams and among engineers using Claude Code in various codebases, languages, and environments. It frames Claude Code as an agentic coding environment"
date: "2026-10-09T14:18:33.825Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:33.825Z"
date_basis: "observed"
source_url: "https://www.anthropic.com/engineering/claude-code-best-practices"
tags: ["source/anthropic","topics/coding","topics/agents"]
---

This guide collects patterns that Anthropic says have proven effective across its internal teams and among engineers using Claude Code in various codebases, languages, and environments. It frames Claude Code as an agentic coding environment rather than a chatbot: instead of writing code yourself and asking Claude to review it, you describe what you want and Claude explores, plans, and implements—while you watch, redirect, or step away. The guide notes this autonomy comes with a learning curve and that most best practices stem from one constraint: Claude's context window fills up fast, and performance degrades as it fills. The window holds the entire conversation, including every message, every file read, and every command output; a single debugging session or codebase exploration can generate and consume tens of thousands of tokens, which matters because the model may start "forgetting" earlier instructions or making more mistakes. Context is therefore described as the most important resource to manage, and the guide points to tracking usage with a custom status line and to strategies for reducing token usage.

The central recommendation is to give Claude a check it can run: tests, a build, a linter, a script that diffs output against a fixture, or a browser screenshot compared against a design. Without a check, "looks done" is the only signal available and the user becomes the verification loop; with one, Claude does the work, runs the check, reads the result, and iterates until it passes. The guide suggests running /verify yourself after Claude's check passes to confirm the change against the running app, and gives before/after examples:

- "implement a function that validates email addresses" becomes "write a validateEmail function. example test cases: user@example.com is true, invalid is false, user@.com is false. run the tests after implementing".
- "make the dashboard look better" becomes a prompt to implement a pasted screenshot design, take a screenshot of the result, compare it to the original, list differences and fix them.
- "the build is failing" becomes a request to fix the specific pasted error and verify the build succeeds, addressing the root cause rather than suppressing the error.

It then describes four ways to decide how hard the check gates stopping: asking Claude to run the check and iterate in the same prompt; setting the check as a /goal condition, where a separate evaluator re-checks it after every turn and Claude keeps working until the goal resolves &#40;Claude Code eventually stops the run with the goal still set if Claude stalls&#41;; using a Stop hook as a deterministic gate that blocks the turn from ending until the script passes; and using a verification subagent or dynamic workflow so a fresh model tries to refute the result, rather than the agent grading its own work.
