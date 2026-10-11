---
publish: true
content_type: "post"
title: "Veda: An Agent-Native Operating System Built from Scratch in Rust"
description: "Veda is an operating system that treats an AI agent as a first-class part of the system rather than an assistant bolted onto a desktop. The author argues that operating systems were designed for a person at a keyboard, so assistants added l"
date: "2026-10-08T19:35:13.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/vahmoh25/Veda"
discussion_url: "https://news.ycombinator.com/item?id=50010881"
tags: ["source/hackernews","topics/agents","topics/hardware","topics/coding"]
---

## Article

Veda is an operating system that treats an AI agent as a first-class part of the system rather than an assistant bolted onto a desktop. The author argues that operating systems were designed for a person at a keyboard, so assistants added later must scrape the screen, imitate clicks, or rely on the few applications that expose an API. Veda inverts this: the agent is a system service, started at boot and restarted if it fails, represented as a small taskbar ring that sleeps until invoked by name, a click, or the Super+Space shortcut.

Every application speaks to the agent natively. An application describes its actions with typed parameters and a risk level, reports what it displays as structured state, and carries out actions through the same code paths as the keyboard and mouse, so results appear exactly as if the user had acted directly. The built-in applications together offer more than 70 actions. Everything is written from scratch in Rust and lives in the repository: the UEFI bootloader, a capability-based microkernel, drivers, system services, the window system, toolkit and applications. Mature crates supply TCP/IP &#40;smoltcp&#41;, TLS &#40;rustls&#41; and cryptography &#40;RustCrypto&#41;. It runs on x86-64 PCs, in QEMU and VirtualBox.

Consent is enforced by the system rather than the language model. Every action is classified as routine, sensitive or destructive; routine actions proceed, while the others wait for approval. The agent service holds the call until the user answers, only the desktop shell can answer, and the system identifies each program by the identity init attaches to its connections. Content the agent reads in a document or application cannot approve anything.

Each conversation starts with context: the time, the windows on screen, every application's actions, what the user has told the agent, and how the last conversation ended. While working it reads applications' live state. Memory stores only what the user states plainly, never the agent's own guesses, is kept on the user's computer, and can be viewed or forgotten entirely in Settings. Conversations are real-time and interruptible, with echo cancellation, an echo gate so the agent never hears itself, and other audio ducked while it speaks; a local voice detector listens while it sleeps so nothing leaves the machine when nobody speaks. Speech recognition, language model and voice come from Deepgram's Voice Agent platform, with audio opted out of model improvement, and the model, voice and even the agent's name are configurable in Settings.

## HN discussion

Based on 3 selected comments and replies.

Commenters were intrigued by the "close to metal" approach, contrasting it with work that specializes assistants for a particular CLI or code repository. One asked whether, given the project targets environments like QEMU, the author had tried pointing it at a local model, suggesting a reasonably quantized model such as Qwen 3.8 Flash could handle launching apps and shuttling system calls. The author &#40;vahmoh25&#41; replied that it is a valid point but that he has only just started, and believes there is significant potential for growth and success. One short reaction simply praised the work.

Selected comments: [tikimcfee](https://news.ycombinator.com/item?id=50018137) · [vahmoh25](https://news.ycombinator.com/item?id=50026314) · [xyzsparetimexyz](https://news.ycombinator.com/item?id=50019168)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50010881>)

## Images and video

- [Image: The Veda desktop, with the agent's window open](<https://github.com/vahmoh25/Veda/raw/main/docs/images/desktop.png>)
- [Image: The Text Editor with a Rust program](<https://github.com/vahmoh25/Veda/raw/main/docs/images/editor.png>)
- [Image: Files](<https://github.com/vahmoh25/Veda/raw/main/docs/images/files.png>)
