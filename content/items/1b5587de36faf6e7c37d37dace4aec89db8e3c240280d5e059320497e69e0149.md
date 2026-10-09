---
publish: true
content_type: "post"
title: "Coding Agents Need Typed Context Surfaces, Not One Flat Context Window"
description: "The author argues that most coding agents treat context as a mix of source files, chat history, configuration files, and retrieved text. That works for simple code completion, but becomes unreliable when a task requires exact values, struct"
date: "2026-10-09T08:53:53.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:22:47.680Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ChatGPTCoding/comments/1x1gavk/coding_agents_need_typed_context_surfaces_not_one/"
tags: ["source/reddit","topics/agents","topics/coding","topics/research"]
---

The author argues that most coding agents treat context as a mix of source files, chat history, configuration files, and retrieved text. That works for simple code completion, but becomes unreliable when a task requires exact values, structured relationships, reusable procedures, or durable project-specific facts.

The stated cause is that different information types have different access patterns:

- Documents need semantic and keyword retrieval.
- Structured data needs filtering, joins, aggregation, and SQL.
- Relationships need graph traversal rather than text similarity.
- Procedures need reusable, versioned instructions.
- Durable facts need scope, persistence, and controlled updates.

The proposed architecture exposes these as typed context surfaces instead of flattening everything into a single vector index: KB for documents and notes with hybrid retrieval; DB for structured records and SQL queries; Graph for entities, relationships, and bounded traversal; Skills for reusable operational procedures; and Memory for scoped facts, preferences, and durable state. The agent routes each request to the relevant surface, combines results when needed, and preserves provenance for every piece of evidence. Read and write operations also stay separate: retrieval returns normalized evidence, while updates return explicit receipts containing the affected source, profile, revision, and surface-level results. The author states this architecture is implemented in the open-source Codex MCP plugin OpenDCAI/DataMind.
