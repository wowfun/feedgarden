---
publish: true
content_type: "post"
title: "I Deleted 168,000 Lines of Comments. My AI Agent Didn't Notice"
description: "The discussion centers on a comment-deletion experiment reported in the post, in which roughly a third of a codebase was comments, all were removed, and an AI agent produced equally good code with or without them across three runs each. ..."
date: "2026-10-14T16:34:53.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://openstation.blog/2026/10/13/i-deleted-168000-lines-of-comments-my-ai-agent-didnt-notice/"
discussion_url: "https://news.ycombinator.com/item?id=50090484"
tags: ["source/hackernews","topics/coding","topics/agents","topics/evaluation"]
---

## HN discussion

Based on 7 selected comments and replies.

The discussion centers on a comment-deletion experiment reported in the post, in which roughly a third of a codebase was comments, all were removed, and an AI agent produced equally good code with or without them across three runs each. One commenter proposes a more granular follow-up: removing all, half or most comments, and replacing portions with slightly or very incorrect comments, to find where correctness and token usage inflect. Another reads the result through the lens of the bitter lesson—scaling general approaches winning over domain-specific understanding—though a reply objects that the bitter lesson concerns AI development approaches, not details of applied LLM use. Others argue quality is not the right metric: with a maintained AGENTS.md, differences should show up in tool-call counts and usefulness over longer, more complex, multi-session work, where well-kept comments may cut wasted calls. One commenter questions whether the comments were AI-generated in the first place, making the agent's reading context similar to its writing context, and asks for a human-written test. A practical note favors comments that record why something was broken, since a rollback was traced to such a comment, and another sees value where comments feed specs like OpenAPI that the agent cannot read from code.

Selected comments: [phil-martin](https://news.ycombinator.com/item?id=50091978) · [andyjohnson0](https://news.ycombinator.com/item?id=50092096) · [skeledrew](https://news.ycombinator.com/item?id=50092987) · [huijzer](https://news.ycombinator.com/item?id=50091960) · [sinn357](https://news.ycombinator.com/item?id=50099631) · [benoau](https://news.ycombinator.com/item?id=50092090)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50090484>)
