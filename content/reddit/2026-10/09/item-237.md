---
publish: true
content_type: "post"
title: "Nonprofit opens digital Leonardo da Vinci museum with code mostly written by Claude"
description: "A German nonprofit has launched Museum of Ages, whose first wing is a digital Leonardo da Vinci museum that runs in a browser, on phones, and is offered in seven languages. Five of those languages are machine translation and are labelled as"
date: "2026-10-09T09:47:35.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1h53t/our_nonprofit_built_a_digital_leonardo_da_vinci/"
tags: ["source/reddit","topics/agents","topics/coding","topics/products"]
---

A German nonprofit has launched Museum of Ages, whose first wing is a digital Leonardo da Vinci museum that runs in a browser, on phones, and is offered in seven languages. Five of those languages are machine translation and are labelled as such. Entry is free with no account required.

The wing includes navigable details such as cracks in the Mona Lisa's paint, a mirror view that reverses Leonardo's mirror writing, and 14 of 15 machines that visitors can start. Leonardo's last house is depicted on one day, 10 October 1517, a date known from a visitor's diary. The walk follows a fixed film-like path, so visitors cannot roam freely, and only one wing exists so far.

The team describes its build process: one coordinator session delegates work to agents, each in its own git worktree under a written brief naming the files it owns, with more than 30 checkers running before anything is merged. Paintings, drawings and notebook pages are reproductions, textures are CC0 photo scans, and a few props are CC0 models. Rooms and machines are built in code on three.js, with Claude writing most of it; of 15 machines, Claude Opus 5.5 wrote the 14 that move.

The repository manifest records which model wrote each machine's code. None of the 147 records names an image model, and 17 name a second model that wrote the fifteenth machine &#40;a parachute&#41;, the reading room's table and a bench. Claude drafts museum texts from a research file with a source for every fact, and the team corrects and approves every English and German text; translations of Leonardo's own words are machine-made and the pages say no person reviewed them. A separate Claude instance judges before-and-after images without being told which is new, and the better one ships. The code is AGPL-3.0 licensed, and the project states it uses no tracking cookies or profiling.

## Images and video

- [Image: Our nonprofit built a digital Leonardo da Vinci museum. Claude wrote most of the code.](<https://external-preview.redd.it/MHN2MHhxdWF4ZXVoMamRg6V3h5uhxz4TrnqVI6-nfH4ntp6JPidiy3QIdPB8.png?width=640&crop=smart&auto=webp&s=b4177a22a44ce7ac815905a3343381097b7b1534>)
