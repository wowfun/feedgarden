---
publish: true
content_type: "post"
title: "Fable 5.1 in Claude Cowork: different results, possible new checkpoint"
description: "A Reddit user reports that the model referred to as Fable 5.1 appears to behave differently depending on where it is used, after monitoring the behavior over several days. They suspect either that a newer checkpoint is being routed in the b"
date: "2026-10-09T12:05:18.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1jlk3/fable_51_different_results_in_claude_cowork_new/"
tags: ["source/reddit","topics/models","topics/evaluation"]
---

A Reddit user reports that the model referred to as Fable 5.1 appears to behave differently depending on where it is used, after monitoring the behavior over several days. They suspect either that a newer checkpoint is being routed in the background or that the difference is an unusual coincidence.

The specific observations: when a project with local folders is added in Claude Cowork, Fable 5.1 does not know the Tibo Reset Guy, while the same model asked normally in a chat outside a project does know it. In Claude Code, they say, Fable no longer knows Tibo either. A second comparison uses a pelican test, a prompt asking for an SVG of a pelican riding a bike; it produced very different results once with high reasoning, where the model knows Tibo, and once in an empty project in Cowork, where it does not, and the poster describes the latter outcome as looking just as bad as the Claude Code high-reasoning output.

The poster judges the gap too large to be coincidence and asks whether others have seen the same pattern, speculating about silent routing to a newer Fable version. The post is a single user's anecdotal comparison with screenshots rather than a controlled evaluation, and it offers no confirmation that any checkpoint has changed.

## Images and video

- [Image: Fable 5.1: Different Results in Claude Cowork - NEW Checkpoint of Fable &#40;5.5&#41;?](<https://preview.redd.it/zgzfwqsejfuh1.png?width=140&height=105&auto=webp&s=b854e3a0fde50b573f492a534eccc6af38f91f4b>)
