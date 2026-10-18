---
publish: true
content_type: "post"
title: "DeciCAD: Harness-Grounded Learning of Action Policies for CAD Agents"
description: "The paper studies how the decision space exposed by an agent harness shapes LLM behavior and policy learning in computer-aided design (CAD), a domain characterized by persistent state, geometric constraints and long-horizon procedures. T..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21755"
tags: ["source/arxiv","topics/agents","topics/models"]
---

The paper studies how the decision space exposed by an agent harness shapes LLM behavior and policy learning in computer-aided design &#40;CAD&#41;, a domain characterized by persistent state, geometric constraints and long-horizon procedures. The authors introduce DeciCAD, a domain-native harness that exposes semantic CAD actions, decision-oriented observations, environment feedback and persistent state transitions.

On top of the harness, they build a learning pipeline that extracts causal decision supervision from interaction trajectories and improves the policy with supervised fine-tuning &#40;SFT&#41; and geometry-grounded online reinforcement learning &#40;RL&#41;. Across four CAD benchmarks, DeciCAD reports the best F1 and intersection over union &#40;IoU&#41; while cutting model-output tokens by 45–88% compared with a general-purpose coding harness.

Under matched supervision, its SFT policy raises F1 from 0.6883 to 0.7437 and outperforms the coding policy; subsequent online RL lifts geometry availability from 66.5% to 73.5% and F1 to 0.7880. The authors conclude that the decision space induced by a harness materially affects both how agents execute CAD tasks and how well policies can be learned.
