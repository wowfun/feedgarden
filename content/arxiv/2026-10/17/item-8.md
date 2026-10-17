---
publish: true
content_type: "post"
title: "SciΠvot: Benchmarking Principal-Investigator Judgment at Pivotal Moments of Scientific AutoResearch Agents"
description: "LLM agents can keep scientific experiments running for months with little human supervision, but the authors argue that reliable autonomous research also requires scientific judgment. Evaluating that judgment is difficult because researc..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21082"
tags: ["source/arxiv","topics/agents","topics/evaluation","topics/research"]
---

LLM agents can keep scientific experiments running for months with little human supervision, but the authors argue that reliable autonomous research also requires scientific judgment. Evaluating that judgment is difficult because research decisions are open-ended and depend on project context.

They construct SciΠvot, a 248-case benchmark of scientific judgment based on human corrections. It draws on records from six months of research in which senior researchers ran LLM agents on 26 projects across six scientific fields and repeatedly intervened to correct the agents' research judgments. In each case, an agent chooses between the original LLM plan and the human-corrected alternative, using only the project record available before the correction. The study compares LLM and human performance and examines the effects of reasoning effort, access to the project record and reconsideration.

At medium reasoning effort with the project record, models systematically preferred the original LLM plan over the human-corrected alternative, and four of five frontier models performed below chance on the selected cases. The highest accuracy in the project condition across tested models and reasoning-effort settings was 63.5%, compared with 73.4% for fresh researchers. At medium effort, every model had lower accuracy with the project record than without it, and reconsideration did not consistently improve overall accuracy. The authors conclude that frontier models still struggle with these research decisions even when a human-corrected alternative is available, and present SciΠvot as a way to evaluate scientific judgment systematically.
