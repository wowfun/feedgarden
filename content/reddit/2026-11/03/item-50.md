---
publish: true
content_type: "post"
title: "How to Get a Coding Agent to Ask Instead of Guess When Unattended"
description: "The main risk with unattended agents is confident code for an invented problem that only surfaces at review. Interactive modes already handle clarification well (e.g. plan mode asking before building), and a simple rule like asking if fi..."
date: "2026-11-03T15:36:23.000Z"
updated: "2026-11-04T16:00:39.769Z"
first_seen: "2026-11-04T16:05:03.654Z"
date_basis: "published"
feed_source: "reddit"
feed_source_id: "t3_1xmw6f6"
source_url: "https://www.reddit.com/r/ChatGPTCoding/comments/1xmw6f6/how_do_you_get_a_coding_agent_to_ask_instead_of/"
tags: ["source/reddit","topics/agents","topics/coding"]
---

The main risk with unattended agents is confident code for an invented problem that only surfaces at review. Interactive modes already handle clarification well &#40;e.g. plan mode asking before building&#41;, and a simple rule like asking if files or schema aren't specified helps. In background runs, though, a clarifying question in the transcript can be missed or a blocking question can stall the whole session if no one is there to answer. One approach described is putting the agent's question on a Kanban card and parking it, moving to other cards while waiting; the work can be resumed later when answered, though this doesn't help if everything downstream depends on that single answer.
