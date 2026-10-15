---
publish: true
content_type: "post"
title: "Running coding agents locally, do you sandbox them or trust them?"
description: "The author asks people who run Claude Code, Codex, or local-model agents directly against their own machines how they limit what those agents can touch. The options they have seen are a dev container, a separate user account, a full VM, ..."
date: "2026-10-08T22:12:35.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:22:47.680Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ChatGPTCoding/comments/1x14f0t/running_coding_agents_locally_do_you_sandbox_them/"
tags: ["source/reddit","topics/coding","topics/agents","topics/security-privacy"]
---

The author asks people who run Claude Code, Codex, or local-model agents directly against their own machines how they limit what those agents can touch.

The options they have seen are a dev container, a separate user account, a full VM, or simply watching the agent closely. In their view, each approach leaks somewhere: containers share the kernel, VMs are annoying to work with, and watching does not scale beyond an afternoon.

The author says their own approach is a microVM that only sees a shared workspace, plus a policy check on each tool call. They mention there is a free desktop tool on their side for anyone who wants to compare notes, but stress that the main interest is understanding where people draw the line between convenience and isolation.

They close with two questions to the community: has anyone had an agent actually do something destructive on their machine, and what did they change about their setup afterward?
