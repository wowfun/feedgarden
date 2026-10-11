---
publish: true
content_type: "post"
title: "Hermie: a local proxy that keeps API keys out of Claude Code's context"
description: "The author built Hermie, a small local proxy that sits between Claude Code and the API, to avoid the repeated workflow of opening an IDE to copy an API key into an env file when Claude Code asks for it. The mechanism is a placeholder swap. "
date: "2026-10-09T07:11:06.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1eprb/now_i_can_write_my_api_key_in_claude_code_without/"
tags: ["source/reddit","topics/security-privacy","topics/coding"]
---

The author built Hermie, a small local proxy that sits between Claude Code and the API, to avoid the repeated workflow of opening an IDE to copy an API key into an env file when Claude Code asks for it.

The mechanism is a placeholder swap. Before a request leaves the machine, Hermie replaces the real key with a placeholder token. Claude writes that placeholder into its Write call, and on the way in Hermie swaps the real value back into the tool call, so the actual key ends up in the .env file. The author says the cloud only ever sees the placeholder, and that stored request bodies show this.

Hermie's install-hooks command also makes Claude Code print a line each time a swap happens, so the behavior can be observed rather than trusted, which the author illustrates with a GIF. The project is on GitHub. The author is asking for feedback specifically on which key formats or clients Hermie misses.

## Images and video

- [Image: Now I can write my api key in Claude Code without let Claude know it.](<https://preview.redd.it/8pgo7a6u4euh1.gif?width=640&crop=smart&s=d0382537e96cd8fb5d63599aabc295b6a2910382>)
