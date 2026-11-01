---
publish: true
content_type: "post"
title: "Show HN: A working Nintendo in ~1GB of Qwen weights"
description: "A compiler has embedded an entire NES into the weights of a stock Qwen3.5 model. Rather than training, it computed every weight directly so that the 6502 CPU, 2 KB of work RAM, and a cartridge's program ROM all run inside the model's Gat..."
date: "2026-10-30T16:40:22.000Z"
updated: "2026-11-01T15:39:43.305Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://github.com/dbreunig/nesformer"
discussion_url: "https://news.ycombinator.com/item?id=50306442"
tags: ["source/hackernews","topics/models","topics/hardware","topics/inference"]
---

## Article

A compiler has embedded an entire NES into the weights of a stock Qwen3.5 model. Rather than training, it computed every weight directly so that the 6502 CPU, 2 KB of work RAM, and a cartridge's program ROM all run inside the model's Gated DeltaNet state. When playing a game, the model predicts the CPU's execution log one token at a time; a small host program handles graphics, controller input, and the vblank interrupt around it.

Built on the earlier Qwenputer project &#40;which compiled CHIP-8 and RISC-V&#41;, nesformer loads ROMs into model state at startup and can run any NROM &#40;mapper 0&#41; cartridge without rebuilding weights. For bundled test games, outputs match a conventional 6502 emulator exactly. The tradeoff is performance: on current hardware, nesformer runs roughly 150-290x slower than a real NES, taking 1-6 seconds per frame &#40;about 25 minutes for 10 seconds of gameplay&#41;. Only NROM board games are supported.

The project demonstrates a striking fact: deterministic hardware logic can be compiled into transformer weights as an exact emulation, not a learned approximation. Its main significance is not practical playability but the stark illustration of compute requirements - if even a simple console demands this much overhead, emulating full systems purely through model inference would be orders of magnitude more expensive than purpose-built code.

## HN discussion

Based on 10 selected comments and replies.

Commenters focus on the approach and its implications rather than the demo itself. The author explains that Opus 5.5 built the working weights and code from two prompts, drawing on existing NES emulation conformance tests with thousands of golden instructions. Others note the efficiency tradeoff: compiling digital logic into model weights is exact rather than learned, but runs orders of magnitude slower than conventional emulation. One commenter estimates 150-290x slower than real hardware and warns that a full OS hallucinated frame by frame would be vastly more expensive. Another sees a broader possibility - compiling a small VM into weights could let an LLM execute code via matrix operations instead of slow tool calls, though that remains speculative. Across these views, the project is valued less as a practical emulator than as a demonstration of the compute gulf between deterministic programs and model inference.

Selected comments: [dbreunig](https://news.ycombinator.com/item?id=50307402) · [jacquesm](https://news.ycombinator.com/item?id=50306736) · [pbohun](https://news.ycombinator.com/item?id=50307246) · [armcat](https://news.ycombinator.com/item?id=50307314)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50306442>)

## Media

![Image: Super Mario Bros., played by the weights](<https://github.com/dbreunig/nesformer/raw/main/examples/demo.gif>)

[Image: Super Mario Bros., played by the weights](<https://github.com/dbreunig/nesformer/raw/main/examples/demo.gif>)

![Image: Full Game, played by the weights](<https://github.com/dbreunig/nesformer/raw/main/examples/full_game.gif>)

[Image: Full Game, played by the weights](<https://github.com/dbreunig/nesformer/raw/main/examples/full_game.gif>)
