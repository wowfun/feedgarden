---
publish: true
content_type: "post"
title: "Switch Lowering in GCC"
description: "GCC lowers switch statements using different strategies depending on case density. For dense, contiguous or offset case values, it builds a jump table: the switch value is bounds-checked, then used as an index into an array of target add..."
date: "2026-10-31T08:02:26.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://xoranth.net/gcc-switch/"
discussion_url: "https://news.ycombinator.com/item?id=50314085"
tags: ["source/hackernews","topics/compilers"]
---

## Article

GCC lowers switch statements using different strategies depending on case density. For dense, contiguous or offset case values, it builds a jump table: the switch value is bounds-checked, then used as an index into an array of target addresses. Cases need not start at zero; a constant offset is subtracted first. GCC tolerates sparsity up to roughly eight jump-table slots per case label, so compact&#95;7 with values 0, 7, 14, 21 and 34 still becomes a table whose gaps are filled by the default target. Beyond that threshold, as in sparse&#95;8 with values 0, 8, 16, 24 and 40, GCC expands the switch as a balanced decision tree of comparisons, branching on midpoints such as 16 and 24. The post shows the generated x86-64 assembly and a visualization of the comparison tree. All optimizations except bitset lowering also apply to Clang, and the examples use -O3. The author notes that GCC can identify constant offsets and that a manual implementation would use a function-pointer array, which the compiler effectively reproduces.

## HN discussion

Based on 9 selected comments and replies.

LarsKrimi observes that sparse&#95;8 could be simplified by dividing x by eight, but notes this would route seven values per case to function calls instead of the default; rep&#95;lodsb replies that since all values are divisible by eight, a modulo check could guard a jump table. rurban argues compilers should implement perfect hashing for large sparse switches, citing Unicode work, and says GCC and Clang still lack it. jcranmer counters that perfect hashing is rarely worth it because hot large sparse switches are uncommon and parse tables can be optimized by their generators. erk&#95;&#95; reports that LLVM once spent about half an hour compiling a huge switch of MAC-address manufacturers, while perfect hashing compiled much faster. zamalek notes decision trees can outperform jump tables in some cases, citing .NET HashCode's trailing bytes. tsukikage asks why the jump table targets jmp instructions rather than the functions directly; Findecanor explains the indirection likely comes from a later pass optimizing calls into jumps. Andi adds that similar generated dispatch in JavaScript brought no gain for immutable Maps and Sets, but roughly doubled speed for complex Unicode regular-expression ranges.

Selected comments: [LarsKrimi](https://news.ycombinator.com/item?id=50314563) · [rep&#95;lodsb](https://news.ycombinator.com/item?id=50315051) · [rurban](https://news.ycombinator.com/item?id=50314612) · [jcranmer](https://news.ycombinator.com/item?id=50317489) · [erk&#95;&#95;](https://news.ycombinator.com/item?id=50319142) · [tsukikage](https://news.ycombinator.com/item?id=50314741)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50314085>)
