---
publish: true
content_type: "post"
title: "Developer reports Sonnet 5.5 plans worse than Sonnet 5 in an RTS agent harness"
description: "A Reddit user (/u/coding_is_tedious) built a harness for agents to play real-time strategy games, starting from building an actual RTS and then becoming more interested in agents playing it. The setup uses a \"commander\" style: a script hand"
date: "2026-10-09T14:19:49.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1mmuq/sonnet_55_worse_at_planning_than_sonnet_5_in_rts/"
tags: ["source/reddit","topics/evaluation","topics/agents","topics/models"]
---

A Reddit user &#40;/u/coding&#95;is&#95;tedious&#41; built a harness for agents to play real-time strategy games, starting from building an actual RTS and then becoming more interested in agents playing it. The setup uses a "commander" style: a script handles immediate decisions such as clicks, while an agent is called periodically to adjust the plan through a handful of levers. Because it runs through the API, the author used Sonnet 5 for cost and speed.

Among observations: Fable formulates a strategy of its own, whereas Opus and lower-tier models tend to follow a script. Sonnet 5 held to a plan when given a seed &#40;for example, train heavy infantry&#41;, did not modify it much, and at least appeared to understand it had a mission. The author was excited to test Sonnet 5.5, expecting at least some gain in reasoning.

Instead, they describe a reversion. Given the same plan, Sonnet 5.5 was "all over the place," did not appear to recognize it had any mission, and seemed to forget that the plan was being continuously injected into the prompt. The author notes a contrast: Sonnet 5.5 has been an excellent coder when orchestrated by Fable 5.1, following a plan well and requiring few follow-up changes; the first tests in the harness also function as a reading-comprehension check that a model understands the data it receives.

The author stresses the result probably means nothing on its own given many variables, and that everything was built with Claude Code, which they liken to the blind leading the blind. The harness is published at a GitHub repository under the author's account. No quantitative benchmark scores are reported.
