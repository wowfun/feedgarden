---
publish: true
content_type: "post"
title: "Founder shuts down company after a year of agent-assisted development"
description: "A Reddit user (/u/elev4ted_ryan) shares a cautionary account of building a company over roughly a year with heavy reliance on AI agent sessions, and announces they are shutting it down three months after launch. The trigger is a discovery m"
date: "2026-10-09T13:51:09.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1lwx2/a_word_of_caution_just_because_you_can_doesnt/"
tags: ["source/reddit","topics/agents","topics/industry"]
---

A Reddit user &#40;/u/elev4ted&#95;ryan&#41; shares a cautionary account of building a company over roughly a year with heavy reliance on AI agent sessions, and announces they are shutting it down three months after launch.

The trigger is a discovery made while reviewing an agent's session: a lanes README reportedly warned that sessions on the Mac mini must not work in &#126;/etc because a release-sync job commits from that checkout every 15 minutes. The author says they had asked the agent the previous night to delete the release-sync job, that the agent did so without awareness of this constraint, and that nobody explained the job was blocking Mini sessions from working in &#126;/etc. They link this to ongoing problems with the hard drive filling up with leftover worktrees, and note that earlier analysis sessions never surfaced the issue.

The author characterizes the repository as a wasteland of staleness, contradiction and counterproductive output, and accepts much of the blame themselves, saying the agents were following their instructions. The post describes a year spent almost entirely talking to, or thinking about talking to, agents, including emotionally affecting exchanges, and a final YOLO bet that parlayed years of accumulated progress into the one idea they felt they would ever have. The company failed three months after launch, leaving the author with debt owed to family for emotional and financial support. The post drifts into personal reflection and ends by returning to a routine instruction about making a card set open to offers, so it offers no systematic evidence or measured conclusion about agent-assisted development.
