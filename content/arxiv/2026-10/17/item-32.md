---
publish: true
content_type: "post"
title: "TIR-EC uses tool-calling RL and a tree teacher for emergency department prediction"
description: "Large language models can reason over both structured measurements and free-text records, which makes them attractive for emergency department prediction, yet most still fall short of conventional machine learning methods such as trees o..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21449"
tags: ["source/arxiv","topics/agents","topics/health","topics/models"]
---

Large language models can reason over both structured measurements and free-text records, which makes them attractive for emergency department prediction, yet most still fall short of conventional machine learning methods such as trees on EHR-based tasks. A controlled analysis traces the gap to two weaknesses: LLMs do not select informative features, and they misjudge what numerical values imply for risk even when given the right features.

TIR-EC is a tool-integrated reinforcement learning framework that targets both. It exposes EHR feature groups as tools the LLM can call, and it trains the model with rewards from a gradient-boosted tree teacher, which supplies a reference set of informative tools and a graded risk target. The method also distills task-specific clinical skills into the model weights through a reverse curriculum that gradually removes those skills from the prompt during reinforcement learning.

Evaluation on three clinical prediction tasks shows that the 4B agent achieves the highest macro F1 of all compared models, outperforms conventional machine learning baselines and is competitive with much larger frontier LLMs. Further analysis indicates that TIR-EC selects more useful evidence with fewer tool calls and combines measurements more effectively. The abstract does not list the individual task metrics or the frontier models compared, so the margin of improvement is not quantified. The design suggests that pairing external tool execution with a tree-based reward signal can close part of the gap between LLM agents and tabular baselines on structured clinical prediction.
