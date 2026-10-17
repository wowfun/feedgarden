---
publish: true
content_type: "post"
title: "Show HN: Ito – Build Terminal UIs in Lua"
description: "Ito is a new terminal user interface library written in Lua, released alongside a harness named uji. The authors describe themselves as heavy Neovim users who wanted a terminal harness they could customize as freely as they customize the..."
date: "2026-10-14T22:23:53.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://uji.sh/ito/"
discussion_url: "https://news.ycombinator.com/item?id=50096300"
tags: ["source/hackernews","topics/coding","topics/open-source","topics/products"]
---

## Article

Ito is a new terminal user interface library written in Lua, released alongside a harness named uji. The authors describe themselves as heavy Neovim users who wanted a terminal harness they could customize as freely as they customize their editor. They considered an existing JavaScript-based option but chose Lua, reasoning that it fits their preferences and could be paired with a Rust base for speed.

The design is minimal at its core, and according to the authors essentially every built-in abstraction is available in Lua: how providers are defined and how the interface is themed and extended. Rather than following the approach of an existing Rust TUI framework, the pair decided to make it possible to build terminal UIs directly in Lua, which resulted in the ito library.

To showcase the library, one author wrote a custom canvas implementation instead of relying on the usual terminal adapter, exported it to WebAssembly, and used it to build a website where visitors can experiment with building UIs in Lua. An llms.txt file is provided for people who prefer to generate code with an AI assistant.

The library is hosted at github.com/uji-labs/ito and the associated harness at github.com/uji-labs/uji. The post does not report benchmarks, adoption figures or comparisons against other libraries beyond the remark about JavaScript and Rust.

## HN discussion

Based on 8 selected comments and replies.

A commenter with Neovim experience congratulated the authors and suggested building a declarative rendering engine on top of Neovim itself, since every install already provides a grid, extmarks, floating windows and a Lua runtime; they said they had built more than 14 interactive TUI applets on their own engine, covering tools such as docker, kubernetes, systemd, AWS and GitHub, plus region-specific keymaps and read-only regions.

Several commenters questioned how idiomatic the Lua code is. One argued the API reads better with parenthesis-free calls and suggested a form where named keys act as options and numerically indexed entries act as children. Another disagreed with that diagnosis, saying idiomatic Lua is less about parenthesis-free calls and more about expressiveness and use of basic language features, objecting instead to the pattern where a field is created on one line and then mutated through a chain of method calls.

Other replies were more enthusiastic: one commenter praised the declarative API and mused about a universe where browsers ran native LuaJIT instead of JavaScript, drawing a friendly reply from the author, while a short comment simply read "Hqtui".

Selected comments: [jrop](https://news.ycombinator.com/item?id=50103842) · [Yannik&#95;Sc](https://news.ycombinator.com/item?id=50101035) · [otikik](https://news.ycombinator.com/item?id=50101138) · [hollowturtle](https://news.ycombinator.com/item?id=50100813) · [buffer&#95;overlord](https://news.ycombinator.com/item?id=50102200)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50096300>)
