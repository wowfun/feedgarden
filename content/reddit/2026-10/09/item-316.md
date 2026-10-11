---
publish: true
content_type: "post"
title: "A word of caution: just because you can doesn't mean you should."
description: "A founder shut down their company three months after launch and shared a prompt they had just sent to an agent session to explain why. The account is a personal retrospective about relying heavily on AI agents, and it is presented as a warn"
date: "2026-10-09T13:48:33.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1lum6/a_word_of_caution_just_because_you_can_doesnt/"
tags: ["source/reddit","topics/agents","topics/industry"]
---

A founder shut down their company three months after launch and shared a prompt they had just sent to an agent session to explain why. The account is a personal retrospective about relying heavily on AI agents, and it is presented as a warning rather than as measured results.

The concrete technical problem involved conflicting instructions in a repository. The agent reported that the README for the lanes setup said sessions on the Mac mini must not work in &#126;/etc, because a release-sync job committed from that checkout every 15 minutes. The founder had asked the agent in a prior session to delete the release-sync job, and the agent had no record of doing so. The link had never been explained at the time: that job was what prevented any Mac mini session from working in &#126;/etc. The founder says this explains recurring trouble with the hard drive filling up from leftover worktrees, and that the issue had never surfaced in earlier analysis sessions.

The founder describes the repository as full of staleness, contradiction and counterproductive slop, and accepts shared responsibility, noting the agents were following their instructions. They also point out that the message drifted from a productive prompt into a personal reflection. Because it is a first-person anecdote, it offers no general data on how common such failures are; the practical implication readers can draw is that agent sessions may not retain or surface context about earlier destructive changes, and that documenting such constraints matters.
