---
publish: true
content_type: "post"
title: "Our coding agent got stuck in a loop and burned $3,200 overnight"
description: "A team of five let a coding agent pick up tickets overnight and open PRs so that work would be waiting in the morning. Tuesday ended normally, but Wednesday morning the billing dashboard showed an unusual spike. Investigation showed the age"
date: "2026-10-09T13:02:01.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:22:47.680Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ChatGPTCoding/comments/1x1ks1u/our_coding_agent_got_stuck_in_a_loop_and_burned/"
tags: ["source/reddit","topics/agents","topics/coding","topics/industry"]
---

A team of five let a coding agent pick up tickets overnight and open PRs so that work would be waiting in the morning. Tuesday ended normally, but Wednesday morning the billing dashboard showed an unusual spike.

Investigation showed the agent hit a flaky test that kept failing and decided the fix was to rewrite the test with a slightly different approach — 4,800 times between 11:40pm and 6:15am. That cost &#36;3,200 in tokens, on a team that budgets &#36;600 per month for agents.

The team had a spend alert configured for the whole organization, but nothing per run, because usage only appeared on the monthly bill and nobody checked in between. The ticket itself was a one-line configuration change. The author characterizes the agent as doing exactly what agents do when nothing tells them to stop, and the team had to explain the incident to finance and send an awkward message in the engineering channel.

The changes they made afterward: a hard budget per run, a maximum retry count per tool call, and the agent stops and opens a draft PR if it hits either limit. The author says these safeguards should have existed from day one, and asks how others cap spend on overnight runs.
