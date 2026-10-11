---
publish: true
content_type: "post"
title: "Agents in the Cloud"
description: "The submission presents a project called Agents in the Cloud, framed as a way to take a coding agent off a single laptop and run it in an isolated cloud environment — and to run many such environments rather than one. The pitch is that ever"
date: "2026-10-08T20:29:23.000Z"
updated: "2026-10-10T05:10:37.706Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://agentsinthecloud.com/"
discussion_url: "https://news.ycombinator.com/item?id=50011738"
tags: ["source/hackernews","topics/agents","topics/coding","topics/open-source"]
---

## Article

The submission presents a project called Agents in the Cloud, framed as a way to take a coding agent off a single laptop and run it in an isolated cloud environment — and to run many such environments rather than one. The pitch is that every small task gets a fresh environment, so agents keep working after the laptop is closed, users get a mobile experience while away from their desk, and the cloud can be nothing more than the user's own computer sitting in a closet. The project is described as free, open source, and compatible with any model or subscription, with instructions offered for a Mac and for a server.

The very short announcement reads like a terminal and editor mockup: a Claude Code session in &#126;/app reading src/auth/login.test.ts, editing src/auth/login.ts with a +3 −1 diff, running npm test to 42 passing tests, and a git status showing the single modified login file. It also shows an Opus and Claude Max subscription, an editor explorer pane with auth and api files, and a browser tab at localhost:3000/login next to a Ghostty terminal window. Those fragments suggest the intended workflow — browser, terminal and VS Code against a remote environment running the user's choice of coding agent.

## HN discussion

Based on 2 selected comments and replies.

Commenters treat the submission page as a weak introduction to the project and point readers to the announcement videos and the GitHub README instead. One commenter calls it well thought out and says it appears to surpass an existing similar tool; features they highlight include strong isolation between workspaces, with a Docker container per workspace and no network communication between workspaces by default, support for whichever coding agent the user prefers, and a web interface that improves on the agents' own UIs.

That praise comes with a caveat about project governance. The maintainer of the comparable tool says the work is good enough that he considered abandoning his own project and moving over, but that the contribution policy is not there, since submitted PRs and discussions on social media went nowhere. Rather than fork it and take on another maintenance burden, he plans to slow his own project to monthly releases, excluding hot fixes and bug fixes, and to keep automating deployments and maintaining per-agent extensions and working networking.

Selected comments: [rahimnathwani](https://news.ycombinator.com/item?id=50014358) · [rcarmo](https://news.ycombinator.com/item?id=50027272)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50011738>)
