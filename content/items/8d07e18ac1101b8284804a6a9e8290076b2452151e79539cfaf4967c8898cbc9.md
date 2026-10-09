---
publish: true
content_type: "post"
title: "/doctor prompt-audit checks instruction files but skips Claude's own memory folder"
description: "A user shares a tip about the /doctor prompt-audit command, which requires v2.1.283 or later. It reviews instruction files for three problems: instructions written for older models, references to files or commands that no longer exist, and "
date: "2026-10-09T09:19:06.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1gp4p/til_about_doctor_promptaudit_it_checks_every/"
tags: ["source/reddit","topics/coding","topics/agents","topics/evaluation"]
---

A user shares a tip about the /doctor prompt-audit command, which requires v2.1.283 or later. It reviews instruction files for three problems: instructions written for older models, references to files or commands that no longer exist, and files that contradict one another. It returns a report with proposed edits, and nothing changes until the user approves applying them.

By default the audit covers CLAUDE.md, CLAUDE.local.md, AGENTS.md, and the rules, skills, commands, subagents and output styles under .claude/ and &#126;/.claude/. A path can be passed to narrow it, for example /doctor prompt-audit .claude/skills/deploy.

The auto memory folder, &#126;/.claude/projects//memory/, is not included. That is the folder Claude writes without user review, and its index loads into every session. In the poster's repository for AI Toolbox, the extension they build, it holds 65 files, one of which went stale that week when a Gemini plan change made it wrong, exactly the kind of outdated fact the audit is designed to catch. The poster has not confirmed whether passing the memory folder as the path works, since it lives outside the repository, and asks anyone who tries it to report back.

One caveat: the audit runs through the bundled /claude-api skill, so if bundled skills were disabled with disableBundledSkills or skillOverrides, the command is unavailable.
