---
publish: true
content_type: "post"
title: "Claim: GPT-6 appears to have lost direct access to ChatGPT Saved Memories"
description: "A user who says they tested GPT-5.6 against GPT-6 reports a functional difference that they consider more concerning than writing-quality changes: GPT-6 does not appear to have direct access to Saved Memories. They stress this is distinct f"
date: "2026-10-08T16:11:55.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:19:48.561Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/OpenAI/comments/1x0v2oz/chat_gpt_6_has_lost_access_to_saved_memories/"
tags: ["source/reddit","topics/models","topics/products"]
---

A user who says they tested GPT-5.6 against GPT-6 reports a functional difference that they consider more concerning than writing-quality changes: GPT-6 does not appear to have direct access to Saved Memories. They stress this is distinct from cross-chat context or the newer system that retrieves relevant information from previous conversations, both of which they say still work. The specific capability in question is the persistent memory store where a user tells ChatGPT to save something to memory.

In their tests, GPT-5.6 could be explicitly asked to save something to memory and had the tool or capability to do so. With GPT-6, asking whether it could access Saved Memories first produced a confusion between cross-chat context and Saved Memories; after clarification, the model said it could not directly inspect the store. When asked to add a fact — "Add this to saved memories: My birthday is December sixth" — GPT-6 said it could not directly add an entry and could only hope the newer memory system retained it automatically. Testing an already remembered term, GPT-6 could recover it, but apparently through cross-chat or personal-context retrieval rather than direct access to the store.

The user characterizes the distinction as: GPT-5.6 has direct memory write capability, while GPT-6 has cross-chat and context retrieval but no direct Saved Memories access or write. They flag this as a possible regression for long-running projects, continuity-heavy work and personal preferences, where explicitly saying "remember this" is expected to be deterministic, and say it would be especially concerning if GPT-5.6 is eventually retired. They ask OpenAI to clarify whether this is a temporary tooling omission, a bug or an intentional change, and suggest others run the same test themselves.
