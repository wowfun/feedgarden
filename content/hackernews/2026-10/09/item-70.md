---
publish: true
content_type: "post"
title: "Show HN: I built a fast spreadsheet engine for the web in Rust/WASM"
description: "The author presents Titan, a spreadsheet engine written in Rust and compiled to WebAssembly, built to recalculate large sheets without spending half its time allocating JavaScript objects or serializing data across the WASM boundary. The pr"
date: "2026-10-08T21:51:03.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/podraven/titan-engine"
discussion_url: "https://news.ycombinator.com/item?id=50012880"
tags: ["source/hackernews","topics/coding","topics/hardware"]
---

## Article

The author presents Titan, a spreadsheet engine written in Rust and compiled to WebAssembly, built to recalculate large sheets without spending half its time allocating JavaScript objects or serializing data across the WASM boundary. The project borrows ideas from existing engines but prioritizes browser performance over strict 1:1 compatibility with Excel internals.

The engine is installed from NPM as titan-engine, with a TitanJS wrapper that abstracts WebAssembly pointers and provides A1 notation plus an event subscription model for UI updates. Users can set cells with A1 notation or &#123;row, col&#125; objects, and setting a cell parses the '=' and compiles the formula automatically. An onCellsChanged listener receives an array of exactly what changed, including cascading dependencies, which the author says can be passed straight to a UI layer.

For bulk updates such as pasting a CSV, TitanJS offers a batch mode: it suspends the topological sort during insertion and recalculates the graph once at the end. setRange and setCells support 2D array pastes and scattershot updates across multiple sheets, and get returns a formatted display value such as "15" or "&#35;DIV/0&#33;". A Viewport class provides zero-copy reads, abstracts chunk math and re-acquires pointers if WebAssembly calls memory.grow&#40;&#41;.

Internally, instead of representing cells as JavaScript objects, memory is split into fixed 32×32 chunks storing types and payloads in separate arrays &#40;Struct-of-Arrays&#41; to keep memory contiguous and make sequential scans cheap. The author tried larger chunks but found cache behavior worsened before memory usage improved, making 32×32 the best compromise. Formulas do not evaluate the AST directly; they compile to bytecode and run on a stack-based VM. Ranges are deliberately capped so a formula cannot allocate half a gigabyte and crash the browser, and lookup and aggregation functions such as VLOOKUP and SUMIFS use lazy RangeRef pointers rather than materializing full arrays. Titan includes 42 built-in functions covering math, logic, lookup and reference, conditional aggregation, text, and dates using the Excel 1900 system.

## HN discussion

Based on 2 selected comments and replies.

A brief two-comment exchange about scope. One commenter, who says they are also writing a spreadsheet "platform," asks what different features this engine offers. The author replies that they are not trying to build a platform: the goal is a simple, fast, headless spreadsheet engine that runs in the browser or Node.js and can be integrated through a straightforward WASM import, ideally serving as a building block for larger projects that need Excel-like computation without implementing an engine themselves. No other functionality or benchmarking claims are discussed.

Selected comments: [MiroslavPokorny](https://news.ycombinator.com/item?id=50013274) · [deathg0d](https://news.ycombinator.com/item?id=50014130)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50012880>)
