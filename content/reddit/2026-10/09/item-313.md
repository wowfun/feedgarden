---
publish: true
content_type: "post"
title: "Open-source Claude Code plugin adds Material Design 3 Expressive rules, 18 components and an MCP accessibility linter"
description: "A developer (/u/Prestigious-Bank2145) released a free, open-source Claude Code plugin, claude-md3-expressive, aimed at making Claude produce Material Design 3 (MD3) Expressive UI. The motivation came from building a live market dashboard wi"
date: "2026-10-09T13:44:24.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1lqxz/opensource_claude_code_plugin_md3_expressive/"
tags: ["source/reddit","topics/coding","topics/products"]
---

A developer &#40;/u/Prestigious-Bank2145&#41; released a free, open-source Claude Code plugin, claude-md3-expressive, aimed at making Claude produce Material Design 3 &#40;MD3&#41; Expressive UI. The motivation came from building a live market dashboard with Claude Code: the author says Claude's UI looked fine at a glance but drifted into repeating mistakes — 12px text in dialogs, hardcoded &#35;333 colors that break dark mode, icon buttons with no accessible name, selected tabs a screen reader cannot detect — requiring the same design rules to be re-explained each session.

The plugin has three parts. A skill loads when UI work is requested and supplies type roles, color roles, shape, motion, state layers, component dimensions and accessibility rules. Eighteen ready-made components ship as plain HTML, CSS and JS, including app bars, buttons, dialogs, text fields and tables, with light and dark variants. An MCP server written in plain Node with zero dependencies exposes eight tools Claude calls while working: tokens, purpose-to-type-role lookup &#40;for example, dialog body mapping to Body Medium 14sp&#41;, components, a done-checklist, a linter and a WCAG contrast checker.

The author says the linter is the most-used part, with Claude running it against its own output and fixing errors before declaring work done. Reported checks include missing control names, an active class without aria-pressed, dialog openers without aria-haspopup, skipped headings, static inline styles, px font sizes, hardcoded colors, and transition: all — each with line numbers and a suggested fix. Installation is via two commands that add a plugin marketplace and install the plugin; the user then asks for UI as usual.

The author lists limits: it is their interpretation of public MD3 guidance, not an official Google product; the linter checks rules rather than taste and cannot judge whether a layout looks cramped; CSS lacks real spring physics so motion tokens are cubic-bezier approximations; a 2023-or-newer browser is required for color-mix&#40;&#41; and :has&#40;&#41;; and the default palette is a cyan seed from the author's dashboard, with swapping documented and tests keeping contrast valid. The stylesheet and component set also work without Claude, distributed under MIT with 49 tests and green CI.

## Images and video

- [Image: Open-source Claude Code plugin: MD3 Expressive skill, 18 components, and an MCP linter for accessible UI](<https://preview.redd.it/s45bx3ju3guh1.png?width=140&height=140&crop=1:1,smart&auto=webp&s=ce88743c7ef29da747c7a7eab82d6e3d84e9c267>)
