---
publish: true
content_type: "post"
title: "Sanstun: A sans-IO, parallel-friendly WireGuard implementation in Rust"
description: "Sanstun is a new sans-IO Rust implementation of the WireGuard state machine announced by Firezone, built after years of patching the boringtun codebase. The core idea behind sans-IO is cleanly separating I/O and side effects from state a..."
date: "2026-10-30T21:30:00.000Z"
updated: "2026-11-01T15:39:43.305Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://www.firezone.dev/blog/introducing-sanstun"
discussion_url: "https://news.ycombinator.com/item?id=50310398"
tags: ["source/hackernews","topics/coding","topics/security-privacy"]
---

## Article

Sanstun is a new sans-IO Rust implementation of the WireGuard state machine announced by Firezone, built after years of patching the boringtun codebase. The core idea behind sans-IO is cleanly separating I/O and side effects from state and business logic, making components easier to test, compose, and reason about across languages without sacrificing Rust's ownership model.

The project grew out of practical friction with boringtun: maintaining API compatibility while adding features like full sans-IO time handling and removing internal packet buffering proved increasingly difficult. By dropping automatic session buffering and exposing explicit APIs for handshake initiation, decapsulation, encapsulation, timeouts, and events, sanstun offers a more deliberate and flexible interface. These changes simplify the implementation while still covering all four WireGuard message types.

The design prioritizes testability, parallelism, and security through an explicit API that leaves buffering and I/O policy to the caller. Rather than inventing a radically new protocol, sanstun refines the integration points of an existing, widely used one. Its practical value lies not in changing WireGuard itself, but in giving developers a more predictable building block for userspace VPN implementations across different I/O models.

## HN discussion

Based on 8 selected comments and replies.

Discussion centered on the sans-IO design philosophy. Twey pushed back on the post's claim about avoiding function coloring, arguing that async is itself just a way to build deterministic state machines and that crossing await points still forces typing constraints. wh33zle countered that with async, the entire machine collapses to a single poll API, making it awkward to inject state changes between transitions without channels or shared mutexes. monocasa endorsed the approach, noting that protocol implementations benefit from better testability, easier sharing between async and blocking I/O, and fewer unsafe dependencies. temp0826 added context by pointing to Mullvad's gotatun, another WireGuard implementation spun off from boringtun, underscoring the broader interest in refining this space.

Selected comments: [Twey](https://news.ycombinator.com/item?id=50312268) · [wh33zle](https://news.ycombinator.com/item?id=50312375) · [monocasa](https://news.ycombinator.com/item?id=50311406) · [temp0826](https://news.ycombinator.com/item?id=50310928)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50310398>)
