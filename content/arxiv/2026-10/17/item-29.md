---
publish: true
content_type: "post"
title: "Jev-LiteMAS replaces token-heavy routing and review with a lightweight decision model"
description: "Multi-agent LLM systems use generative models for expert execution, workflow planning and artifact review, but many coordination steps are only bounded decisions such as picking the next expert or judging whether an artifact is good enou..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21411"
tags: ["source/arxiv","topics/agents","topics/inference"]
---

Multi-agent LLM systems use generative models for expert execution, workflow planning and artifact review, but many coordination steps are only bounded decisions such as picking the next expert or judging whether an artifact is good enough. Profiling three representative multi-agent frameworks, the authors find that routing and review account for 31.7-43.5% of generative-LLM tokens.

Swapping those operations for a cheap decision model creates two interface gaps. Generative planners produce execution plans and handoff instructions, which a bounded decision cannot supply &#40;the planning gap&#41;, and reviewers provide actionable feedback for repairing flawed artifacts, which screening alone cannot supply &#40;the review gap&#41;. Jev-LiteMAS bridges both by pairing a lightweight decision model called Jev with generative execution and feedback.

For planning, Jev selects experts dynamically from the task and prior expert outputs, grounding later execution in accumulated context instead of a pre-generated trajectory. For review, Jev screens intermediate artifacts against task criteria: passing artifacts proceed directly, while flagged ones go to an LLM for re-review, acceptance or corrective feedback.

Across four benchmarks and two backbones, Jev-LiteMAS reduced generative-LLM tokens by 12.7-54.6% relative to LAS while keeping accuracy within 1.34 percentage points, and it lowered latency in seven of eight settings. The authors also report that grounding routing in substantive expert outputs prevents up to 18.0 points of accuracy loss, indicating that where the decision model gets its context matters as much as its size.
