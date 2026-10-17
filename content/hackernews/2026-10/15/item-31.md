---
publish: true
content_type: "post"
title: "The Double Headed Stack Allocator"
description: "Commenters largely treated the double-headed stack as one option among several for reducing fragmentation. tom_ reported that the same effect is achievable with an ordinary allocator: at a previous employer the general-purpose memory man..."
date: "2026-10-15T02:06:36.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://blog.demofox.org/2026/10/03/the-double-headed-stack-allocator/"
discussion_url: "https://news.ycombinator.com/item?id=50098274"
tags: ["source/hackernews","topics/coding","topics/memory-management"]
---

## HN discussion

Based on 8 selected comments and replies.

Commenters largely treated the double-headed stack as one option among several for reducing fragmentation.

tom&#95; reported that the same effect is achievable with an ordinary allocator: at a previous employer the general-purpose memory manager had an "allocate high" option that returned the highest possible address instead of the lowest, which helped when allocating transient data while building persistent data. windenntw recalled that AmigaOS exposed a MEMF&#95;REVERSE flag on its allocator, and that a simple mid-1990s patch forcing allocations above roughly 1KB to that mode greatly reduced fragmentation.

kevin&#95;thibedeau preferred bipartite buffers for sequences of variable-sized objects, noting they behave like a circular buffer and avoid the memory exhaustion that can strand a bump allocator, at the cost of sequential rather than random access. Panzerschrek made a similar point for streaming workloads, suggesting a cyclic allocator, as Quake reportedly used for its surface cache.

saagarjha described using doubly mapped &#40;mirror-mapped&#41; regions when streaming weights to a GPU: pointers are handed out from the first region in order but may wrap to the front via virtual addressing, which allowed allocating several pipeline stages ahead, whereas a double-sided allocator effectively supports only one extra stage. pixelpoet supplied the term "magic ring buffer" for this technique.

Asked why not keep a separate stack allocator per object type, akoboldfrying replied that the system handles two categories, and that a category may contain many distinct types — what matters is that members of a category share an allocation and deallocation timeline, which prevents fragmentation. For two categories, they argued, a double-headed stack strictly dominates two separate half-size stacks, since it permits every allocation sequence the latter allows plus additional ones.

Selected comments: [tom&#95;](https://news.ycombinator.com/item?id=50104440) · [kevin&#95;thibedeau](https://news.ycombinator.com/item?id=50103987) · [Panzerschrek](https://news.ycombinator.com/item?id=50099509) · [windenntw](https://news.ycombinator.com/item?id=50101806) · [saagarjha](https://news.ycombinator.com/item?id=50098885) · [akoboldfrying](https://news.ycombinator.com/item?id=50101283)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50098274>)
