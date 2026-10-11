---
publish: true
content_type: "post"
title: "Your coding agent finished. What would make you reject the result?"
description: "The author proposes a set of review scenarios for judging agent-generated work, built around the idea that passing tests and an approval are not sufficient evidence of correctness. The motivating example is an agent that builds a CSV export"
date: "2026-10-09T00:57:24.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:22:47.680Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ChatGPTCoding/comments/1x17xe0/your_coding_agent_finished_what_would_make_you/"
tags: ["source/reddit","topics/agents","topics/evaluation","topics/coding"]
---

The author proposes a set of review scenarios for judging agent-generated work, built around the idea that passing tests and an approval are not sufficient evidence of correctness.

The motivating example is an agent that builds a CSV export; the tests pass and someone approves it. Then the requirement changes: personal email addresses must be excluded. Nothing in the code has changed and the old tests are still green, but the author says they would not accept the result against the new requirement. That is why they want a completion record tying together the code revision, the requirement it was checked against, and the review — not just a green task.

Additional checks the author would add:

- Let a second worker take over, then have the first return; its old claim should not let it overwrite the current work.
- Approve a preview deployment, then attempt production; the approval should not carry over.
- Restart without the original chat and see whether the next worker can identify what is finished, what is uncertain, and what it is allowed to do next.

The author draws a distinction raised in discussion of an earlier checklist: partial completion is not the same as an unknown outcome. If a release was created but its announcement failed, restarting everything could duplicate the release; if the creation request timed out, the first step is to establish whether the release exists. Recovery should follow that distinction rather than a single "retry" button.

The author notes these are proposed tests, not results from a benchmark, and asks what would make others send back agent-generated work even when the code and tests look fine.
