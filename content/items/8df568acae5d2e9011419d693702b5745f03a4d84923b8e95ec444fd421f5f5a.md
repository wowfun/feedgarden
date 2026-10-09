---
publish: true
content_type: "post"
title: "OnTrack: Real-Time Monitoring and Intervention in LLM Agent Trajectories via Streaming Structure-Aware Optimal Transport"
description: "LLM agents are increasingly deployed in domains such as trip planning, stock trading and IT incident triage, and most run autonomously with little rule-based safeguarding, so irreversible actions can burn cost or cause harm. Existing fixes "
date: "2026-10-08T17:32:08.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:47.674Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12375v1"
tags: ["source/arxiv","topics/agents","topics/evaluation"]
---

LLM agents are increasingly deployed in domains such as trip planning, stock trading and IT incident triage, and most run autonomously with little rule-based safeguarding, so irreversible actions can burn cost or cause harm. Existing fixes either add a monitor agent at every step, which raises cost and latency, or evaluate logs after the run, when tokens are already spent and damage done.

The paper proposes OnTrack, a streaming monitoring mechanism that compares an agent's steps and dependencies against recorded successful runs, letting it alert users or block the agent at roughly a millisecond per step. The authors study three regimes of decreasing access: full reference access &#40;historical runs plus tool schemas&#41;, intermediate access &#40;tool schemas only&#41;, and no prior knowledge &#40;only step logs as generated&#41;. They expect monitoring capability to decline as access drops, from detecting plan violations down to identifying loops, stalls and repeated tool calls.

OnTrack is evaluated on SWE-bench trajectories. Using only the first 8 steps, it ranks failing trajectories below succeeding ones better than content-similarity approaches, with a +0.057 AUROC gain. Paired with an abort policy, it saves about 18% of the compute that would be spent on failing runs, and 83% of interrupted runs were genuinely heading to failure &#40;5 of 6 aborts were correct&#41;.
