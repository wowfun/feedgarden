---
publish: true
content_type: "post"
title: "System prompt vs. first user prompt"
description: "Reading the \"build a strong prompt\" agent example in the Claude docs, a user was surprised by the recommended structure: rather than putting all instructions in the system prompt to separate them from the conversation, the docs say Claude w"
date: "2026-10-09T09:07:38.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1gil3/system_prompt_vs_1st_user_prompt/"
tags: ["source/reddit","topics/coding","topics/agents","topics/research"]
---

Reading the "build a strong prompt" agent example in the Claude docs, a user was surprised by the recommended structure: rather than putting all instructions in the system prompt to separate them from the conversation, the docs say Claude works best when the bulk of prompt content sits in the first user turn, with role prompting the only exception. The example keeps a short IDENTITY system prompt and appends over 100 lines of task-specific content - static greetings, car insurance and electric car insurance material, examples and additional guardrails - as the first user message, followed by a synthetic assistant "Understood" and then the real conversation. In the code, only IDENTITY is passed as the system parameter while the task instructions become message content.

The poster asked whether the documentation is obsolete, and later added the community's rationale for keeping a system prompt anyway: the system prompt outranks the user prompt, so if the model cannot distinguish system instructions from user input, anyone can tell it to do a completely different task than the one it was built for. The model has no basis for deciding whether to follow a conflicting instruction. For a customer support agent in particular, customers should not be able to change the agent's behaviour - a reason the poster notes emerged as models progressed rather than being part of the original design intent.
