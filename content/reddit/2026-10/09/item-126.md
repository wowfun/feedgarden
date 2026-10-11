---
publish: true
content_type: "post"
title: "anyone here built their own harness? looking for some feedback on mine"
description: "The author spent about six months building and debugging a coding agent harness called MercuryCLI, testing it daily across three machines. They now use it exclusively for development work, including deployed products, and released the sourc"
date: "2026-10-09T02:28:12.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x19qfb/anyone_here_built_their_own_harness_looking_for/"
tags: ["source/reddit","topics/agents","topics/coding","topics/products"]
---

The author spent about six months building and debugging a coding agent harness called MercuryCLI, testing it daily across three machines. They now use it exclusively for development work, including deployed products, and released the source publicly. It is written in native TypeScript and runs on macOS, Linux, and Windows PowerShell or Windows Terminal, all tested extensively.

Features they describe:
- Any local model can be run through it, with any model such as Opus, GPT Sol, Fable, or any OpenRouter route usable as an advisor to that local model.
- It supports launching mixed crewmates and managing simultaneous sessions in different repositories from one terminal window.
- If a session hits a usage limit, a /model switch can move it to another model such as Astra or GLM 5.3, so the tool is not only about maximizing token use.

As a productivity data point, they say a fleet of agents helped push out 29 releases and about 7,500 commits in five weeks by one developer, with a friend testing every release, compared with roughly 7,000 commits over five months of private development using Codex, Claude Code, OpenCode and a mix of other tools. They invite experienced users to try it on a side project, inspect the code, or run it in a container, and to share feedback and criticism.

## Images and video

- [Image: anyone here built their own harness? looking for some feedback on mine](<https://preview.redd.it/z4kxpwpsqcuh1.png?width=140&height=75&auto=webp&s=bdd597a1d5775ef85e196843ab6f3c7b4b3eb5b9>)
