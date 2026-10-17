---
publish: true
content_type: "post"
title: "Why harnesses matter for energy (and token) efficiency"
description: "The thread debates what a harness adds to a raw model. One commenter calls an unharnessed LLM text in, text out; a harness, in this view, supplies the \"exosuit\" of discrete actions and context strategies that make large-codebase work fea..."
date: "2026-10-16T21:01:23.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:46:51.389Z"
date_basis: "published"
source_url: "https://neuralwatt.com/news/why-harnesses-matter-for-energy-efficiency"
discussion_url: "https://news.ycombinator.com/item?id=50124642"
tags: ["source/hackernews","topics/inference","topics/agents"]
---

## HN discussion

Based on 8 selected comments and replies.

The thread debates what a harness adds to a raw model. One commenter calls an unharnessed LLM text in, text out; a harness, in this view, supplies the "exosuit" of discrete actions and context strategies that make large-codebase work feasible. Another disputes the focus on cache hit rates as Goodharting: accuracy matters more, he argues, and sub-agents exist to give a model a clean context even if caching suffers. The author replies that accuracy comes first, but cost and throughput matter once a task can be completed, and blames low cache rates chiefly on memory systems that trade a stable prefix for fresh per-turn context. From his company's measurements he cites uncached input of 1.6% to 11.1% across clients, about double the energy for a mostly uncached request, and, past 128k tokens, a turn that re-reads over half its prompt costing roughly the prefill of 600 normal turns. Every cache break, he says, came from a harness editing already-sent content, such as a system-prompt date. A hobbyist asks for a cheap energy-estimate API.

Selected comments: [ccgibson](https://news.ycombinator.com/item?id=50124690) · [zby](https://news.ycombinator.com/item?id=50125407) · [ccgibson](https://news.ycombinator.com/item?id=50126050) · [ccgibson](https://news.ycombinator.com/item?id=50126038) · [randysalami](https://news.ycombinator.com/item?id=50125355) · [dilippkumar](https://news.ycombinator.com/item?id=50127283)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50124642>)
