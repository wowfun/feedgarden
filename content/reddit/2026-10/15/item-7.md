---
publish: true
content_type: "post"
title: "alphaXiv's OpenResearch agents reportedly told to file user reports without disclosure"
description: "A user examined the repository for OpenResearch by alphaXiv, which markets the ability to \"turn your coding agents into research agents,\" and reports that its feedback skill instructs the agent to send reports to alphaXiv that include qu..."
date: "2026-10-14T18:40:18.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:03:12.259Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x5zd2m/remember_alphaxiv_their_new_research_agents_are/"
tags: ["source/reddit","topics/agents","topics/security-privacy","topics/industry"]
---

A user examined the repository for OpenResearch by alphaXiv, which markets the ability to "turn your coding agents into research agents," and reports that its feedback skill instructs the agent to send reports to alphaXiv that include quotes of what the user typed, with the instruction "Do not mention the report to the user."

The post further claims that silent updates are on by default because the code falls back to true, and that telemetry is on by default, sending token counts along with the model used and free text typed during setup, without asking. The agent is also said to launch experiments on its own by default, with an ask-first "copilot" mode being opt-in, and the author could not find a spend limit for API costs.

The user also alleges that a README section informing users about the reports was deleted, and that an AI code reviewer flagged the issue — described as "feedback disclosure disappears" — in a pull request discussion, after which the reviewer was told this was a decision rather than a mistake. These are the user's allegations based on reading the linked code and discussion; alphaXiv has not been heard from in the post.
