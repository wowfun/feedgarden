---
publish: true
content_type: "post"
title: "Show HN: Aura – a self-hosted, multi-user AI agent with per-person graph memory"
description: "Aura is a self-hosted, multi-user AI agent platform written in Go. A single Go binary hosts the runtime, tools, CLI, Telegram gateway and an embedded web cockpit, and Docker Compose runs supporting services alongside it: Postgres, ArcadeDB,"
date: "2026-10-08T18:50:13.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/chetto1983/Aura"
discussion_url: "https://news.ycombinator.com/item?id=50010250"
tags: ["source/hackernews","topics/agents","topics/products","topics/security-privacy"]
---

## Article

Aura is a self-hosted, multi-user AI agent platform written in Go. A single Go binary hosts the runtime, tools, CLI, Telegram gateway and an embedded web cockpit, and Docker Compose runs supporting services alongside it: Postgres, ArcadeDB, Garage object storage, plus embedding, ingestion, web search and voice components. Each person signs in to their own identity with a separate memory database, workspace and sandbox.

The model is selected in the cockpit settings: OpenRouter as the default route, a ChatGPT plan, a bundled local llama.cpp server, or Ollama. The author emphasizes that local storage does not mean offline inference — a cloud provider receives whatever context is sent to its model, and only a local server keeps inference on the host. No local LLM runs by default. The stated hardware target is modest: the default stack measured about 7 GB with speech-to-text and text-to-speech on a 16 GB mini PC &#40;figures dated 2026-09-02&#41;.

Key mechanisms described in the README:
- A streaming agent loop with shared step and time budgets plus repeated-call controls to bound work.
- Deferred tools and tool&#95;search, which discover tools and load their schemas on demand, including from mounted MCP servers.
- An adaptive reasoning router that selects reasoning effort using a configured classifier and the active model's supported capabilities.
- Graph-native memory: facts, sources and validity windows stored in ArcadeDB, with temporal paths returning supporting evidence; Postgres-authoritative conversations get a derived recall projection and managed context compaction.
- Document retrieval with indexed passages, source hashes and citations, plus access to the original file for calculations and whole-file tasks.

Operational and safety features include full host terminal and filesystem tools with destructive-command approval gates and secret redaction, a per-identity sandbox &#40;opt-in profile, gVisor runsc on native Linux&#41; that returns deliverables over the channel via send&#95;file rather than as a path, scheduler and self wake-ups through one at/every/cron task tool with job policy and operator controls, and multi-user sign-in via Authula with password plus an optional TOTP step, capability grants, an admin audit view and per-identity ArcadeDB isolation enforced by the server. Channels include a CLI REPL, Telegram with voice, photo, document and human-in-the-loop support, and a web cockpit over AG-UI/SSE with mid-turn steering, approvals and live settings. The project is MIT-licensed and includes a Studio for image and video generation and editing, bundled PIM, WhatsApp and SearXNG integrations, and a comparison document against Open WebUI and LibreChat.

## HN discussion

Based on 3 selected comments and replies.

In a small sample of three comments, a commenter building a similar system asks how Aura actually uses the information it connects to, such as email and calendars. The author answers that the project relies on MCP, forked and modified for multitenancy and safety — the same reply appears twice, once as a top-level comment and once in reply to the question. The sample offers no benchmarks or independent evaluation, and the thread contains no dissent or further questions.

Selected comments: [team&#95;mindmesh](https://news.ycombinator.com/item?id=50014145) · [chettto983](https://news.ycombinator.com/item?id=50017299) · [chettto983](https://news.ycombinator.com/item?id=50016164)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50010250>)

## Images and video

- [Image: Aura cockpit: the agent stores a birthday in its memory graph and schedules a reminder, then a new chat answers from memory](<https://github.com/chetto1983/Aura/raw/master/public/demo.gif>)
