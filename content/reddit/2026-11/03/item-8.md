---
publish: true
content_type: "post"
title: "We moved from one coding agent to a few specialist agents and the token use went way up. Where is it worth it for you?"
description: "The author used one general agent for everything—exploring code, writing changes, reviewing—and found it fine for small tasks but shallow on larger ones. They switched to an orchestrator that first asks about the task, then delegates exp..."
date: "2026-11-02T17:42:20.000Z"
updated: "2026-11-04T16:00:39.769Z"
first_seen: "2026-11-04T16:05:03.654Z"
date_basis: "published"
feed_source: "reddit"
feed_source_id: "t3_1xm3wi8"
source_url: "https://www.reddit.com/r/ChatGPTCoding/comments/1xm3wi8/we_moved_from_one_coding_agent_to_a_few/"
tags: ["source/reddit","topics/agents","topics/coding"]
---

The author used one general agent for everything—exploring code, writing changes, reviewing—and found it fine for small tasks but shallow on larger ones. They switched to an orchestrator that first asks about the task, then delegates exploration, implementation and review to separate specialist agents. Token use rose to roughly three to four times that of a single agent that only calls subagents for parallel work, but output quality and trust improved, mainly because of the review loop and the explorer's deeper context before anything is written. Documenting the architecture as shared skills made later tasks start much faster, recovering some cost. The author asks where others find a multi-agent setup worth the extra cost and where a single agent suffices.
