---
publish: true
content_type: "post"
title: "Why can't API keys be stored securely for Anthropic's own API in Claude Code?"
description: "A developer describes a security gap when using Claude Code for development work. They often need Claude to run evals or ad-hoc tests of prompts and models, and the easy approach is to give the thread an API key, but doing so is manual and "
date: "2026-10-09T08:44:01.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1g59v/why_is_anthropic_the_one_service_i_cant_store_api/"
tags: ["source/reddit","topics/security-privacy","topics/coding","topics/industry"]
---

A developer describes a security gap when using Claude Code for development work. They often need Claude to run evals or ad-hoc tests of prompts and models, and the easy approach is to give the thread an API key, but doing so is manual and not especially secure. When creating a key, they are repeatedly reminded to use Federated Identity, but Claude Code is not among the supported platforms.

They note that Network Secrets were recently added to Projects and Cloud Environments, which also looked like a good fit, but api.anthropic.com is not an allowed target. They ask why Anthropic is the one platform for which they cannot securely store keys. Their current fallback is a custom GitHub action, which they say does not work well for ad-hoc testing.
