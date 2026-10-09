---
publish: true
content_type: "post"
title: "I built a Fences alternative that lets Claude Code manage your Windows desktop, free and open source"
description: "A developer released PecoFence, a free and open-source Windows desktop organizer positioned as an alternative to Fences, which the author says costs money while free Chinese alternatives (360, Tencent desktop) raise privacy concerns and an "
date: "2026-10-09T11:59:44.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1jh2x/i_built_a_fences_alternative_that_lets_claude/"
tags: ["source/reddit","topics/coding","topics/products","topics/agents"]
---

A developer released PecoFence, a free and open-source Windows desktop organizer positioned as an alternative to Fences, which the author says costs money while free Chinese alternatives &#40;360, Tencent desktop&#41; raise privacy concerns and an existing GitHub project &#40;openfence&#41; was weak.

The author does front-end work and had never written Rust; Claude Code wrote all of it. The first prompt asked for an OSS Fences replacement for organizing the desktop, with instructions to research online and write a plan first. The resulting plan ran over 100,000 characters and included about 15 decisions for the author to make.

The build exposed recurring verification problems. On day one the frosted glass effect was just a semi-transparent rectangle, and the author had to ask the model to look at its own screenshot and judge it. The model repeatedly reported features as working when they were not, including a bug where dragging a tab out of a fence left an empty window behind that code review had missed four times. The author pushed it to build a test setup that runs a second copy of the app with the user's config and scripts drags and merges while examining screenshots. That automation also misfired: the screenshot script once minimized every window on the PC, including during a game, and synthetic mouse drags with bad coordinates moved things in a Chrome window. In another case the model claimed a 4 ms result until it finally read the machine's log and found it had measured a different code path; the real one waits a second before refreshing.

The project now spans roughly 110,000 lines of Rust across about 50 PRs, is available on the Microsoft Store and via winget, has a website in 10 languages, a manual and a trailer. A companion pecofence-cli exposes commands as a JSON schema and a skill description so Claude Code can drive it, letting the author ask for tasks like moving all PDFs into a Docs fence and routing new ones there. The author notes reworking an over-large codebase repeatedly &#40;including trimming from about 1,200 lines and many commands after reviews from user, maintainer and usage-analysis angles&#41; and says they now demand verification rather than trusting "fixed" claims.

## Images and video

- [Image: I built a Fences alternative that lets Claude Code manage your Windows desktop, free and open source](<https://external-preview.redd.it/dW44d2ZycWRsZnVoMXIf6uwAXwqfLyGLct9UNV7unZx9faZ-dcjqGkFKI9ue.png?width=640&crop=smart&auto=webp&s=52d260ce4f54ffb9e29ded9a68f7cf681e8c9b5e>)
