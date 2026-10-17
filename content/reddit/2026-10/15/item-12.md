---
publish: true
content_type: "post"
title: "I built an MCP server with Claude Code that lets Claude search and apply to jobs. Here's how the build went (and what you can learn)"
description: "After an earlier post about a job search platform he started building with Claude Code, the author says the most common question was whether people could do this from inside Claude. So the team built an MCP server, again mostly with Clau..."
date: "2026-10-14T19:16:03.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:05:18.966Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x60bmf/i_built_an_mcp_server_with_claude_code_that_lets/"
tags: ["source/reddit","topics/agents","topics/coding","topics/products"]
---

After an earlier post about a job search platform he started building with Claude Code, the author says the most common question was whether people could do this from inside Claude. So the team built an MCP server, again mostly with Claude Code. It launched the previous Thursday and now has 450 users with 75 daily active. The author also reports 83 interviews per 100 paid subscribers who use autopilot, since their X announcement.

What it does: you add the MCP and can immediately search the jobs database for free, drop in a resume to see matches, get custom tailored resumes, and have the backend submit on the employer's own site once you approve. You can set a schedule so an agent gives you new matches every day. They pull in about 15K new jobs per day.

How they built it with Claude, as lessons the author suggests mimicking:

- One capability list for the web app and the MCP. Claude Code built a typed registry of everything a user can do on the website. Each MCP tool is generated from that registry, so a feature added to the web app shows up in the MCP. If a capability is deliberately kept out of the MCP, the code has to state why or it does not compile.
- Start with a mega-PR series on day 1. A handoff doc describing the desired server, based on the web app, was split by Claude Code into 12 PRs, one per capability: search, application prep, readiness checks, document handling, submissions, inbox and so on. Each PR ran integration tests against the real Postgres.
- Create a hosted version with OAuth. Claude Code wrote the HTTP server and an OAuth 2.1 sign-in flow with dynamic client registration and PKCE, so it can be added as a connector in claude.ai without pasting an API key. On discoverability, the author notes you must submit connectors to Anthropic for approval for them to appear in the connector library.
- Figure out what can and cannot be done in the chat UI. They needed to send edited resumes that kept the PDF formatting. They settled on a download link that lasts 10 minutes, because the specialized formatting used to increase interview chances would not survive if the local agent rewrote it.
- Dogfood hard. They used the connector themselves, applied to real jobs, and wrote down 20 things that felt wrong, then 10, then 5, then 1, then zero. After reaching what they thought was bug zero, their first power users recommended another 30+ changes, which they have since implemented. Because LLMs are probabilistic, they say you need to keep testing and iterating; the number of scenarios power users hit that you did not anticipate is enormous.

On pricing, job search, setting up notifications for new matches, resume editing and many other features are free via the MCP; payment starts with the auto-submission feature, because those tokens are expensive.

## Media

![Image: I built an MCP server with Claude Code that lets Claude search and apply to jobs. Here’s how the build went &#40;and what you can learn&#41;](<https://external-preview.redd.it/aG53a3NhenljaHZoMVbsotEFYFzHUfwHlfPArts0mbbllCMKYJjr5sAoDp74.png?width=640&crop=smart&auto=webp&s=3b9f35c715871aa4fe11a1dd362636a794835dfa>)

[Image: I built an MCP server with Claude Code that lets Claude search and apply to jobs. Here’s how the build went &#40;and what you can learn&#41;](<https://external-preview.redd.it/aG53a3NhenljaHZoMVbsotEFYFzHUfwHlfPArts0mbbllCMKYJjr5sAoDp74.png?width=640&crop=smart&auto=webp&s=3b9f35c715871aa4fe11a1dd362636a794835dfa>)
