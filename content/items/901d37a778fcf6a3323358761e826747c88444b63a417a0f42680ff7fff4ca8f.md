---
publish: true
content_type: "post"
title: "Embodied Turing Machines: Stateful Code as Robot Policy for Recursive Self-Improvement"
description: "Most robot policies keep a model in the control loop: a vision-language-action (VLA) model maps observations to actions, or an agent harness such as Agent-as-Policy or Harness VLA queries a vision-language model for decisions at run time. T"
date: "2026-10-08T17:29:08.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:59.851Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12369v1"
tags: ["source/arxiv","topics/agents","topics/research","topics/hardware"]
---

Most robot policies keep a model in the control loop: a vision-language-action &#40;VLA&#41; model maps observations to actions, or an agent harness such as Agent-as-Policy or Harness VLA queries a vision-language model for decisions at run time. The authors propose a different view, treating the embodied world as an Embodied Turing Machine whose tape is the robot and environment state and whose rules are the policy. If that state can be represented accurately, decision making can be written entirely in code.

They therefore propose Code-Only-as-Policy &#40;COAP&#41;: code measures and tracks robot, environment and task state from camera images and proprioception, and makes every decision from it. The same code applies across episodes, and different tasks share one library without a VLM or VLA in the loop. The authors analyze three advantages over VLAs and agent harnesses: explicit state, since state can be stored in code; execution, since code makes decision making controllable, able to recover from failures flexibly and cheap to run online; and extensibility, since new tasks reuse, inherit or extend the shared library so capabilities accumulate. These properties, they argue, make COAP suitable for recursive self-improvement, with coding agents developing the library in a closed loop where each change is explicit and controllable.

On RoboDojo's 42 bimanual tasks, the resulting library reaches a 70.24% success rate with no model at test time. The authors state the upper bound of COAP depends on how accurately state is represented for decisions and how robust the code logic is, and suggest COAP can also serve as a data engine for VLAs and agent harnesses.
