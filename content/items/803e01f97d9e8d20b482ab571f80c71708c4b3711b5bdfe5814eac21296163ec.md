---
publish: true
content_type: "post"
title: "Grounded Engineering v0.6.0 is now a Claude Code mod with a shelf of reviewed skill repos"
description: "Grounded Engineering v0.6.0 has shipped, and its headline change is that it is now a Claude Code mod. The `/grounded` command opens a live pane inside Claude Code with two screens. Practices reads signals from the open repository, such as l"
date: "2026-10-08T23:43:13.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x16e2o/grounded_engineering_v060_now_a_claude_code_mod/"
tags: ["source/reddit","topics/coding","topics/agents","topics/security-privacy"]
---

Grounded Engineering v0.6.0 has shipped, and its headline change is that it is now a Claude Code mod. The &#96;/grounded&#96; command opens a live pane inside Claude Code with two screens. Practices reads signals from the open repository, such as languages, CI and test setup, and shows which practice cards fit that specific repo rather than a generic checklist; the &#96;adapt&#96; skill then proposes a concrete change for the user's approval. Skill repos is a shelf of sixteen reviewed third-party skill repositories shown in the same pane, and the &#96;explain&#96; skill describes what installing one would actually add before the user commits.

Every practice card is distilled from a real implementation the author read, recording the pattern, the underlying principle, the rationale, a confidence level and a citation to the exact source lines where it was observed. The example given is a card on gating network egress from agent-run work, which points at the allow/deny/approval decision and execution-scoped proxy construction in openai/codex's network&#95;approval.rs, lines 625-820. Skill repositories are reviewed before being listed: each is read at a pinned commit, its license is checked against SPDX, and its install steps must be literal, verifiable commands, with anything else relegated to an install note.

This release adds four practice cards sourced from openai/codex, covering expressing edits in an explicit verifiable format, deciding permission separately from the action, confining agent-executed commands in an OS sandbox, and gating network egress from agent-run work. The ai-assisted pack now ships seventeen cards. The author says the project keeps growing: new cards are added as new sources are reviewed, the shelf gains repositories, and existing entries are updated or re-audited when their sources drift, with a source-drift check flagging cards automatically. Installation requires Claude Code 2.1.288 or later via the plugin marketplace, and a CLI remains available on npm as &#96;npx grounded-engineering@0.6.0&#96;. The author is /u/MadJagStudios.

## Images and video

- [Image: Grounded Engineering v0.6.0: now a Claude Code mod with a shelf of reviewed skill repos](<https://preview.redd.it/1sibdk86tcuh1.gif?frame=1&width=140&height=84&auto=webp&s=cb374817f065900245b193cca7bb611b48f59080>)
