---
publish: true
content_type: "post"
title: "Webhook signature check passed once, then failed on every real call"
description: "A developer reports asking Claude Code to write a Flask endpoint that receives webhooks from the sync.so API and verifies the Sync-Signature header. The code looked correct and a curl test passed, but every real webhook returned 400. The ca"
date: "2026-10-09T10:09:23.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1hi5b/claude_code_wrote_my_sync_so_webhook_receiver/"
tags: ["source/reddit","topics/coding"]
---

A developer reports asking Claude Code to write a Flask endpoint that receives webhooks from the sync.so API and verifies the Sync-Signature header. The code looked correct and a curl test passed, but every real webhook returned 400.

The cause: the code parsed the JSON body first and hashed the re-serialized body, while the signature is an HMAC over the timestamp, a dot, and the exact raw bytes. Reordering a single key made the signature invalid. Switching to request.get&#95;data&#40;&#41; fixed the problem.

The poster notes that the code had looked confident despite the flaw and asks whether anyone has a prompt or a CLAUDE.md line that prevents parsing before verifying. No solution is offered in the post, which is a short bug report and request for suggestions.
