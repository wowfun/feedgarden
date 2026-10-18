---
publish: true
content_type: "post"
title: "GraphACM: Graph-based Action Consistency Measurement for Uncertainty Quantification in LLM Agents"
description: "Repeated executions of the same task can reveal whether an LLM agent is reliable: if its behavior is consistent, success is more likely. Existing approaches usually summarize consistency with a single task-level score, without showing wh..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22031"
tags: ["source/arxiv","topics/agents","topics/evaluation"]
---

Repeated executions of the same task can reveal whether an LLM agent is reliable: if its behavior is consistent, success is more likely. Existing approaches usually summarize consistency with a single task-level score, without showing where behavioral differences arise or whether actions are being compared under equivalent decision contexts.

The authors propose a graph-based framework for fine-grained behavioral consistency measurement and uncertainty quantification. Given multiple rollouts of the same task, it merges equivalent states into a directed, action-labeled graph, so that actions can be compared at shared decision states. It then defines node-level and global measures of action consistency and uses the global score as a proxy for uncertainty when predicting task success or failure.

Experiments with three LLMs on ALFWorld, AppWorld and WebShop show that the measure is positively associated with task success and achieves an average AUROC of 0.811 for predicting success. That beats the strongest behavioral-consistency baseline &#40;0.729&#41; and verbalized confidence &#40;0.769&#41;. The authors argue that state-conditioned behavioral consistency is an effective signal and can pinpoint where agent actions agree.
