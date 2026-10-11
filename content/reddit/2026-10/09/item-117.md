---
publish: true
content_type: "post"
title: "Fake compaction injections?"
description: "A user reports seeing something strange and specific in Claude and asks whether others have encountered it. In a long-running conversation, text formatted to look like an official system notice, claiming the conversation was compacted or su"
date: "2026-10-09T01:56:02.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x193ld/fake_compaction_injections/"
tags: ["source/reddit","topics/security-privacy","topics/agents"]
---

A user reports seeing something strange and specific in Claude and asks whether others have encountered it. In a long-running conversation, text formatted to look like an official system notice, claiming the conversation was compacted or summarized with a fabricated summary attached, appears appended to their own messages, as if they had typed it themselves.

The author says it is not an actual Claude feature: there is no such tool Claude can call, and it does not arrive as an actual system message but is embedded inside what looks like the user own turn. They report seeing it both with a plain typed message with no attachment and, separately, with an uploaded document. In the document case, they opened the raw file in a plain text editor afterward and confirmed the fake text is not in the file, so whatever adds it happens somewhere between the file leaving their hands and the message reaching the conversation.

The occurrence has recurred many times over several months, always in one specific long-running thread, and the user says Claude has correctly caught and ignored it every time. They ask whether anyone else has seen fake system-style text appear in a Claude conversation, something they did not type and Claude did not generate as a real response.
