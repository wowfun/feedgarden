---
publish: true
content_type: "post"
title: "notMyShell (NMSh): more than just terminal eye candy"
description: "The author has been building notMyShell (NMSh), an open-source terminal frontend intended to make the everyday terminal experience nicer both visually and functionally, without replacing an existing setup. The design goal is to keep the use"
date: "2026-10-08T22:49:38.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x158fa/notmyshell_nmsh_more_than_just_terminal_eye_candy/"
tags: ["source/reddit","topics/coding","topics/products","topics/hardware"]
---

The author has been building notMyShell &#40;NMSh&#41;, an open-source terminal frontend intended to make the everyday terminal experience nicer both visually and functionally, without replacing an existing setup. The design goal is to keep the user's preferred terminal emulator, such as Ghostty or Kitty, and their real zsh, Bash or Fish shell, along with existing commands, aliases and functions. It also supports prompt tools including Starship, Powerlevel10k and Oh My Posh, and almost everything is configurable.

Feature areas described include: CHROMA styling with gradients, color effects, animated command feedback, custom themes, prompts, cursor effects, screensavers and a small cat; built-in menus for discovering and configuring utilities such as eza and fzf, so a plain setup can be upgraded without prior knowledge; autocomplete and suggestions covering command completion, syntax highlighting and predictive suggestions; a persistent input area kept separate from scrolling output; and history and sessions with search, navigation, folding and revisiting of command output, plus detaching, resuming and switching between persistent sessions.

A /btw command provides plain-English help, similar to tldr but more context-aware: it can explain what a command does, why the last command failed, how to push the current branch, or manage files and settings, and it guides users through supported actions rather than only showing examples. The project requires no AI, though an optional local model is supported. It is still in development, and the author stresses that users need not adopt all of it and that it is meant to work with an existing setup rather than replace everything.

The accompanying demo video was itself made with Claude; the author acknowledges it is too fast and chaotic, having crammed too much into a short showcase, and plans a slower-paced video for a future release. The project is open source and the post invites feedback on what people would change or want to see.

## Images and video

- [Image: notMyShell: NMSh, more than just terminal eye candy.](<https://external-preview.redd.it/eXNlMDB1b2JsYnVoMXLNCMQNU9CMBDTSnFVj1nzSpKfwH2n1XMkJFpvRaXrn.png?width=640&crop=smart&auto=webp&s=4d13a33384d5c3c7122af20a4c466004d6e326eb>)
