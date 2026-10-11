---
publish: true
content_type: "post"
title: "Bitmaps in the Linux Kernel"
description: "This installment of a series on common data structures in the Linux kernel examines the bitmap, the kernel's name for a bit array. A bitmap is simply an array of unsigned long values with no dedicated type; on x86_64 each word is 64 bits wi"
date: "2026-10-08T23:16:09.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://0xax.dev/books/linux-inside/linux-datastructures-2"
discussion_url: "https://news.ycombinator.com/item?id=50013765"
tags: ["source/hackernews","topics/coding","topics/hardware"]
---

## Article

This installment of a series on common data structures in the Linux kernel examines the bitmap, the kernel's name for a bit array. A bitmap is simply an array of unsigned long values with no dedicated type; on x86&#95;64 each word is 64 bits wide, so every 64 bits of the map share one storage unit. Each bit encodes a state such as set or clear, available or unavailable, or enabled or disabled.

The author argues bitmaps are pervasive by counting occurrences of the three most basic operations in the kernel source: a search for set&#95;bit, clear&#95;bit and test&#95;bit as whole words returns roughly 28,340 hits. The exact figure depends on the kernel version, but the order of magnitude makes the abstraction worth understanding.

The article explains why bit arrays are attractive. A set that may contain any number from 0 to 255 requires only 256 bits, or 32 bytes, whereas an array of bool values needs at least eight times more memory, since each bool occupies at least one byte, and a linked list of integers costs far more. Speed is the second reason: processors can operate on a whole machine word of bits in a single instruction, so many flags can be checked or combined cheaply, and x86 even offers instructions that test or modify a single bit directly.

It also recalls the basic set semantics: an index identifies a value and the bit at that index answers whether the value is present. Storing the set &#123;1, 3, 8, 12&#125; means setting those four indexes in a 16-bit array and leaving the rest clear. Because indexes run from zero to size minus one, only numbers inside that range can be represented. The operations available are setting a bit, clearing a bit, testing whether a bit is set, and finding the first set or clear bit; the first three touch a single bit, while the search scans the map one machine word at a time rather than one bit at a time. The piece is background for a forthcoming look at the actual kernel API and implementation.

## HN discussion

Based on 3 selected comments and replies.

- One commenter wishes for a CPU design in which pointers address individual bits rather than 8-bit bytes, questioning whether such a design would really be less efficient if executed properly, and complaining that declaring a bitmap requires workarounds instead of something like a plain bool array.
- A reply pushes back that this has little to do with what current processors provide. It notes that Intel CPUs have long had instructions pointing at individual bits, for example BTS, whose second operand is a bit address. It also recalls that std::vector&lt;bool&gt; was introduced to expose what processors can do, but became a special case that, quoting Scott Meyers, is not a standard container and does not contain actual bools.
- One further short comment simply says the piece was starred and followed. This is a small ranked sample, not a survey of reader opinion.

Selected comments: [EdSchouten](https://news.ycombinator.com/item?id=50015939) · [JdeBP](https://news.ycombinator.com/item?id=50016029)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50013765>)

## Images and video

- [Image: bit array](<https://raw.githubusercontent.com/0xAX/linux-insides/master/DataStructures/images/bit-array.svg>)
- [Image: bit number to word](<https://raw.githubusercontent.com/0xAX/linux-insides/master/DataStructures/images/bitmap-words.svg>)
- [Image: find&#95;next&#95;bit](<https://raw.githubusercontent.com/0xAX/linux-insides/master/DataStructures/images/find-next-bit.svg>)
