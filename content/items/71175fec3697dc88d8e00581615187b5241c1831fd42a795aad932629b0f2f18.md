---
publish: true
content_type: "post"
title: "Git hook that removes Co-authored-by lines from every commit"
description: "A user shares a global Git hook that automatically strips Co-authored-by: lines from every commit, because AI coding tools such as Claude Code and Copilot often add them. The hook removes all Co-authored-by: lines case-insensitively, includ"
date: "2026-10-09T06:15:28.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1dtpx/git_hook_that_removes_coauthoredby_lines_from/"
tags: ["source/reddit","topics/coding","topics/content-provenance","topics/security-privacy"]
---

A user shares a global Git hook that automatically strips Co-authored-by: lines from every commit, because AI coding tools such as Claude Code and Copilot often add them.

The hook removes all Co-authored-by: lines case-insensitively, including human co-authors, while leaving everything else, including other attribution lines and blank lines, unchanged. The author notes this removes the need to rely on claude.md or agents.md rules. The script is a short sh script; save it as &#126;/.githooks/commit-msg, then run mkdir -p &#126;/.githooks, chmod +x &#126;/.githooks/commit-msg and git config --global core.hooksPath &#126;/.githooks. Setup works on Windows via Git Bash and on macOS and Linux terminals.

Caveats listed: on Windows the script must be saved with LF line endings; core.hooksPath overrides existing repository hooks, including Husky and pre-commit setups; git commit --no-verify skips the hook; and existing commit history is not affected.
