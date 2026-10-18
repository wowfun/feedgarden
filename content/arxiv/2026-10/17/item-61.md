---
publish: true
content_type: "post"
title: "AutoSFT Splits SFT Data Work Across Agents to Cover More Data Actions"
description: "Language model agents that automate post-training tend to converge on supervised fine-tuning and spend most of their effort revising training data. Existing systems give an agent only one kind of control—selecting rows from a fixed pool ..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22194"
tags: ["source/arxiv","topics/agents","topics/models"]
---

Language model agents that automate post-training tend to converge on supervised fine-tuning and spend most of their effort revising training data. Existing systems give an agent only one kind of control—selecting rows from a fixed pool or calling a generator—whereas a human data engineer adjusts proportions, prunes, repairs, replaces and synthesizes examples. The authors define a data action space covering these operations and test whether an automated system can perform the full range and what structure that requires.

A single agent reaches only one action, adjusting category proportions, while its context fills with execution output that is discarded mid-search. AutoSFT is a multi-agent system in which a meta agent separates execution from analysis, gathers proposals from independent angles, and calls a synthesis subagent for capabilities the pool cannot cover. The model, trainer and budget are fixed within each comparison. Adding each component helps: the executor halves context loss, analysis subagents lift the best IFEval score by 6.5 points, and synthesis adds 3.4 IFEval and 2.9 IFBench points. The same loop transfers to code, where analysis adds 3.7 MBPP+ over a single agent that does not improve.

Every result comes from runs that retrain from the base model each round, so each component's effect is individually attributable. The authors conclude that automating SFT data research depends more on covering diverse data actions than on a stronger single action.
