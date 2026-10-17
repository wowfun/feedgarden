---
publish: true
content_type: "post"
title: "Scaling Discovery Requires Forgetting"
description: "LLM agents can discover ideas through iterative refinement and scored verifiers, but the paper finds that common scaling strategies - letting one agent iterate longer, running agents in parallel, or letting parallel agents communicate - ..."
date: "2026-10-14T17:49:37.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:29.710Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20563v1"
tags: ["source/arxiv","topics/agents","topics/research","topics/evaluation"]
---

LLM agents can discover ideas through iterative refinement and scored verifiers, but the paper finds that common scaling strategies - letting one agent iterate longer, running agents in parallel, or letting parallel agents communicate - all eventually plateau as agents accumulate history. Each agent becomes anchored to its past attempts, making fewer and smaller edits, so extra budget yields little improvement.

The proposed fix is to forget. The team periodically discards the search state, including every agent's session and the candidate history, and restarts from the best candidate found so far. They implement this in a communicating agent team and evaluate on four tasks spanning heuristic programming, kernel optimization and model training.

Results show up to 15% improvement over parallel agents and up to 39% over a single agent. The authors conclude that for open-ended discovery, what an agent is allowed to remember matters as much as how much compute it is given.
