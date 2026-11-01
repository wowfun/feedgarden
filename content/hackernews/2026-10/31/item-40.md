---
publish: true
content_type: "post"
title: "Show HN: A language model that lives in a boot sector"
description: "A project called bootgpt puts a tiny character-level neural network into a PC's master boot record (MBR): a 512-byte hand-written assembly boot sector loads an 11.5 KB int8 model from the following 23 sectors and runs inference in 16-bit..."
date: "2026-10-31T12:58:29.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://github.com/kerlenton/bootgpt"
discussion_url: "https://news.ycombinator.com/item?id=50315782"
tags: ["source/hackernews","topics/models","topics/inference","topics/hardware"]
---

## Article

A project called bootgpt puts a tiny character-level neural network into a PC's master boot record &#40;MBR&#41;: a 512-byte hand-written assembly boot sector loads an 11.5 KB int8 model from the following 23 sectors and runs inference in 16-bit real mode on a 386, with no operating system or C runtime. On boot, the machine generates a plausible but fictional Linux boot log with timestamps, PCI bars and ACPI events for hardware that never existed. corpus&#95;gen.py produces 3 MB of fake dmesg from a single kernel version; train.py trains char embeddings, one hidden layer and a softmax, quantizes everything to int8 with power-of-two scales so the boot sector can do the whole forward pass with imul and one idiv, and simulates the exact integer math including an LCG sampler so Python and assembly outputs match char for char. boot.asm handles int 13h weight loading, int 10h printing, a softclip activation via cdq/idiv, argmax sampling seeded by timer noise, and reboots on any keypress. Strings, weights and the vocab table live in the data sectors so inference plus BIOS plumbing fits into 510 bytes of code. The boot sector genre is long-lived: Oscar Toledo fit chess, an OS and BASIC into 512 bytes, while the closest neighbor sectorllm boots a real Llama2 transformer of about 1.2 KB of real-mode assembly running Karpathy's stories260K, sectorlisp-nn runs a TensorFlow-trained network during boot on a Lisp interpreter, and UEFI apps boot straight into llama-class models. bootgpt instead keeps the whole engine in the MBR with weights and strings in following sectors, training a tiny char-level net for one task: hallucinating the boot log of the machine it wakes on. With 8 chars of context and one hidden layer, output is garbled but log-like. disk.img is a normal boot image that can be written to a USB stick to boot any BIOS box, reading only its own sectors; building uses nasm, qemu and Python, and record.py captures the demo gif from headless QEMU through the monitor socket. The approach requires BIOS hardware, produces hallucinated rather than real logs, and uses one kernel version and one disk per session because repetition makes a tiny model look sane.

## HN discussion

Based on 4 selected comments and replies.

aDyslecticCrow praises the project as the kind of playful engineering that reminds them humans do weird things for fun, not just economic value; kerlenton thanks them and agrees some work is done purely for fun. andai asks for more about how it was made and learned; kerlenton replies it is hard to recommend a path, emphasizing genuine interest, patience and persistence, plus a surrounding culture where peers build similar things, and mentions a team lead who reverse-engineers electric cars. The sample shows appreciation for whimsical low-level work and curiosity about the learning journey, with the author stressing motivation and environment over a step-by-step guide.

Selected comments: [aDyslecticCrow](https://news.ycombinator.com/item?id=50321702) · [kerlenton](https://news.ycombinator.com/item?id=50323611) · [andai](https://news.ycombinator.com/item?id=50322783) · [kerlenton](https://news.ycombinator.com/item?id=50323696)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50315782>)

## Media

![Image: demo](<https://github.com/kerlenton/bootgpt/raw/main/bootgpt_demo.gif>)

[Image: demo](<https://github.com/kerlenton/bootgpt/raw/main/bootgpt_demo.gif>)
