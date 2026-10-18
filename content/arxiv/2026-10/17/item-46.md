---
publish: true
content_type: "post"
title: "From Research Goals to Scientific Closure: Evaluating Agents Through Evidence-Supported Physics Research"
description: "The paper introduces PhysClosureBench, a benchmark of 50 expert-verified, goal-specified research tasks in strong-field, attosecond and neighboring physics, to test whether AI agents can organize scientific investigations that reach well..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21767"
tags: ["source/arxiv","topics/agents","topics/evaluation","topics/research"]
---

The paper introduces PhysClosureBench, a benchmark of 50 expert-verified, goal-specified research tasks in strong-field, attosecond and neighboring physics, to test whether AI agents can organize scientific investigations that reach well-supported conclusions. Each task states the research objective and essential scientific constraints but leaves the agent to organize the investigation and decide how to generate and validate evidence.

Two measures are used. A 20-criterion Atomic Score captures local scientific accomplishment, while Research Closure &#40;RC0–RC4&#41; rates how fully the investigation resolves the specified question, based on whether indispensable evidence requirements and applicable scope conditions are met.

Seven frontier LLMs were evaluated. Claude-Opus-5 achieved the highest mean Atomic Score at 6.29/10 but reached RC4 in only 32.7% of attempts. Across the benchmark, 36.2% of attempts scoring at least 8/10 still fell short of RC4, and all seven models reached RC4 on substantially fewer tasks in all three runs than in at least one. Case-level analysis traces incomplete closure to misinterpretation of generated results and unresolved physical applicability limits. The authors describe a persistent gap between agents' local scientific accomplishments and complete research closure.
