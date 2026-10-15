---
publish: true
content_type: "post"
title: "Accurate but Not Humble: Evaluating Epistemic Humility in LLM Agents under Knowledge Conflict"
description: "When retrieved evidence contradicts an agent's prior beliefs, does it revise its answer, acknowledge uncertainty, or persist with an incorrect conclusion? Existing evaluations of agentic systems focus primarily on task success and offer ..."
date: "2026-10-08T17:25:06.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:47.674Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12360v1"
tags: ["source/arxiv","topics/evaluation","topics/agents","topics/research"]
---

When retrieved evidence contradicts an agent's prior beliefs, does it revise its answer, acknowledge uncertainty, or persist with an incorrect conclusion? Existing evaluations of agentic systems focus primarily on task success and offer limited insight into how agents handle such conflicts. The authors propose evaluating agents on epistemic humility &#40;EH&#41;: the willingness to recognize, act on and communicate uncertainty during task execution.

They operationalize EH through three trajectory-level behavioral dimensions — Identify, Solve and Escalate &#40;ISE&#41;. Knowledge conflict arises when the backbone model's parametric knowledge contradicts the evidence it encounters, or when two contextual sources disagree. The authors evaluate two conflict settings, controlled conflict and naturally occurring conflict during multi-step agentic execution, each paired with matched no-conflict controls.

Evaluating four agents, they find that higher task accuracy does not necessarily correspond to greater epistemic humility: some high-accuracy configurations recognize conflicts during execution but do not communicate unresolved uncertainty in their incorrect final answers. Trajectory-level analysis further shows agents frequently detect conflicts in early steps but fail to maintain or resolve them later. Finally, model-level interventions can improve EH, but often at the cost of task accuracy, suggesting that epistemic humility emerges from the interaction among the backbone model, the agent harness and the evaluation environment.
